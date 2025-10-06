"use client";

import { useMemo } from "react";
import { SiTarget, SiPaperspace, SiChatbot } from "react-icons/si";

export type Intent = {
  nombre: string;
  ejemplos: string[];
  respuesta: string;
};

type IntentSectionProps = {
  intents: Intent[];
  setIntents: (next: Intent[]) => void;
  canal: string; // ej: "whatsapp"
  membresiaActiva: boolean;
  onSave: () => Promise<void> | void; // lo define el padre (igual que FaqSection/FlowSection)
};

export default function IntentSection({
  intents,
  setIntents,
  canal,
  membresiaActiva,
  onSave,
}: IntentSectionProps) {
  const canEdit = membresiaActiva;

  const addIntent = () => {
    if (!canEdit) return;
    setIntents([
      ...intents,
      { nombre: "", ejemplos: [], respuesta: "" },
    ]);
  };

  const deleteIntent = (idx: number) => {
    if (!canEdit) return;
    setIntents(intents.filter((_, i) => i !== idx));
  };

  const duplicateIntent = (idx: number) => {
    if (!canEdit) return;
    const item = intents[idx];
    const copy = {
      nombre: (item.nombre || "") + " (copia)",
      ejemplos: [...(item.ejemplos || [])],
      respuesta: item.respuesta || "",
    };
    const next = [...intents];
    next.splice(idx + 1, 0, copy);
    setIntents(next);
  };

  const updateIntentField = (
    idx: number,
    field: keyof Intent,
    value: string
  ) => {
    if (!canEdit) return;
    const next = [...intents];
    if (field === "ejemplos") {
      next[idx].ejemplos = value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (field === "nombre") {
      next[idx].nombre = value;
    } else if (field === "respuesta") {
      next[idx].respuesta = value;
    }
    setIntents(next);
  };

  const total = useMemo(() => intents.length, [intents]);

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
        <div key={i} className="mb-6 bg-white/10 border border-white/20 p-4 rounded-lg">
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
              onClick={() => {
                if (!canEdit) return;
                if (confirm(`¿Eliminar la intención "${item.nombre || "(sin nombre)"}"?`)) {
                  deleteIntent(i);
                }
              }}
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
          onClick={onSave}
          disabled={!canEdit}
          className={`px-4 py-2 rounded ${
            canEdit ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-600 text-white/50 cursor-not-allowed"
          }`}
        >
          Guardar Intenciones ({total})
        </button>
      </div>
    </section>
  );
}
