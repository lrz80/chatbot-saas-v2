"use client";

import { useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "../i18n/LanguageProvider";


type CTA = { id?: number; intent: string; cta_text: string; cta_url: string; canal?: string };

const ALLOWED_INTENTS = [
  "precio",
  "horario",
  "ubicacion",
  "reservar",
  "comprar",
  "confirmar",
  "interes_clases",
];

// Validación simple de URL http(s)
const isValidUrl = (u?: string) => {
  if (!u) return false;
  if (!/^https?:\/\//i.test(u)) return false;
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
};

export default function CTASection({
  canal = "whatsapp",
  membresiaActiva = true,
}: {
  canal?: string;
  membresiaActiva?: boolean;
}) {
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [ctas, setCtas] = useState<CTA[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

const reload = async () => {
  setLoading(true);
  setError(null);
  try {
    const r = await fetch(`${BACKEND_URL}/api/ctas?canal=${encodeURIComponent(canal)}`, {
      credentials: "include",
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || "Error cargando CTAs");

    const list: CTA[] = Array.isArray(data)
      ? data.map((x: any) => ({
          id: x.id,
          intent: String(x.intent || "").trim(),
          cta_text: String(x.cta_text || "").trim(),
          cta_url: String(x.cta_url || "").trim(),
        }))
      : [];

    setCtas(list);
  } catch (e: any) {
    console.error("❌ Error cargando CTAs:", e);
    setError(e.message || "Error cargando CTAs");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [canal]);

  const usedIntents = useMemo(() => new Set(ctas.map((c) => c.intent)), [ctas]);

  const addRow = () => {
    const free = ALLOWED_INTENTS.find((i) => !usedIntents.has(i)) || "global";
    setCtas((prev) => [...prev, { intent: free, cta_text: "", cta_url: "" }]);
  };

  const removeRow = async (idx: number) => {
  const row = ctas[idx];
  if (!row) return;

  if (!confirm(`Eliminar CTA para la intención "${row.intent}"?`)) return;

  setSaving(true);
  setError(null);
  setOkMsg(null);

  try {
    const url = `${BACKEND_URL}/api/ctas/${encodeURIComponent(row.intent.toLowerCase())}?canal=${encodeURIComponent(canal)}`;
    const r = await fetch(url, { method: "DELETE", credentials: "include" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j?.error || "No se pudo eliminar el CTA en el servidor");
    }

    setOkMsg("CTA eliminado correctamente ✅");
    await reload();

  } catch (e: any) {
    console.error("❌ Error eliminando CTA:", e);
    setError(e.message || "Error eliminando CTA");
  } finally {
    setSaving(false);
  }
};

  const updateRow = (idx: number, patch: Partial<CTA>) => {
    setCtas((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const save = async () => {
    if (!membresiaActiva) return;

    setSaving(true);
    setError(null);
    setOkMsg(null);

    // Validaciones: intenciones permitidas, únicas y URLs válidas
    const intents = new Set<string>();
    for (const row of ctas) {
      if (!ALLOWED_INTENTS.includes(row.intent)) {
        setSaving(false);
        return setError(`Intención inválida: "${row.intent}".`);
      }
      if (intents.has(row.intent)) {
        setSaving(false);
        return setError(`No repitas la misma intención: "${row.intent}".`);
      }
      intents.add(row.intent);
      if (row.cta_url && !isValidUrl(row.cta_url)) {
        setSaving(false);
        return setError(`URL inválida en "${row.intent}". Debe iniciar con http(s)://`);
      }
    }

    try {
      // Guardado "bulk": para cada fila, si tiene intent + (texto+url) => POST (upsert)
      // si está vacía (texto y url vacíos) y tiene id => DELETE
      for (const row of ctas) {
        const intent = row.intent.trim().toLowerCase();
        const text = (row.cta_text || "").trim();
        const url = (row.cta_url || "").trim();

        // borrar si ambos vacíos -> DELETE por intent+canal
        if (!text && !url) {
        const delUrl = `${BACKEND_URL}/api/ctas/${encodeURIComponent(intent)}?canal=${encodeURIComponent(canal)}`;
        const delRes = await fetch(delUrl, { method: "DELETE", credentials: "include" });
        if (!delRes.ok) {
            const j = await delRes.json().catch(() => ({}));
            throw new Error(j?.error || `Error eliminando CTA "${intent}"`);
        }
        continue;
        }

        // crear/actualizar si completos
        if (intent && text && url) {
          const res = await fetch(`${BACKEND_URL}/api/ctas`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intent, cta_text: text, cta_url: url, canal }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Error guardando CTA "${intent}"`);
          }
        }
      }

      setOkMsg("CTAs guardados correctamente ✅");
      await reload();

    } catch (e: any) {
      console.error("❌ Error guardando CTAs:", e);
      setError(e.message || "Error guardando CTAs");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm opacity-75">{t("cta.loading")}</div>;

  return (
    <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">{t("cta.title")}</h3>
        <button
          onClick={addRow}
          disabled={!membresiaActiva}
          className={`px-3 py-1 rounded text-sm ${
            membresiaActiva ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-600 text-white/50"
          }`}
        >
          {t("cta.add")}
        </button>
      </div>

      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      {okMsg && <div className="text-green-300 text-sm mb-2">{okMsg}</div>}

      <div className="space-y-2">
        {ctas.map((row, idx) => {
          const options = ALLOWED_INTENTS.map((opt) => ({
            value: opt,
            label: opt === "global" ? "global (fallback)" : opt,
          }));

          return (
            <div key={row.id ?? `row-${idx}`} className="grid grid-cols-12 gap-2 items-start bg-white/10 border border-white/10 p-3 rounded">
              <div className="col-span-12 md:col-span-3">
                <label className="text-xs block mb-1">{t("cta.intent")}</label>
                <select
                  className="w-full border rounded-md px-2 py-2 bg-white text-black"
                  value={row.intent}
                  onChange={(e) => updateRow(idx, { intent: e.target.value })}
                  disabled={!membresiaActiva}
                >
                  {options.map((o) => (
                    <option
                      key={o.value}
                      value={o.value}
                      disabled={o.value !== row.intent && usedIntents.has(o.value)}
                    >
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] opacity-70 mt-1">{t("cta.noRepeat")}</p>
              </div>

              <div className="col-span-12 md:col-span-4">
                <label className="text-xs block mb-1">{t("cta.text")}</label>
                <input
                  className="w-full border rounded-md px-3 py-2 bg-white/5 border-white/20 text-white"
                  placeholder={t("cta.textPlaceholder")}
                  value={row.cta_text}
                  onChange={(e) => updateRow(idx, { cta_text: e.target.value })}
                  disabled={!membresiaActiva}
                />
              </div>

              <div className="col-span-12 md:col-span-4">
                <label className="text-xs block mb-1">{t("cta.url")}</label>
                <input
                  className="w-full border rounded-md px-3 py-2 bg-white/5 border-white/20 text-white"
                  placeholder={t("cta.urlPlaceholder")}
                  value={row.cta_url}
                  onChange={(e) => updateRow(idx, { cta_url: e.target.value })}
                  disabled={!membresiaActiva}
                />
                <p className="text-[11px] opacity-70 mt-1">
                  {t("cta.deleteIfEmpty")}
                </p>
              </div>

              <div className="col-span-12 md:col-span-1 flex md:justify-end">
                <button
                  className="text-red-300 text-sm underline mt-6"
                  onClick={() => removeRow(idx)}
                  disabled={!membresiaActiva}
                >
                  {t("cta.delete")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-3">
        <button
          onClick={save}
          disabled={!membresiaActiva || saving}
          className={`px-4 py-2 rounded ${
            membresiaActiva ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-600 text-white/50"
          } disabled:opacity-50`}
        >
          {saving ? t("cta.saving") : t("cta.save")}
        </button>
      </div>

      <p className="text-xs text-gray-300 mt-2">
        {t("cta.hint")}
      </p>
    </div>
  );
}
