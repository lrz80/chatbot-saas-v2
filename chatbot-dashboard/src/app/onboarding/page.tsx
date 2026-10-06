"use client";

// app/onboarding/page.tsx
//
// Onboarding de Aamy: Website -> Revisar propuesta -> Probar.
// No crea tablas nuevas: guarda con el PATCH /api/settings que ya existe.

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiGlobe,
  FiLoader,
  FiLock,
  FiPhone,
} from "react-icons/fi";

import { BACKEND_URL } from "@/utils/api";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type DayHours = { start: string; end: string } | null;

type Proposal = {
  business_name: string | null;
  category: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  hours: Record<DayKey, DayHours>;
  services: string[];
  policies: string | null;
};

type FormState = {
  business_name: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  services: string; // uno por línea
  policies: string;
  hours: Record<DayKey, DayHours>;
};

type Step = "website" | "analyzing" | "review" | "test";

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

const ANALYZING_MESSAGES = [
  "Leyendo tu sitio web…",
  "Buscando servicios, horarios y datos de contacto…",
  "Organizando la información para Aamy…",
];

const emptyHours = (): Record<DayKey, DayHours> => ({
  mon: null,
  tue: null,
  wed: null,
  thu: null,
  fri: null,
  sat: null,
  sun: null,
});

async function readJson(response: Response): Promise<any> {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { error: raw };
  }
}

function pad(time: string): string {
  // "9:00" -> "09:00" (los <input type="time"> lo necesitan así)
  const [h, m] = time.split(":");
  return `${h.padStart(2, "0")}:${m}`;
}

function proposalToForm(p: Proposal, existingName: string): FormState {
  const hours = emptyHours();
  for (const d of DAYS) {
    const h = p.hours?.[d.key];
    hours[d.key] = h ? { start: pad(h.start), end: pad(h.end) } : null;
  }
  return {
    // Si el negocio ya tiene nombre guardado, se respeta; la web solo llena si está vacío
    business_name: existingName || p.business_name || "",
    category: p.category || "",
    description: p.description || "",
    phone: p.phone || "",
    address: p.address || "",
    services: (p.services || []).join("\n"),
    policies: p.policies || "",
    hours,
  };
}

function buildBusinessInfo(form: FormState): string {
  const parts: string[] = [];
  if (form.description.trim()) parts.push(form.description.trim());

  const services = form.services
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (services.length) {
    parts.push(`Servicios:\n${services.map((s) => `- ${s}`).join("\n")}`);
  }

  if (form.policies.trim()) parts.push(`Políticas:\n${form.policies.trim()}`);
  return parts.join("\n\n");
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-purple-400";
const labelClass = "mb-2 block text-sm font-medium text-white/80";

export default function OnboardingPage() {
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [step, setStep] = useState<Step>("website");
  const [website, setWebsite] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [testNumber, setTestNumber] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);

  // Solo admin por ahora (igual que la página de crear negocio)
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: "include",
          cache: "no-store",
        });
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await readJson(response);
        if (!response.ok || !data?.is_admin) {
          router.replace("/dashboard");
          return;
        }
        if (!cancelled) {
          setBusinessName(data?.name || "");
          setTestNumber(data?.twilio_voice_number || data?.twilio_number || null);
        }
      } catch {
        router.replace("/dashboard");
      } finally {
        if (!cancelled) setCheckingAccess(false);
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Mensajes rotativos mientras Aamy lee el sitio
  useEffect(() => {
    if (step !== "analyzing") return;
    setMessageIndex(0);
    const id = window.setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, ANALYZING_MESSAGES.length - 1));
    }, 6000);
    return () => window.clearInterval(id);
  }, [step]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateHour = (day: DayKey, part: "start" | "end", value: string) => {
    setForm((current) => {
      if (!current) return current;
      const existing = current.hours[day] || { start: "09:00", end: "17:00" };
      return {
        ...current,
        hours: { ...current.hours, [day]: { ...existing, [part]: value } },
      };
    });
  };

  const toggleDay = (day: DayKey, open: boolean) => {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        hours: {
          ...current.hours,
          [day]: open ? { start: "09:00", end: "17:00" } : null,
        },
      };
    });
  };

  /* ───────── Paso 1: leer el sitio ───────── */
  const handleAnalyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!website.trim()) return;

    setError("");
    setStep("analyzing");

    try {
      const response = await fetch(`${BACKEND_URL}/api/onboarding/analyze-website`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: website.trim() }),
      });
      const data = await readJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo analizar el sitio");
      }

      setForm(proposalToForm(data.proposal as Proposal, businessName));
      setStep("review");
    } catch (analyzeError) {
      setError(
        analyzeError instanceof Error ? analyzeError.message : "No se pudo analizar el sitio"
      );
      setStep("website");
    }
  };

  /* ───────── Paso 2: guardar con el PATCH que ya existe ───────── */
  const handleSave = async () => {
    if (!form || saving) return;
    setError("");
    setSaving(true);

    try {
      const hasHours = Object.values(form.hours).some(Boolean);

      const body: Record<string, unknown> = {
        nombre_negocio: form.business_name,
        categoria: form.category,
        telefono_negocio: form.phone,
        direccion: form.address,
        informacion_negocio: buildBusinessInfo(form),
      };
      if (hasHours) body.horario_atencion = form.hours;

      const response = await fetch(`${BACKEND_URL}/api/settings`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo guardar la información");
      }

      setBusinessName(form.business_name || businessName);
      setStep("test");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  /* ───────── Paso 3: terminar ───────── */
  const handleFinish = async () => {
    if (finishing) return;
    setFinishing(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/onboarding/complete`, {
        method: "POST",
        credentials: "include",
      });
      const data = await readJson(response);
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo completar el onboarding");
      }
      window.location.href = "/dashboard";
    } catch (finishError) {
      setError(finishError instanceof Error ? finishError.message : "No se pudo completar");
      setFinishing(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FiLoader className="animate-spin text-3xl text-purple-300" />
      </div>
    );
  }

  const stepIndex = step === "website" || step === "analyzing" ? 0 : step === "review" ? 1 : 2;
  const stepLabels = ["Entrenar", "Revisar", "Probar"];

  return (
    <div className="mx-auto w-full max-w-3xl px-1 pb-10">
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="mb-4 flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
      >
        <FiArrowLeft />
        Volver al dashboard
      </button>

      {/* Indicador de pasos */}
      <ol className="mb-8 flex items-center gap-3 text-sm">
        {stepLabels.map((label, index) => {
          const done = index < stepIndex;
          const active = index === stepIndex;
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-green-500/20 text-green-300"
                    : active
                    ? "bg-purple-600 text-white"
                    : "border border-white/20 text-white/40"
                }`}
              >
                {done ? <FiCheckCircle /> : index + 1}
              </span>
              <span className={active ? "font-medium text-purple-200" : "text-white/50"}>
                {label}
              </span>
              {index < stepLabels.length - 1 ? <span className="h-px w-8 bg-white/15" /> : null}
            </li>
          );
        })}
      </ol>

      {error ? (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* ───────── Paso 1: website ───────── */}
      {step === "website" ? (
        <form
          onSubmit={handleAnalyze}
          className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-xl backdrop-blur md:p-8"
        >
          <h1 className="text-2xl font-bold text-purple-200 md:text-3xl">
            Enseñemos a Aamy sobre tu negocio
          </h1>
          <p className="mt-2 text-white/60">
            Pon la página web del negocio y Aamy aprende lo básico. Después revisas todo antes de
            guardar, y puedes cambiarlo cuando quieras.
          </p>

          <label htmlFor="website" className={`${labelClass} mt-6`}>
            Sitio web
          </label>
          <div className="relative">
            <FiGlobe className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              id="website"
              type="text"
              inputMode="url"
              autoComplete="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://tunegocio.com"
              className={`${inputClass} pl-11`}
              required
            />
          </div>

          <p className="mt-3 flex items-center gap-2 text-xs text-white/50">
            <FiLock />
            Solo lectura. No se modifica nada en el sitio.
          </p>

          <button
            type="submit"
            disabled={!website.trim()}
            className="mt-6 w-full rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Leer mi sitio
          </button>
        </form>
      ) : null}

      {/* ───────── Analizando ───────── */}
      {step === "analyzing" ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-10 text-center shadow-xl">
          <FiLoader className="mx-auto mb-5 animate-spin text-4xl text-purple-300" />
          <h2 className="text-xl font-semibold text-purple-200">Aamy está aprendiendo</h2>
          <p className="mt-3 text-white/70" aria-live="polite">
            {ANALYZING_MESSAGES[messageIndex]}
          </p>
          <p className="mt-2 text-xs text-white/40">Puede tardar hasta un minuto.</p>
        </div>
      ) : null}

      {/* ───────── Paso 2: revisar ───────── */}
      {step === "review" && form ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-xl backdrop-blur md:p-8">
          <h1 className="text-2xl font-bold text-purple-200">Revisa lo que Aamy aprendió</h1>
          <p className="mt-2 text-white/60">
            Corrige lo que haga falta. Los campos vacíos no se guardan, y todo se puede cambiar
            después en el dashboard.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="business_name" className={labelClass}>
                Nombre del negocio
              </label>
              <input
                id="business_name"
                value={form.business_name}
                onChange={(e) => updateField("business_name", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="category" className={labelClass}>
                Categoría
              </label>
              <input
                id="category"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className={labelClass}>
                Dirección
              </label>
              <input
                id="address"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className={labelClass}>
                Descripción
              </label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="services" className={labelClass}>
                Servicios (uno por línea)
              </label>
              <textarea
                id="services"
                rows={5}
                value={form.services}
                onChange={(e) => updateField("services", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="policies" className={labelClass}>
                Políticas y zonas de servicio
              </label>
              <textarea
                id="policies"
                rows={3}
                value={form.policies}
                onChange={(e) => updateField("policies", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <span className={labelClass}>Horario de atención</span>
              <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                {DAYS.map(({ key, label }) => {
                  const hours = form.hours[key];
                  return (
                    <div key={key} className="flex flex-wrap items-center gap-3">
                      <label className="flex w-32 cursor-pointer items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={Boolean(hours)}
                          onChange={(e) => toggleDay(key, e.target.checked)}
                          className="h-4 w-4 accent-purple-600"
                        />
                        {label}
                      </label>

                      {hours ? (
                        <>
                          <input
                            type="time"
                            aria-label={`${label}: abre`}
                            value={hours.start}
                            onChange={(e) => updateHour(key, "start", e.target.value)}
                            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-purple-400"
                          />
                          <span className="text-white/40">a</span>
                          <input
                            type="time"
                            aria-label={`${label}: cierra`}
                            value={hours.end}
                            onChange={(e) => updateHour(key, "end", e.target.value)}
                            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-purple-400"
                          />
                        </>
                      ) : (
                        <span className="text-sm text-white/40">Cerrado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => setStep("website")}
              disabled={saving}
              className="rounded-xl border border-white/10 px-5 py-3 font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              Probar con otro sitio
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <FiLoader className="animate-spin" />
                  Guardando…
                </>
              ) : (
                "Guardar y probar"
              )}
            </button>
          </div>
        </div>
      ) : null}

      {/* ───────── Paso 3: probar ───────── */}
      {step === "test" ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-xl backdrop-blur md:p-8">
          <h1 className="text-2xl font-bold text-purple-200">
            {businessName ? `${businessName} está listo para una prueba` : "Listo para una prueba"}
          </h1>
          <p className="mt-2 text-white/60">
            Llama al número de abajo y habla con Aamy. No tendrá todo perfecto todavía, y eso es
            normal: lo afinas después en el dashboard.
          </p>

          {testNumber ? (
            <a
              href={`tel:${testNumber}`}
              className="mt-6 flex items-center justify-center gap-3 rounded-2xl border-2 border-purple-500 bg-purple-500/10 px-6 py-5 text-2xl font-bold text-white transition hover:bg-purple-500/20"
            >
              <FiPhone />
              {testNumber}
            </a>
          ) : (
            <div className="mt-6 rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
              Este negocio todavía no tiene un número de voz asignado. Puedes terminar el
              onboarding y asignarlo desde el dashboard.
            </div>
          )}

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            <p className="mb-2 font-medium text-white/80">Prueba preguntando:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>¿Qué servicios ofrecen?</li>
              <li>¿Están abiertos mañana?</li>
              <li>¿Dónde están ubicados?</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => setStep("review")}
              disabled={finishing}
              className="rounded-xl border border-white/10 px-5 py-3 font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              Volver a revisar
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={finishing}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {finishing ? (
                <>
                  <FiLoader className="animate-spin" />
                  Terminando…
                </>
              ) : (
                "Terminar y abrir el dashboard"
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
