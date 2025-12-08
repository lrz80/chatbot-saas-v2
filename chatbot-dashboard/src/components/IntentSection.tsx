"use client";

import { useMemo } from "react";
import { SiTarget, SiPaperspace, SiChatbot } from "react-icons/si";
import { BACKEND_URL } from "@/utils/api";

export type Intent = {
  id?: number | string;
  nombre: string;
  ejemplos: string[];
  respuesta: string;
};

type Props = {
  intents: Intent[];
  // 👇 acepta forma funcional (prev => next)
  setIntents: React.Dispatch<React.SetStateAction<Intent[]>>;
  canal: string;
  membresiaActiva: boolean;
  onSave: () => Promise<void> | void;
};

export default function IntentSection({
  intents,
  setIntents,
  canal,
  membresiaActiva,
  onSave,
}: Props) {
  const canEdit = membresiaActiva;
  const newId = () =>
    (globalThis?.crypto?.randomUUID?.() ?? `tmp_${Date.now()}_${Math.random()}`);

  const total = useMemo(() => intents.length, [intents]);

  const addIntent = () => {
    if (!canEdit) return;
    setIntents((prev) => [
      ...prev,
      { id: newId(), nombre: "", ejemplos: [], respuesta: "" },
    ]);
  };

  const updateIntentField = (
    idx: number,
    field: keyof Intent,
    value: string
  ) => {
    if (!canEdit) return;
    setIntents((prev) => {
      const next = [...prev];
      if (field === "ejemplos") {
        next[idx].ejemplos = value
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        (next[idx] as any)[field] = value;
      }
      return next;
    });
  };

 const deleteIntent = async (id?: string | number, nombre?: string) => {
    if (!canEdit) return;
    if (!confirm(`¿Eliminar la intención "${nombre || "(sin nombre)"}"?`)) return;

    const isTmp = typeof id === "string" && id.startsWith("tmp_");

    // Si es un ID temporal, solo quita del estado.
    if (!id || isTmp) {
      setIntents((prev) => prev.filter((it) => String(it.id) !== String(id)));
      await onSave?.();
      return;
    }

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/intents/${encodeURIComponent(String(id))}?canal=${encodeURIComponent(canal)}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          // En algunos setups el backend también lee el canal del body; lo mandamos doble por compatibilidad.
          body: JSON.stringify({ canal }),
        }
      );

      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        alert(`❌ Error eliminando intención: ${j?.error || res.statusText}`);
        return;
      }
    } catch (err) {
      console.error("❌ Error eliminando intención:", err);
      alert("❌ No se pudo eliminar. Intenta de nuevo.");
      return;
    }

    // Quita del estado luego del OK real en DB
    setIntents((prev) => prev.filter((it) => String(it.id) !== String(id)));

    // Refresca / vuelve a guardar si lo necesitas
    await onSave?.();
  };

  const duplicateIntent = (idx: number) => {
    if (!canEdit) return;
    setIntents((prev) => {
      const item = prev[idx];
      const copy: Intent = {
        id: newId(),
        nombre: (item?.nombre || "") + " (copia)",
        ejemplos: [...(item?.ejemplos || [])],
        respuesta: item?.respuesta || "",
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  return (
    <section className="mt-12">
      <h3 className="text-xl font-bold mb-2 text-blue-400 flex items-center gap-2">
        Entrenamiento por Intención
      </h3>
      <p className="text-sm text-white/70 mb-4">
        Define intenciones con ejemplos y una respuesta predefinida para
        mejorar la precisión del asistente en el canal <strong>{canal}</strong>.
        <br />
        <strong>Ejemplo:</strong> Intención: <em>reservar</em> | Ejemplos:
        “Quiero agendar”, “Reserva para hoy” | Respuesta: “¡Claro! ¿Qué día prefieres?”
      </p>

      {intents.map((item, i) => (
        <div
          key={String(item.id ?? i)}
          className="mb-6 bg-white/10 border border-white/20 p-4 rounded-lg"
        >
          <label className="block text-sm font-semibold mb-1 flex items-center gap-2">
            <SiTarget /> Intención
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded mb-2 bg-white/10 border-white/20 text-white"
            value={item.nombre}
            onChange={(e) => updateIntentField(i, "nombre", e.target.value)}
            disabled={!canEdit}
          />

          <label className="block text-sm font-semibold mb-1 flex items-center gap-2">
            <SiPaperspace /> Frases de ejemplo (una por línea)
          </label>
          <textarea
            className="w-full p-2 border rounded mb-2 bg-white/10 border-white/20 text-white"
            value={(item.ejemplos || []).join("\n")}
            onChange={(e) => updateIntentField(i, "ejemplos", e.target.value)}
            rows={3}
            disabled={!canEdit}
          />

          <label className="block text-sm font-semibold mb-1 flex items-center gap-2">
            <SiChatbot /> Respuesta del Asistente
          </label>
          <textarea
            className="w-full p-2 border rounded bg-white/10 border-white/20 text-white"
            value={item.respuesta}
            onChange={(e) => updateIntentField(i, "respuesta", e.target.value)}
            rows={2}
            disabled={!canEdit}
          />

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => duplicateIntent(i)}
              disabled={!canEdit}
              className={`px-3 py-1 rounded text-sm ${
                canEdit
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-gray-600 text-white/50 cursor-not-allowed"
              }`}
              title="Duplicar intención"
            >
              Duplicar
            </button>

            <button
              type="button"
              onClick={() => deleteIntent(item.id, item.nombre)}
              disabled={!canEdit}
              className={`px-3 py-1 rounded text-sm ${
                canEdit
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-600 text-white/50 cursor-not-allowed"
              }`}
              title="Eliminar intención"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={addIntent}
          disabled={!canEdit}
          className={`px-4 py-2 rounded ${
            canEdit
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-gray-600 text-white/50 cursor-not-allowed"
          }`}
        >
          ➕ Agregar intención
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={!canEdit}
          className={`px-4 py-2 rounded ${
            canEdit
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-600 text-white/50 cursor-not-allowed"
          }`}
        >
          Guardar Intenciones ({total})
        </button>
      </div>
    </section>
  );
}
