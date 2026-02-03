"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { track } from "@/lib/metaPixel";
import { useI18n } from "@/i18n/LanguageProvider"; // ✅ ajusta si el path cambia

type SettingsResp = {
  membresia_activa: boolean;
  // lo puedes mantener pero NO lo uses para UI (puede venir en español)
  estado_membresia_texto?: string;
};

type StripePlan = {
  price_id: string;
  product_id: string;
  name: string;
  description: string;
  interval?: string;
  interval_count: number;
  unit_amount: number | null;
  currency: string;
  metadata: Record<string, string>;
};

export default function UpgradePage() {
  const { t } = useI18n();

  const [settings, setSettings] = useState<SettingsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [plans, setPlans] = useState<StripePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: "include",
          cache: "no-store",
        });

        // ✅ Si no hay sesión, saca al usuario
        if (r.status === 401) {
          window.location.href = "/login"; // ✅ mejor que /register (a menos que quieras registro)
          return;
        }

        const s = await r.json();

        setSettings({
          membresia_activa: !!s.membresia_activa,
          estado_membresia_texto: s.estado_membresia_texto,
        });
      } catch (e) {
        setError(t("upgrade.errors.sessionReadFail"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/api/stripe/plans`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e?.error || "No se pudieron cargar planes");
        }

        const data = await r.json();
        setPlans(Array.isArray(data?.plans) ? data.plans : []);
      } catch (e: any) {
        setError(e?.message || "Error cargando planes");
      } finally {
        setPlansLoading(false);
      }
    })();
  }, []);
  
    const startCheckoutByPriceId = async (priceId: string, unitAmount: number) => {
    try {
      setStartingCheckout(true);
      setError(null);

      track("InitiateCheckout", {
        content_name: "Membership",
        value: (unitAmount ?? 0) / 100,
        currency: "USD",
      });

      const r = await fetch(`${BACKEND_URL}/api/stripe/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await r.json();
      if (!r.ok || !data?.url) {
        throw new Error(data?.error || t("upgrade.errors.checkoutStartFail"));
      }

      window.location.href = data.url;
    } catch (e: any) {
      setError(e?.message || t("upgrade.errors.checkoutGeneric"));
      setStartingCheckout(false);
    }
  };

  if (loading) return <div className="text-white text-center mt-10">{t("common.loading")}</div>;

  if (!settings) {
    return (
      <div className="text-red-300 text-center mt-10">
        {error || t("upgrade.errors.sessionReadFail")}
      </div>
    );
  }

  const isActive = settings.membresia_activa;

  return (
    <div className="max-w-4xl mx-auto p-6 text-white">
      {!isActive ? (
        <div className="mb-6 p-4 rounded-lg border border-yellow-400 bg-yellow-500/10 text-yellow-200 text-center">
          {t("upgrade.membership.inactiveBanner")}
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-lg border border-emerald-400 bg-emerald-500/10 text-emerald-200 text-center">
          {t("upgrade.membership.activeBanner")}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-2">{t("upgrade.hero.title")}</h1>
      <p className="text-white/80 mb-8">{t("upgrade.hero.subtitle")}</p>

      {plansLoading ? (
        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-white/70">
          {t("common.loading")}
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
          No hay planes disponibles en Stripe.
        </div>
      ) : (
        <div className="grid gap-4">
          {plans.map((p) => {
            const cents = p.unit_amount ?? 0;
            const dollars = (cents / 100).toFixed(0);
            const interval = p.interval || "month";

            return (
              <div key={p.price_id} className="rounded-2xl border border-white/15 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">{p.name}</h2>

                {p.description ? (
                  <p className="text-white/70 text-sm mt-1">{p.description}</p>
                ) : null}

                <div className="mt-6">
                  <div className="text-3xl font-extrabold">
                    {cents === 0 ? "$0" : `$${dollars}`}{" "}
                    <span className="text-sm font-normal text-white/70">/{interval}</span>
                  </div>
                </div>

                {error ? <div className="mt-4 text-red-300 text-sm">{error}</div> : null}

                <button
                  className="mt-6 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 py-3 font-semibold disabled:opacity-60"
                  onClick={() => startCheckoutByPriceId(p.price_id, cents)}
                  disabled={startingCheckout}
                >
                  {isActive
                    ? t("upgrade.cta.active")
                    : startingCheckout
                    ? t("upgrade.cta.redirecting")
                    : "Activar"}
                </button>

                <p className="mt-4 text-xs text-white/60">{t("upgrade.footer.note")}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
