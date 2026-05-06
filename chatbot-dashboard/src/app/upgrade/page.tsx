"use client";

import { useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { track } from "@/lib/metaPixel";
import { useI18n } from "@/i18n/LanguageProvider";

type SettingsResponse = {
  membership_active: boolean;
  membership_status_text?: string;
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

function formatMoneyFromCents(
  cents: number | null | undefined,
  currency = "USD"
): string {
  const amount = Number(cents ?? 0) / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseMetadataCents(value: string | undefined): number | null {
  if (!value) return null;

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.trunc(parsed);
}

function parseMetadataBoolean(value: string | undefined): boolean {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function getPlanBadgeText(plan: StripePlan, isFeatured: boolean): string | null {
  const explicitBadge =
    typeof plan.metadata?.badge_text === "string" && plan.metadata.badge_text.trim()
      ? plan.metadata.badge_text.trim()
      : null;

  if (explicitBadge) return explicitBadge;
  if (isFeatured) return "Recommended";

  return null;
}

function getPlanCtaLabel(
  plan: StripePlan,
  isStartingCheckout: boolean,
  isMembershipActive: boolean,
  t: (key: string) => string
): string {
  if (isMembershipActive) {
    return t("upgrade.cta.active");
  }

  if (isStartingCheckout) {
    return t("upgrade.cta.redirecting");
  }

  const metadataLabel =
    typeof plan.metadata?.cta_label === "string" && plan.metadata.cta_label.trim()
      ? plan.metadata.cta_label.trim()
      : null;

  return metadataLabel || "Choose plan";
}

export default function UpgradePage() {
  const { t } = useI18n();

  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [startingCheckoutPriceId, setStartingCheckoutPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<StripePlan[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const data = await response.json();

        setSettings({
          membership_active: Boolean(data.membresia_activa),
          membership_status_text: data.estado_membresia_texto,
        });
      } catch {
        setError(t("upgrade.errors.sessionReadFail"));
      } finally {
        setSettingsLoading(false);
      }
    })();
  }, [t]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/stripe/plans`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          const apiError = await response.json().catch(() => ({}));
          throw new Error(apiError?.error || "Failed to load plans.");
        }

        const data = await response.json();
        setPlans(Array.isArray(data?.plans) ? data.plans : []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load plans.");
        }
      } finally {
        setPlansLoading(false);
      }
    })();
  }, []);

  const displayedPlans = useMemo(() => {
    return plans.map((plan) => {
      const displayPriceCents = parseMetadataCents(plan.metadata?.display_price_cents);
      const compareAtCents = parseMetadataCents(plan.metadata?.compare_at_cents);
      const isFeatured =
        parseMetadataBoolean(plan.metadata?.featured) ||
        parseMetadataBoolean(plan.metadata?.recommended);

      return {
        ...plan,
        isFeatured,
        displayPriceCents,
        compareAtCents,
        shownPriceCents: displayPriceCents ?? plan.unit_amount ?? 0,
        priceLabel: plan.metadata?.price_label?.trim() || null,
        renewalNote: plan.metadata?.renewal_note?.trim() || null,
        savingsNote: plan.metadata?.savings_note?.trim() || null,
        eyebrow: plan.metadata?.eyebrow?.trim() || null,
        badgeText: getPlanBadgeText(plan, isFeatured),
      };
    });
  }, [plans]);

  const startCheckoutByPriceId = async (priceId: string, unitAmount: number | null) => {
    try {
      setStartingCheckoutPriceId(priceId);
      setError(null);

      track("InitiateCheckout", {
        content_name: "Membership",
        value: Number(unitAmount ?? 0) / 100,
        currency: "USD",
      });

      const response = await fetch(`${BACKEND_URL}/api/stripe/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || t("upgrade.errors.checkoutStartFail"));
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("upgrade.errors.checkoutGeneric"));
      }

      setStartingCheckoutPriceId(null);
    }
  };

  if (settingsLoading) {
    return <div className="mt-10 text-center text-white">{t("common.loading")}</div>;
  }

  if (!settings) {
    return (
      <div className="mt-10 text-center text-red-300">
        {error || t("upgrade.errors.sessionReadFail")}
      </div>
    );
  }

  const isMembershipActive = settings.membership_active;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 text-white">
      {!isMembershipActive ? (
        <div className="mb-8 rounded-xl border border-yellow-400/60 bg-yellow-500/10 px-4 py-3 text-center text-sm text-yellow-200">
          {t("upgrade.membership.inactiveBanner")}
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200">
          {t("upgrade.membership.activeBanner")}
        </div>
      )}

      <div className="mx-auto mb-10 max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          {t("upgrade.hero.title")}
        </h1>
        <p className="mt-3 text-base text-white/75 md:text-lg">
          {t("upgrade.hero.subtitle")}
        </p>
      </div>

      {plansLoading ? (
        <div className="rounded-3xl border border-white/15 bg-white/5 p-6 text-center text-white/70">
          {t("common.loading")}
        </div>
      ) : displayedPlans.length === 0 ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200">
          No plans are currently available.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {displayedPlans.map((plan) => {
            const isCurrentCheckout = startingCheckoutPriceId === plan.price_id;

            return (
              <div
                key={plan.price_id}
                className={[
                  "relative rounded-3xl border p-6 transition-all duration-200 flex h-full flex-col",
                  plan.isFeatured
                    ? "border-indigo-400/70 bg-gradient-to-b from-indigo-500/10 to-white/5 shadow-[0_0_0_1px_rgba(129,140,248,0.2),0_20px_60px_rgba(79,70,229,0.18)]"
                    : "border-white/15 bg-white/5",
                ].join(" ")}
              >
                {plan.badgeText ? (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                    <span
                      className={[
                        "rounded-full px-4 py-1 text-xs font-semibold tracking-wide",
                        plan.isFeatured
                          ? "bg-indigo-400 text-slate-950"
                          : "bg-white/10 text-white/85",
                      ].join(" ")}
                    >
                      {plan.badgeText}
                    </span>
                  </div>
                ) : null}

                {plan.eyebrow ? (
                  <p className="mt-2 text-sm font-medium text-indigo-300">{plan.eyebrow}</p>
                ) : (
                  <div className="mt-2 h-5" />
                )}

                <h2 className="mt-2 text-3xl font-bold tracking-tight">{plan.name}</h2>

                {plan.description ? (
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-white/72">
                    {plan.description}
                  </p>
                ) : null}

                <div className="mt-6 min-h-[150px]">
                  {plan.compareAtCents &&
                  plan.compareAtCents > plan.shownPriceCents ? (
                    <div className="mb-2 text-lg text-white/40 line-through">
                      {formatMoneyFromCents(plan.compareAtCents, plan.currency)}
                    </div>
                  ) : null}

                  <div className="flex items-end gap-2">
                    <div className="text-5xl font-extrabold leading-none">
                      {plan.shownPriceCents === 0
                        ? "$0"
                        : formatMoneyFromCents(plan.shownPriceCents, plan.currency)}
                    </div>
                    <div className="pb-1 text-base text-white/70">
                      /{plan.priceLabel || plan.interval || "month"}
                    </div>
                  </div>

                  {plan.renewalNote ? (
                    <p className="mt-3 text-sm text-white/72">{plan.renewalNote}</p>
                  ) : null}

                  {plan.savingsNote ? (
                    <p className="mt-2 text-sm font-semibold text-emerald-300">
                      {plan.savingsNote}
                    </p>
                  ) : null}
                </div>

                <button
                  className={[
                     "mt-auto w-full rounded-xl px-4 py-3.5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                    plan.isFeatured
                      ? "bg-indigo-500 text-white hover:bg-indigo-400"
                      : "bg-white text-slate-950 hover:bg-white/90",
                  ].join(" ")}
                  onClick={() => startCheckoutByPriceId(plan.price_id, plan.unit_amount)}
                  disabled={Boolean(startingCheckoutPriceId)}
                >
                  {getPlanCtaLabel(
                    plan,
                    isCurrentCheckout,
                    isMembershipActive,
                    t
                  )}
                </button>

              </div>
            );
          })}
        </div>
      )}

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}