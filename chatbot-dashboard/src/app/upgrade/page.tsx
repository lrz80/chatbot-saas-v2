"use client";
import { useEffect, useState } from "react";
import { fetchStripePlans, type PlanStripe } from "@/utils/plans";
import { openCheckout } from "@/utils/checkout";
import { BACKEND_URL } from "@/utils/api";

type SettingsResp = {
  membresia_activa: boolean;
  estado_membresia_texto?: string;
  // 👇 estos dos vienen del backend /api/settings (asegúrate de exponerlos)
  trial_activo?: boolean;
  trial_disponible?: boolean;
};

export default function UpgradePage() {
  const [plans, setPlans] = useState<PlanStripe[]>([]);
  const [settings, setSettings] = useState<SettingsResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, s] = await Promise.all([
          fetchStripePlans(),
          fetch(`${BACKEND_URL}/api/settings`, { credentials: "include", cache: "no-store" }).then(r => r.json()),
        ]);
        setPlans(p);
        setSettings({
          membresia_activa: !!s.membresia_activa,
          estado_membresia_texto: s.estado_membresia_texto,
          trial_activo: !!s.trial_activo,
          trial_disponible: !!s.trial_disponible,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-white text-center mt-10">Cargando planes…</div>;
  if (!settings) return <div className="text-red-300 text-center mt-10">No fue posible leer tu sesión.</div>;

  const showTrialCta = !settings.membresia_activa && settings.trial_disponible;
  const ctaLabel = showTrialCta ? "Comenzar prueba gratis (14 días)" : "Activar membresía";

  return (
    <div className="max-w-5xl mx-auto p-6 text-white">
      {/* Banner encabezado */}
      {!settings.membresia_activa && (
        <div className="mb-6 p-4 rounded-lg border border-yellow-400 bg-yellow-500/10 text-yellow-200 text-center">
          {showTrialCta
            ? "¡Prueba Aamy por 14 días! Cancela cuando quieras."
            : "Tu membresía está inactiva. Actívala para continuar."}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">Planes disponibles</h1>

      <div className="grid sm:grid-cols-2 gap-6">
        {plans.map(plan => (
          <div key={plan.price_id} className="rounded-2xl border border-white/15 bg-white/5 p-5">
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            {plan.description ? (
              <p className="text-white/80 mt-1">{plan.description}</p>
            ) : null}

            <div className="mt-4 text-3xl font-extrabold">
              {typeof plan.unit_amount === "number"
                ? `$${(plan.unit_amount / 100).toFixed(0)}`
                : "$—"}
              <span className="text-sm font-normal text-white/70">
                {plan.interval === "year" ? "/año" : "/mes"}
              </span>
            </div>

            <button
              className="mt-6 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2 font-medium"
              onClick={() => openCheckout(plan.price_id)}
            >
              {ctaLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
