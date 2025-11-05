// components/CTASection.tsx
import { useEffect, useMemo, useState } from "react";

type CTA = { intent: string; cta_text: string; cta_url: string };
const ALLOWED_INTENTS = [
  "global","precio","horario","ubicacion","reservar","comprar","confirmar","interes_clases","clases_online"
];

const isValidUrl = (u?: string) => {
  if (!u) return false;
  if (!/^https?:\/\//i.test(u)) return false;
  try { new URL(u); return true; } catch { return false; }
};

export default function CTASection() {
  const [loading, setLoading] = useState(true);
  const [ctas, setCtas] = useState<CTA[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch("/api/settings", { credentials: "include" });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Error cargando settings");

        // Construye array desde ctas_by_intent (record intent -> {cta_text, cta_url})
        const list: CTA[] = [];
        const rec = data?.ctas_by_intent || {};
        for (const intent of Object.keys(rec)) {
          const t = rec[intent]?.cta_text || "";
          const u = rec[intent]?.cta_url || "";
          if (t || u) list.push({ intent, cta_text: t, cta_url: u });
        }
        // si no hay ninguno, agrega 1 fila "global" vacía de cortesía
        setCtas(list.length ? list : [{ intent: "global", cta_text: "", cta_url: "" }]);
      } catch (e:any) {
        setError(e.message || "Error cargando settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const usedIntents = useMemo(() => new Set(ctas.map(c => c.intent)), [ctas]);

  const addRow = () => {
    // intenta sugerir la primera intención disponible
    const free = ALLOWED_INTENTS.find(i => !usedIntents.has(i)) || "global";
    setCtas(prev => [...prev, { intent: free, cta_text: "", cta_url: "" }]);
  };

  const removeRow = (idx: number) => {
    setCtas(prev => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, patch: Partial<CTA>) => {
    setCtas(prev => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setOkMsg(null);

    // Validaciones: intenciones únicas y URLs válidas si no están vacías
    const intents = new Set<string>();
    for (const row of ctas) {
      if (!ALLOWED_INTENTS.includes(row.intent)) {
        setSaving(false);
        return setError(`Intención inválida: ${row.intent}`);
      }
      if (intents.has(row.intent)) {
        setSaving(false);
        return setError(`No repitas intención: ${row.intent}`);
      }
      intents.add(row.intent);
      if (row.cta_url && !isValidUrl(row.cta_url)) {
        setSaving(false);
        return setError(`URL inválida en "${row.intent}". Debe iniciar con http(s)://`);
      }
    }

    // Backend borra el CTA de una intención si ambos campos llegan vacíos; mantenemos filas vacías si el usuario las deja.
    const payload = { ctas: ctas.map(({ intent, cta_text, cta_url }) => ({ intent, cta_text, cta_url })) };

    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Error guardando CTAs");
      setOkMsg("CTAs guardados correctamente.");
    } catch (e:any) {
      setError(e.message || "Error guardando CTAs");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm opacity-75">Cargando CTAs…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">CTA por intención</h3>
        <button onClick={addRow} className="px-3 py-1 rounded-lg border">
          + Agregar CTA
        </button>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}
      {okMsg && <div className="text-green-600 text-sm">{okMsg}</div>}

      <div className="space-y-2">
        {ctas.map((row, idx) => {
          const options = ALLOWED_INTENTS.map((opt) => ({
            value: opt,
            label: opt === "global" ? "global (fallback)" : opt
          }));

          return (
            <div key={idx} className="grid grid-cols-12 gap-2 items-start border rounded-xl p-3">
              <div className="col-span-3">
                <label className="text-xs block mb-1">Intención</label>
                <select
                  className="w-full border rounded-md px-2 py-2 bg-white"
                  value={row.intent}
                  onChange={(e) => updateRow(idx, { intent: e.target.value })}
                >
                  {options.map(o => (
                    <option key={o.value} value={o.value} disabled={o.value !== row.intent && usedIntents.has(o.value)}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] opacity-70 mt-1">No repitas la misma intención.</p>
              </div>

              <div className="col-span-4">
                <label className="text-xs block mb-1">Texto del CTA</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Ej: Reserva tu clase aquí"
                  value={row.cta_text}
                  onChange={(e) => updateRow(idx, { cta_text: e.target.value })}
                />
              </div>

              <div className="col-span-4">
                <label className="text-xs block mb-1">Link del CTA</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="https://..."
                  value={row.cta_url}
                  onChange={(e) => updateRow(idx, { cta_url: e.target.value })}
                />
                <p className="text-[11px] opacity-70 mt-1">
                  Si dejas <b>texto</b> y <b>link</b> vacíos, se eliminará ese CTA en el backend.
                </p>
              </div>

              <div className="col-span-1 flex justify-end">
                <button
                  className="text-red-600 text-sm underline mt-6"
                  onClick={() => removeRow(idx)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar CTAs"}
        </button>
      </div>
    </div>
  );
}
