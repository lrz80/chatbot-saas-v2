"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { track } from "@/lib/metaPixel";
import { useI18n } from "../../i18n/LanguageProvider"; // ✅ ajusta si el path cambia

type SettingsResp = {
  membresia_activa: boolean;
  // lo puedes mantener pero NO lo uses para UI (puede venir en español)
  estado_membresia_texto?: string;
};

export default function UpgradePage() {
  const { t } = useI18n();

  const [settings, setSettings] = useState<SettingsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const startCheckout = async () => {
    try {
      setStartingCheckout(true);
      setError(null);

      // ✅ Meta Pixel: inició checkout
      track("InitiateCheckout", {
        content_name: t("upgrade.plan.name"),
        value: 399,
        currency: "USD",
      });

      const r = await fetch(`${BACKEND_URL}/api/stripe/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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

      <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
        <h2 className="text-xl font-semibold">{t("upgrade.plan.name")}</h2>

        <ul className="mt-4 space-y-2 text-white/80 text-sm">
          <li>• {t("upgrade.plan.features.f1")}</li>
          <li>• {t("upgrade.plan.features.f2")}</li>
          <li>• {t("upgrade.plan.features.f3")}</li>
          <li>• {t("upgrade.plan.features.f4")}</li>
        </ul>

        <div className="mt-6">
          <div className="text-3xl font-extrabold">
            $399 <span className="text-sm font-normal text-white/70">{t("upgrade.plan.today")}</span>
          </div>
          <div className="text-white/70 text-sm mt-1">
            {t("upgrade.plan.pricingLine")}
          </div>
        </div>

        {error ? <div className="mt-4 text-red-300 text-sm">{error}</div> : null}

        <button
          className="mt-6 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 py-3 font-semibold disabled:opacity-60"
          onClick={startCheckout}
          disabled={startingCheckout || isActive}
        >
          {isActive
            ? t("upgrade.cta.active")
            : startingCheckout
            ? t("upgrade.cta.redirecting")
            : t("upgrade.cta.pay")}
        </button>

        <p className="mt-4 text-xs text-white/60">{t("upgrade.footer.note")}</p>
      </div>
    </div>
  );
}
