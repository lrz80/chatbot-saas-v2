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
  prompt_translations?: Record<string, string>;
  retry_prompt_translations?: Record<string, string>;
  validation_config?: any;
  expected_type: "text" | "datetime" | "confirmation" | "phone" | "email" | "number";
  required: boolean;
  enabled: boolean;
};

type BookingSlot =
  | "none"
  | "service"
  | "datetime"
  | "customer_name"
  | "customer_phone"
  | "customer_email"
  | "confirmation";

const BOOKING_SLOTS: BookingSlot[] = [
  "none",
  "service",
  "datetime",
  "customer_name",
  "customer_phone",
  "customer_email",
  "confirmation",
];

const PHONE_MODES = [
  "free_input",
  "confirm_or_replace",
] as const;

const EXPECTED_TYPES = [
  "text",
  "datetime",
  "confirmation",
  "phone",
  "email",
  "number",
] as const;

const BOOKING_FLOW_LOCALES = [
  { value: "es-ES", label: "Español" },
  { value: "en-US", label: "English" },
] as const;

const PRIMARY_BOOKING_FLOW_LOCALE = "es-ES";

function normalizeLocalizedMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, rawValue]) => [String(key).trim(), String(rawValue ?? "").trim()])
      .filter(([key, text]) => key && text)
  );
}

function buildLocalizedMapFromStep(params: {
  existing?: Record<string, string>;
  fallbackValue?: string;
}) {
  return Object.fromEntries(
    BOOKING_FLOW_LOCALES.map(({ value }, localeIndex) => [
      value,
      (
        params.existing?.[value] ||
        (localeIndex === 0 ? params.fallbackValue || "" : "")
      ).trim(),
    ]).filter(([, value]) => value)
  );
}

const DEFAULT_STEPS: BookingStep[] = [
  {
    step_key: "service",
    step_order: 1,
    prompt: "¿Qué servicio te interesa?",
    prompt_translations: {
      "es-ES": "¿Qué servicio te interesa?",
      "en-US": "What service are you interested in?",
    },
    expected_type: "text",
    required: true,
    enabled: true,
    validation_config: {
      slot: "service",
    },
  },
  {
    step_key: "datetime",
    step_order: 2,
    prompt: "¿Qué día y hora te gustaría?",
    prompt_translations: {
      "es-ES": "¿Qué día y hora te gustaría?",
      "en-US": "What day and time would you prefer?",
    },
    retry_prompt: "¿Puedes repetirme qué día y hora te gustaría?",
    retry_prompt_translations: {
      "es-ES": "¿Puedes repetirme qué día y hora te gustaría?",
      "en-US": "Can you repeat what day and time you would prefer?",
    },
    expected_type: "datetime",
    required: true,
    enabled: true,
    validation_config: {
      slot: "datetime",
      requires_date: true,
      requires_time: true,
    },
  },
  {
    step_key: "customer_name",
    step_order: 3,
    prompt: "¿Cuál es tu nombre y apellido?",
    prompt_translations: {
      "es-ES": "¿Cuál es tu nombre y apellido?",
      "en-US": "What is your first and last name?",
    },
    retry_prompt: "¿Puedes repetirme tu nombre y apellido, por favor?",
    retry_prompt_translations: {
      "es-ES": "¿Puedes repetirme tu nombre y apellido, por favor?",
      "en-US": "Can you repeat your first and last name, please?",
    },
    expected_type: "text",
    required: true,
    enabled: true,
    validation_config: {
      slot: "customer_name",
    },
  },
  {
    step_key: "customer_phone",
    step_order: 4,
    prompt: "¿Este es el mejor número para contactarte?",
    prompt_translations: {
      "es-ES": "¿Este es el mejor número para contactarte?",
      "en-US": "Is this the best number to contact you?",
    },
    retry_prompt: "No pude confirmarlo. Si quieres usar este mismo número, responde sí. Si no, dicta otro número.",
    retry_prompt_translations: {
      "es-ES": "No pude confirmarlo. Si quieres usar este mismo número, responde sí. Si no, dicta otro número.",
      "en-US": "I couldn't confirm it. If you want to use this same number, say yes. Otherwise, say another number.",
    },
    expected_type: "phone",
    required: true,
    enabled: true,
    validation_config: {
      slot: "customer_phone",
      mode: "confirm_or_replace",
      use_inbound_caller: true,
      mask_in_prompt: true,
    },
  },
  {
    step_key: "confirm",
    step_order: 5,
    prompt: "Te tengo para {service} el {datetime}. ¿Confirmas?",
    prompt_translations: {
      "es-ES": "Te tengo para {service} el {datetime}. ¿Confirmas?",
      "en-US": "I have you down for {service} on {datetime}. Do you confirm?",
    },
    retry_prompt: "¿Me confirmas si deseas agendar esta cita?",
    retry_prompt_translations: {
      "es-ES": "¿Me confirmas si deseas agendar esta cita?",
      "en-US": "Can you confirm if you want to book this appointment?",
    },
    expected_type: "confirmation",
    required: true,
    enabled: true,
    validation_config: {
      slot: "confirmation",
      cancel_message: "No hay problema. No se realizó la reserva. ¿Puedo ayudarte con algo más?",
      cancel_message_translations: {
        "es-ES": "No hay problema. No se realizó la reserva. ¿Puedo ayudarte con algo más?",
        "en-US": "No problem. The appointment was not booked. Can I help you with anything else?",
      },
    },
  },
  {
    step_key: "success",
    step_order: 999,
    prompt: "Tu cita quedó confirmada para {service} el {datetime}. ¿Te ayudo en algo más?",
    prompt_translations: {
      "es-ES": "Tu cita quedó confirmada para {service} el {datetime}. ¿Te ayudo en algo más?",
      "en-US": "Your appointment is confirmed for {service} on {datetime}. Can I help you with anything else?",
    },
    expected_type: "text",
    required: false,
    enabled: true,
    validation_config: {
      slot: "none",
    },
  },
];

function normalizeStepOrders(inputSteps: BookingStep[]): BookingStep[] {
  return inputSteps.map((step, index) => ({
    ...step,
    step_order: index + 1,
  }));
}

function buildNewCustomStep(nextVisualOrder: number): BookingStep {
  return {
    step_key: `custom_${nextVisualOrder}`,
    step_order: nextVisualOrder,
    prompt: "Escribe aquí la pregunta que Amy debe hacer.",
    prompt_translations: {
      "es-ES": "Escribe aquí la pregunta que Amy debe hacer.",
      "en-US": "",
    },
    retry_prompt: "",
    retry_prompt_translations: {
      "es-ES": "",
      "en-US": "",
    },
    expected_type: "text",
    required: true,
    enabled: true,
    validation_config: {
      slot: "none",
    },
  };
}

function buildOfferBookingSmsStep(nextVisualOrder: number): BookingStep {
  return {
    step_key: "offer_booking_sms",
    step_order: nextVisualOrder,
    prompt: "¿Quieres que te envíe por SMS los detalles de tu reserva?",
    prompt_translations: {
      "es-ES": "¿Quieres que te envíe por SMS los detalles de tu reserva?",
      "en-US": "Would you like me to send your booking details by SMS?",
    },
    retry_prompt: "Por favor dime sí o no. ¿Quieres que te envíe los detalles por SMS?",
    retry_prompt_translations: {
      "es-ES": "Por favor dime sí o no. ¿Quieres que te envíe los detalles por SMS?",
      "en-US": "Please say yes or no. Would you like me to send your booking details by SMS?",
    },
    expected_type: "confirmation",
    required: false,
    enabled: true,
    validation_config: {
      slot: "none",
      cancel_message: "Perfecto, no te envío el SMS.",
      cancel_message_translations: {
        "es-ES": "Perfecto, no te envío el SMS.",
        "en-US": "Perfect, I won't send the SMS.",
      },
    },
  };
}

function insertStepAt(
  currentSteps: BookingStep[],
  insertIndex: number
): BookingStep[] {
  const safeIndex = Math.max(0, Math.min(insertIndex, currentSteps.length));
  const nextVisualOrder = safeIndex + 1;

  const next = [...currentSteps];
  next.splice(safeIndex, 0, buildNewCustomStep(nextVisualOrder));

  return normalizeStepOrders(next);
}

function removeStepAt(
  currentSteps: BookingStep[],
  removeIndex: number
): BookingStep[] {
  const next = currentSteps.filter((_, index) => index !== removeIndex);
  return normalizeStepOrders(next);
}

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
    setSteps((prev) => insertStepAt(prev, prev.length));
  };

  const addStepAbove = (index: number) => {
    setSteps((prev) => insertStepAt(prev, index));
  };

  const addStepBelow = (index: number) => {
    setSteps((prev) => insertStepAt(prev, index + 1));
  };

  const addOfferBookingSmsBelow = (index: number) => {
    setSteps((prev) => {
      const insertIndex = Math.max(0, Math.min(index + 1, prev.length));
      const next = [...prev];
      const nextVisualOrder = insertIndex + 1;

      next.splice(insertIndex, 0, buildOfferBookingSmsStep(nextVisualOrder));

      return normalizeStepOrders(next);
    });
  };

  const removeStep = (index: number) => {
    setSteps((prev) => removeStepAt(prev, index));
  };

  const saveFlow = async () => {
    try {
      setSaving(true);
      setError(null);
      setOk(null);

      const normalized = normalizeStepOrders(steps).map((step) => {
        const promptTranslations = Object.fromEntries(
          BOOKING_FLOW_LOCALES.map(({ value }) => [
            value,
            (step.prompt_translations?.[value] || "").trim(),
          ]).filter(([, value]) => value)
        );

        const retryPromptTranslations = Object.fromEntries(
          BOOKING_FLOW_LOCALES.map(({ value }) => [
            value,
            (step.retry_prompt_translations?.[value] || "").trim(),
          ]).filter(([, value]) => value)
        );

        const promptFallback =
          promptTranslations[PRIMARY_BOOKING_FLOW_LOCALE] ||
          Object.values(promptTranslations)[0] ||
          "";

        const retryPromptFallback =
          retryPromptTranslations[PRIMARY_BOOKING_FLOW_LOCALE] ||
          Object.values(retryPromptTranslations)[0] ||
          "";

        return {
          ...step,
          step_key: step.step_key.trim(),
          prompt: promptFallback,
          retry_prompt: retryPromptFallback,
          step_order: Number(step.step_order),
          prompt_translations: promptTranslations,
          retry_prompt_translations: retryPromptTranslations,
          validation_config: {
            slot: step.validation_config?.slot || "none",
            ...(step.validation_config || {}),
            cancel_message_translations: buildLocalizedMapFromStep({
              existing: normalizeLocalizedMap(step.validation_config?.cancel_message_translations),
              fallbackValue: step.validation_config?.cancel_message || "",
            }),
            unavailable_prompt_translations: buildLocalizedMapFromStep({
              existing: normalizeLocalizedMap(step.validation_config?.unavailable_prompt_translations),
              fallbackValue: step.validation_config?.unavailable_prompt || "",
            }),
          },
        };
      });

      const hasConfirm = normalized.some(
        (step) => step.enabled && step.expected_type === "confirmation"
      );

      if (!hasConfirm) {
        throw new Error("El flujo necesita al menos un paso de confirmación.");
      }

      const activeSteps = normalized.filter((step) => step.enabled);

      const hasDatetimeSlot = activeSteps.some(
        (step) => step.validation_config?.slot === "datetime"
      );

      const hasConfirmationSlot = activeSteps.some(
        (step) => step.validation_config?.slot === "confirmation"
      );

      if (!hasDatetimeSlot) {
        throw new Error("El flujo necesita un paso con slot datetime.");
      }

      if (!hasConfirmationSlot) {
        throw new Error("El flujo necesita un paso con slot confirmation.");
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
                    value={step.step_order}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 cursor-not-allowed"
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

                <div className="lg:col-span-3">
                  <label className="block text-xs text-white/60 mb-1">
                    Slot de cita
                  </label>
                  <select
                    value={step.validation_config?.slot || "none"}
                    onChange={(e) =>
                      updateStep(index, {
                        validation_config: {
                        ...step.validation_config,
                        slot: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white"
                >
                    {BOOKING_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {BOOKING_FLOW_LOCALES.map(({ value, label }) => (
                    <div key={`prompt-${value}`}>
                      <label className="block text-xs text-white/60 mb-1">
                        Prompt {label}
                      </label>
                      <textarea
                        value={step.prompt_translations?.[value] || ""}
                        onChange={(e) =>
                          updateStep(index, {
                            prompt_translations: {
                              ...(step.prompt_translations || {}),
                              [value]: e.target.value,
                            },
                          })
                        }
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white resize-y"
                      />
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-white/40 mt-1">
                  Puedes usar variables como {"{service}"} y {"{datetime}"} en el paso de confirmación.
                </p>
              </div>

              <div className="mt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {BOOKING_FLOW_LOCALES.map(({ value, label }) => (
                    <div key={`retry-${value}`}>
                      <label className="block text-xs text-white/60 mb-1">
                        Retry {label}
                      </label>
                      <textarea
                        value={step.retry_prompt_translations?.[value] || ""}
                        onChange={(e) =>
                          updateStep(index, {
                            retry_prompt_translations: {
                              ...(step.retry_prompt_translations || {}),
                              [value]: e.target.value,
                            },
                          })
                        }
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white resize-y"
                      />
                    </div>
                  ))}
                </div>
              </div>

                <div className="mt-3">
                  <label className="block text-xs text-white/60 mb-2">
                      Reglas de validación
                  </label>

                {step.expected_type === "datetime" && (
                <div className="space-y-3 text-sm">
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
                        />{" "}
                        Fecha
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
                        />{" "}
                        Hora
                    </label>
                    </div>

                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {BOOKING_FLOW_LOCALES.map(({ value, label }) => (
                          <div key={`unavailable-prompt-${value}`}>
                            <label className="block text-xs text-white/60 mb-1">
                              Unavailable prompt {label}
                            </label>
                            <textarea
                              value={step.validation_config?.unavailable_prompt_translations?.[value] || ""}
                              onChange={(e) =>
                                updateStep(index, {
                                  validation_config: {
                                    ...step.validation_config,
                                    unavailable_prompt_translations: {
                                      ...(step.validation_config?.unavailable_prompt_translations || {}),
                                      [value]: e.target.value,
                                    },
                                  },
                                })
                              }
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white resize-y"
                            />
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-white/40 mt-1">
                        Puedes usar variables como {"{requested_service}"} y {"{available_times}"}.
                      </p>
                    </div>
                  </div>
                )}

                {step.expected_type === "confirmation" && (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {BOOKING_FLOW_LOCALES.map(({ value, label }) => (
                        <div key={`cancel-message-${value}`}>
                          <label className="block text-xs text-white/60 mb-1">
                            Cancel message {label}
                          </label>
                          <textarea
                            value={step.validation_config?.cancel_message_translations?.[value] || ""}
                            onChange={(e) =>
                              updateStep(index, {
                                validation_config: {
                                  ...step.validation_config,
                                  cancel_message_translations: {
                                    ...(step.validation_config?.cancel_message_translations || {}),
                                    [value]: e.target.value,
                                  },
                                },
                              })
                            }
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white resize-y"
                          />
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-white/40 mt-1">
                      Este mensaje se usa cuando el cliente responde que no en la confirmación final.
                    </p>
                  </div>
                )}

                {step.expected_type === "phone" && (
                <div className="space-y-3 text-sm">
                    <div>
                    <label className="block text-xs text-white/60 mb-1">
                        Modo de teléfono
                    </label>
                    <select
                        value={step.validation_config?.mode || "free_input"}
                        onChange={(e) =>
                        updateStep(index, {
                            validation_config: {
                            ...step.validation_config,
                            mode: e.target.value,
                            },
                        })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white"
                    >
                        {PHONE_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                            {mode}
                        </option>
                        ))}
                    </select>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-white/80">
                    <input
                        type="checkbox"
                        checked={step.validation_config?.use_inbound_caller || false}
                        onChange={(e) =>
                        updateStep(index, {
                            validation_config: {
                            ...step.validation_config,
                            use_inbound_caller: e.target.checked,
                            },
                        })
                        }
                    />
                    Usar número entrante como candidato
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm text-white/80">
                    <input
                        type="checkbox"
                        checked={step.validation_config?.mask_in_prompt || false}
                        onChange={(e) =>
                        updateStep(index, {
                            validation_config: {
                            ...step.validation_config,
                            mask_in_prompt: e.target.checked,
                            },
                        })
                        }
                    />
                    Mostrar número enmascarado en el prompt
                    </label>
                </div>
                )}
                </div>

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => addStepAbove(index)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold border border-white/10 bg-white/10 hover:bg-white/15"
                >
                  + Agregar arriba
                </button>

                <button
                  type="button"
                  onClick={() => addStepBelow(index)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold border border-white/10 bg-white/10 hover:bg-white/15"
                >
                  + Agregar debajo
                </button>

                <button
                  type="button"
                  onClick={() => addOfferBookingSmsBelow(index)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold bg-blue-600/70 hover:bg-blue-600"
                >
                  + Insertar SMS debajo
                </button>

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