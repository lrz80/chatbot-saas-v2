//src/components/AppointmentBookingFlowCard.tsx
"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";

type BookingStep = {
  id?: string;
  step_key: string;
  step_order: number;
  prompt: string;
  retry_prompt?: string;
  validation_config?: any;
  expected_type: "text" | "datetime" | "confirmation" | "phone" | "email" | "number";
  required: boolean;
  enabled: boolean;
};

const EXPECTED_TYPES = [
  "text",
  "datetime",
  "confirmation",
  "phone",
  "email",
  "number",
] as const;

const DEFAULT_STEPS: BookingStep[] = [
  {
    step_key: "service",
    step_order: 1,
    prompt: "¿Qué servicio te interesa?",
    expected_type: "text",
    required: true,
    enabled: true,
  },
  {
    step_key: "datetime",
    step_order: 2,
    prompt: "¿Qué día y hora te gustaría?",
    expected_type: "datetime",
    required: true,
    enabled: true,
  },
  {
    step_key: "confirm",
    step_order: 3,
    prompt: "Te tengo para {service} el {datetime}. ¿Confirmas?",
    expected_type: "confirmation",
    required: true,
    enabled: true,
  },
  {
    step_key: "success",
    step_order: 999,
    prompt: "Tu cita quedó confirmada para {service} el {datetime}. ¿Te ayudo en algo más?",
    expected_type: "text",
    required: false,
    enabled: true
  }
];

export default function AppointmentBookingFlowCard() {
  const [steps, setSteps] = useState<BookingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const loadFlow = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${BACKEND_URL}/api/appointment-booking-flow`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setSteps(data.steps?.length ? data.steps : DEFAULT_STEPS);
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar el flujo de booking.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlow();
  }, []);

  const updateStep = (index: number, patch: Partial<BookingStep>) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, ...patch } : step))
    );
  };

  const addStep = () => {
    const nextOrder =
      steps.length > 0 ? Math.max(...steps.map((s) => Number(s.step_order) || 0)) + 1 : 1;

    setSteps((prev) => [
      ...prev,
      {
        step_key: `custom_${nextOrder}`,
        step_order: nextOrder,
        prompt: "Escribe aquí la pregunta que Amy debe hacer.",
        expected_type: "text",
        required: true,
        enabled: true,
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const saveFlow = async () => {
    try {
      setSaving(true);
      setError(null);
      setOk(null);

      const normalized = steps
        .map((step) => ({
          ...step,
          step_key: step.step_key.trim(),
          prompt: step.prompt.trim(),
          step_order: Number(step.step_order),
        }))
        .sort((a, b) => a.step_order - b.step_order);

      const hasConfirm = normalized.some(
        (step) => step.enabled && step.expected_type === "confirmation"
      );

      if (!hasConfirm) {
        throw new Error("El flujo necesita al menos un paso de confirmación.");
      }

      const res = await fetch(`${BACKEND_URL}/api/appointment-booking-flow`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          steps: normalized,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setSteps(data.steps || normalized);
      setOk("Flujo guardado correctamente.");
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el flujo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Voice booking flow
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Edita las preguntas que Amy hará cuando un cliente quiera agendar por voz.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadFlow}
            disabled={loading || saving}
            className="px-3 py-2 rounded-xl text-sm font-semibold border border-white/10 bg-white/10 hover:bg-white/15 disabled:opacity-60"
          >
            Recargar
          </button>

          <button
            type="button"
            onClick={saveFlow}
            disabled={loading || saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar flujo"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {ok && (
        <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {ok}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-white/60 py-4">Cargando flujo...</div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={`${step.step_key}-${index}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-xs text-white/60 mb-1">
                    Orden
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={step.step_order}
                    onChange={(e) =>
                      updateStep(index, { step_order: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-xs text-white/60 mb-1">
                    Step key
                  </label>
                  <input
                    type="text"
                    value={step.step_key}
                    onChange={(e) =>
                      updateStep(index, { step_key: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-xs text-white/60 mb-1">
                    Tipo esperado
                  </label>
                  <select
                    value={step.expected_type}
                    onChange={(e) =>
                      updateStep(index, {
                        expected_type: e.target.value as BookingStep["expected_type"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white"
                  >
                    {EXPECTED_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2 flex items-end gap-2">
                  <label className="inline-flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={step.required}
                      onChange={(e) =>
                        updateStep(index, { required: e.target.checked })
                      }
                    />
                    Requerido
                  </label>
                </div>

                <div className="lg:col-span-2 flex items-end gap-2">
                  <label className="inline-flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={step.enabled}
                      onChange={(e) =>
                        updateStep(index, { enabled: e.target.checked })
                      }
                    />
                    Activo
                  </label>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs text-white/60 mb-1">
                  Pregunta de Amy
                </label>
                <textarea
                  value={step.prompt}
                  onChange={(e) => updateStep(index, { prompt: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white resize-y"
                />
                <p className="text-[11px] text-white/40 mt-1">
                  Puedes usar variables como {"{service}"} y {"{datetime}"} en el paso de confirmación.
                </p>
              </div>

              <div className="mt-3">
                <label className="block text-xs text-white/60 mb-1">
                    Pregunta si no entiende (retry)
                </label>
                <textarea
                    value={step.retry_prompt || ""}
                    onChange={(e) =>
                    updateStep(index, { retry_prompt: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white resize-y"
                />
                </div>

                <div className="mt-3">
                <label className="block text-xs text-white/60 mb-2">
                    Reglas de validación
                </label>

                {step.expected_type === "datetime" && (
                    <div className="flex gap-4 text-sm">
                    <label>
                        <input
                        type="checkbox"
                        checked={step.validation_config?.requires_date || false}
                        onChange={(e) =>
                            updateStep(index, {
                            validation_config: {
                                ...step.validation_config,
                                requires_date: e.target.checked,
                            },
                            })
                        }
                        /> Fecha
                    </label>

                    <label>
                        <input
                        type="checkbox"
                        checked={step.validation_config?.requires_time || false}
                        onChange={(e) =>
                            updateStep(index, {
                            validation_config: {
                                ...step.validation_config,
                                requires_time: e.target.checked,
                            },
                            })
                        }
                        /> Hora
                    </label>
                    </div>
                )}
                </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold bg-red-600/70 hover:bg-red-600"
                >
                  Eliminar paso
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addStep}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 bg-white/10 hover:bg-white/15"
          >
            + Agregar paso
          </button>
        </div>
      )}
    </div>
  );
}