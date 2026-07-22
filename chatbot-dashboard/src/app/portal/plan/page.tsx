//src/app/portal/plan/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiHelpCircle,
  FiMessageCircle,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiXCircle,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { SiMeta } from "react-icons/si";

import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/i18n/LanguageProvider";

type VoiceUsage = {
  cycle_start: string;
  included: number;
  bought: number;
  used: number;
  total: number;
  available: number;
};

type MessageUsage = {
  canal: string;
  usados: number;
  limite: number;
  creditos_extras: number;
};

type UsageResponse = {
  usos?: MessageUsage[];
};

type ChannelState = {
  enabled: boolean;
  maintenance: boolean;
  plan_enabled: boolean;
  settings_enabled: boolean;
  maintenance_message: string | null;
};

type PlanData = {
  tenantId: string;
  planName: string;

  membershipActive: boolean;
  membershipExpiresAt: string | null;

  trialActive: boolean;
  trialAvailable: boolean;

  membershipStatusText: string;
};

type UsageSummary = {
  included: number;
  bought: number;
  used: number;
  total: number;
  available: number;
  percentage: number;
};

const EMPTY_VOICE_USAGE: VoiceUsage = {
  cycle_start: "",
  included: 0,
  bought: 0,
  used: 0,
  total: 0,
  available: 0,
};

const EMPTY_PLAN_DATA: PlanData = {
  tenantId: "",
  planName: "",
  membershipActive: false,
  membershipExpiresAt: null,
  trialActive: false,
  trialAvailable: false,
  membershipStatusText: "",
};

const EMPTY_CHANNEL_STATE: ChannelState = {
  enabled: false,
  maintenance: false,
  plan_enabled: false,
  settings_enabled: false,
  maintenance_message: null,
};

function finiteNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? Math.max(0, parsed)
    : 0;
}

function normalizeMessageUsage(
  usage?: MessageUsage | null
): UsageSummary {
  const included = finiteNumber(usage?.limite);
  const bought = finiteNumber(
    usage?.creditos_extras
  );
  const used = finiteNumber(usage?.usados);

  const total = included + bought;
  const available = Math.max(0, total - used);

  const percentage =
    total > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round((used / total) * 100)
          )
        )
      : 0;

  return {
    included,
    bought,
    used,
    total,
    available,
    percentage,
  };
}

function ProgressBar({
  used,
  total,
}: {
  used: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round((used / total) * 100)
          )
        )
      : 0;

  return (
    <div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-300"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-white/40">
        <span>0%</span>
        <span>{percentage}%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function UsageCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
      <p className="text-sm font-medium text-white/50">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-white">
        {value.toLocaleString()}
      </p>
    </article>
  );
}

function ChannelBadge({
  active,
  maintenance,
  activeLabel,
  inactiveLabel,
  maintenanceLabel,
}: {
  active: boolean;
  maintenance: boolean;
  activeLabel: string;
  inactiveLabel: string;
  maintenanceLabel: string;
}) {
  if (maintenance) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
        <FiClock />
        {maintenanceLabel}
      </span>
    );
  }

  if (active) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
        <FiCheckCircle />
        {activeLabel}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/45">
      <FiXCircle />
      {inactiveLabel}
    </span>
  );
}

export default function PortalPlanPage() {
  const { t, lang } = useI18n();

  const [plan, setPlan] =
    useState<PlanData>(EMPTY_PLAN_DATA);

  const [voiceUsage, setVoiceUsage] =
    useState<VoiceUsage>(EMPTY_VOICE_USAGE);

  const [whatsappUsage, setWhatsappUsage] =
    useState<MessageUsage | null>(null);

  const [metaUsage, setMetaUsage] =
    useState<MessageUsage | null>(null);

  const [voiceChannel, setVoiceChannel] =
    useState<ChannelState>(
      EMPTY_CHANNEL_STATE
    );

  const [whatsappChannel, setWhatsappChannel] =
    useState<ChannelState>(
      EMPTY_CHANNEL_STATE
    );

  const [metaChannel, setMetaChannel] =
    useState<ChannelState>(
      EMPTY_CHANNEL_STATE
    );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const locale = useMemo(() => {
    if (lang === "pt") return "pt-BR";
    if (lang === "es") return "es-US";

    return "en-US";
  }, [lang]);

  const whatsappSummary = useMemo(
    () => normalizeMessageUsage(whatsappUsage),
    [whatsappUsage]
  );

  const metaSummary = useMemo(
    () => normalizeMessageUsage(metaUsage),
    [metaUsage]
  );

  const voicePercentage =
    voiceUsage.total > 0
      ? Math.min(
          100,
          Math.round(
            (voiceUsage.used /
              voiceUsage.total) *
              100
          )
        )
      : 0;

  /*
   * El consumo se muestra si el canal:
   * - está incluido en el plan,
   * - está habilitado en settings,
   * - está operativo,
   * - o ya tiene un bucket de uso asignado.
   *
   * Esto permite seguir viendo el consumo aunque
   * el cliente apague temporalmente el canal.
   */
  const showVoiceUsage =
    voiceChannel.plan_enabled ||
    voiceChannel.settings_enabled ||
    voiceChannel.enabled ||
    voiceUsage.included > 0 ||
    voiceUsage.bought > 0 ||
    voiceUsage.used > 0;

  const showWhatsappUsage =
    whatsappChannel.plan_enabled ||
    whatsappChannel.settings_enabled ||
    whatsappChannel.enabled ||
    whatsappSummary.included > 0 ||
    whatsappSummary.bought > 0 ||
    whatsappSummary.used > 0;

  const showMetaUsage =
    metaChannel.plan_enabled ||
    metaChannel.settings_enabled ||
    metaChannel.enabled ||
    metaSummary.included > 0 ||
    metaSummary.bought > 0 ||
    metaSummary.used > 0;

  const visibleUsageSections =
    Number(showVoiceUsage) +
    Number(showWhatsappUsage) +
    Number(showMetaUsage);

  function formatDate(
    value?: string | null
  ): string {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  }

  function getMembershipLabel(): string {
    if (plan.membershipActive) {
      return t(
        "portal.plan.membership.active"
      );
    }

    if (plan.trialActive) {
      return t(
        "portal.plan.membership.trial"
      );
    }

    return t(
      "portal.plan.membership.inactive"
    );
  }

  function getMembershipClasses(): string {
    if (plan.membershipActive) {
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
    }

    if (plan.trialActive) {
      return "border-amber-500/25 bg-amber-500/10 text-amber-300";
    }

    return "border-red-500/25 bg-red-500/10 text-red-300";
  }

  function getMembershipIcon() {
    if (plan.membershipActive) {
      return <FiCheckCircle />;
    }

    if (plan.trialActive) {
      return <FiClock />;
    }

    return <FiXCircle />;
  }

  function normalizeChannelState(
    data: any
  ): ChannelState {
    return {
      enabled: Boolean(data?.enabled),
      maintenance: Boolean(
        data?.maintenance
      ),
      plan_enabled: Boolean(
        data?.plan_enabled
      ),
      settings_enabled: Boolean(
        data?.settings_enabled
      ),
      maintenance_message:
        data?.maintenance_message
          ? String(
              data.maintenance_message
            )
          : null,
    };
  }

  async function loadPlanData(
    showRefresh = false
  ) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    const options: RequestInit = {
      credentials: "include",
      cache: "no-store",
    };

    try {
      const [
        settingsResult,
        tenantResult,
        voiceUsageResult,
        messageUsageResult,
        voiceChannelResult,
        whatsappChannelResult,
        metaChannelResult,
      ] = await Promise.allSettled([
        fetch(
          `${BACKEND_URL}/api/settings`,
          options
        ),

        fetch(
          `${BACKEND_URL}/api/tenants/me`,
          options
        ),

        fetch(
          `${BACKEND_URL}/api/stats/voice/minutes`,
          options
        ),

        fetch(
          `${BACKEND_URL}/api/usage`,
          options
        ),

        fetch(
          `${BACKEND_URL}/api/channel-settings?canal=voice`,
          options
        ),

        fetch(
          `${BACKEND_URL}/api/channel-settings?canal=whatsapp`,
          options
        ),

        fetch(
          `${BACKEND_URL}/api/channel-settings?canal=meta`,
          options
        ),
      ]);

      let settings: any = {};
      let tenant: any = {};

      if (
        settingsResult.status ===
          "fulfilled" &&
        settingsResult.value.ok
      ) {
        settings =
          await settingsResult.value.json();
      }

      if (
        tenantResult.status ===
          "fulfilled" &&
        tenantResult.value.ok
      ) {
        tenant =
          await tenantResult.value.json();
      }

      const membershipActive = Boolean(
        settings?.membresia_activa
      );

      const trialActive = Boolean(
        settings?.trial_vigente ||
          settings?.trial_activo
      );

      setPlan({
        tenantId: String(
          settings?.tenant_id ||
            tenant?.id ||
            ""
        ),

        planName: String(
          settings?.plan_name ||
            tenant?.plan ||
            tenant?.plan_activo ||
            ""
        ),

        membershipActive,

        membershipExpiresAt:
          settings?.membresia_vigencia ||
          tenant?.membresia_vigencia ||
          null,

        trialActive,

        trialAvailable: Boolean(
          settings?.trial_disponible
        ),

        membershipStatusText: String(
          settings?.estado_membresia_texto ||
            ""
        ),
      });

      if (
        voiceUsageResult.status ===
          "fulfilled" &&
        voiceUsageResult.value.ok
      ) {
        const usage =
          await voiceUsageResult.value.json();

        setVoiceUsage({
          cycle_start: String(
            usage?.cycle_start || ""
          ),

          included: finiteNumber(
            usage?.included
          ),

          bought: finiteNumber(
            usage?.bought
          ),

          used: finiteNumber(
            usage?.used
          ),

          total: finiteNumber(
            usage?.total
          ),

          available: finiteNumber(
            usage?.available
          ),
        });
      } else {
        setVoiceUsage(
          EMPTY_VOICE_USAGE
        );
      }

      if (
        messageUsageResult.status ===
          "fulfilled" &&
        messageUsageResult.value.ok
      ) {
        const usageData =
          (await messageUsageResult.value.json()) as UsageResponse;

        const usages = Array.isArray(
          usageData?.usos
        )
          ? usageData.usos
          : [];

        setWhatsappUsage(
          usages.find(
            (usage) =>
              String(usage?.canal)
                .trim()
                .toLowerCase() ===
              "whatsapp"
          ) ?? null
        );

        setMetaUsage(
          usages.find(
            (usage) =>
              String(usage?.canal)
                .trim()
                .toLowerCase() === "meta"
          ) ?? null
        );
      } else {
        setWhatsappUsage(null);
        setMetaUsage(null);
      }

      if (
        voiceChannelResult.status ===
          "fulfilled" &&
        voiceChannelResult.value.ok
      ) {
        const data =
          await voiceChannelResult.value.json();

        setVoiceChannel(
          normalizeChannelState(data)
        );
      } else {
        setVoiceChannel(
          EMPTY_CHANNEL_STATE
        );
      }

      if (
        whatsappChannelResult.status ===
          "fulfilled" &&
        whatsappChannelResult.value.ok
      ) {
        const data =
          await whatsappChannelResult.value.json();

        setWhatsappChannel(
          normalizeChannelState(data)
        );
      } else {
        setWhatsappChannel(
          EMPTY_CHANNEL_STATE
        );
      }

      if (
        metaChannelResult.status ===
          "fulfilled" &&
        metaChannelResult.value.ok
      ) {
        const data =
          await metaChannelResult.value.json();

        setMetaChannel(
          normalizeChannelState(data)
        );
      } else {
        setMetaChannel(
          EMPTY_CHANNEL_STATE
        );
      }

      const successfulRequests = [
        settingsResult,
        tenantResult,
        voiceUsageResult,
        messageUsageResult,
        voiceChannelResult,
        whatsappChannelResult,
        metaChannelResult,
      ].filter(
        (result) =>
          result.status ===
            "fulfilled" &&
          result.value.ok
      ).length;

      if (successfulRequests === 0) {
        setError(
          t("portal.plan.errors.load")
        );
      }
    } catch (loadError) {
      console.error(
        "[CLIENT_PORTAL][PLAN_LOAD_FAILED]",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : t("portal.plan.errors.load")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadPlanData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-purple-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-purple-300">
            {t(
              "portal.navigation.plan"
            )}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {t("portal.plan.title")}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
            {t(
              "portal.plan.description"
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadPlanData(true)
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <FiRefreshCw
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? t(
                "portal.plan.actions.refreshing"
              )
            : t(
                "portal.plan.actions.refresh"
              )}
        </button>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 xl:col-span-2">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
                <FiCreditCard size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {t(
                    "portal.plan.current.title"
                  )}
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  {t(
                    "portal.plan.current.description"
                  )}
                </p>
              </div>
            </div>

            <span
              className={[
                "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
                getMembershipClasses(),
              ].join(" ")}
            >
              {getMembershipIcon()}
              {getMembershipLabel()}
            </span>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/15 p-4">
              <p className="text-sm text-white/45">
                {t(
                  "portal.plan.current.planName"
                )}
              </p>

              <p className="mt-2 text-xl font-bold">
                {plan.planName ||
                  t(
                    "portal.plan.current.notAvailable"
                  )}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/15 p-4">
              <p className="text-sm text-white/45">
                {plan.trialActive
                  ? t(
                      "portal.plan.current.trialUntil"
                    )
                  : t(
                      "portal.plan.current.activeUntil"
                    )}
              </p>

              <p className="mt-2 text-xl font-bold">
                {formatDate(
                  plan.membershipExpiresAt
                )}
              </p>
            </div>
          </div>

          {plan.membershipStatusText ? (
            <div className="mt-5 rounded-xl border border-white/10 bg-black/15 p-4 text-sm text-white/60">
              {plan.membershipStatusText}
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-6">
          <div className="w-fit rounded-xl bg-purple-500/15 p-3 text-purple-300">
            <FiShield size={22} />
          </div>

          <h2 className="mt-5 text-xl font-bold">
            {t(
              "portal.plan.support.title"
            )}
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {t(
              "portal.plan.support.description"
            )}
          </p>

          <Link
            href="/portal/support"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-white/90"
          >
            <FiHelpCircle />
            {t(
              "portal.plan.support.action"
            )}
          </Link>
        </article>
      </section>

      {visibleUsageSections === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-8 text-center">
          <FiMessageCircle className="mx-auto text-3xl text-white/30" />

          <h2 className="mt-4 text-lg font-bold">
            {t(
              "portal.plan.usage.emptyTitle"
            )}
          </h2>

          <p className="mt-2 text-sm text-white/45">
            {t(
              "portal.plan.usage.emptyDescription"
            )}
          </p>
        </section>
      ) : null}

      {showVoiceUsage ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
                <FiPhone size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {t(
                    "portal.plan.voice.title"
                  )}
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  {t(
                    "portal.plan.voice.description"
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ChannelBadge
                active={voiceChannel.enabled}
                maintenance={
                  voiceChannel.maintenance
                }
                activeLabel={t(
                  "portal.plan.channel.active"
                )}
                inactiveLabel={t(
                  "portal.plan.channel.off"
                )}
                maintenanceLabel={t(
                  "portal.plan.channel.maintenance"
                )}
              />

              <span className="rounded-full bg-purple-500/15 px-3 py-1.5 text-sm font-semibold text-purple-200">
                {voicePercentage}%
              </span>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <UsageCard
              label={t(
                "portal.plan.voice.included"
              )}
              value={voiceUsage.included}
            />

            <UsageCard
              label={t(
                "portal.plan.voice.bought"
              )}
              value={voiceUsage.bought}
            />

            <UsageCard
              label={t(
                "portal.plan.voice.used"
              )}
              value={voiceUsage.used}
            />

            <UsageCard
              label={t(
                "portal.plan.voice.total"
              )}
              value={voiceUsage.total}
            />

            <UsageCard
              label={t(
                "portal.plan.voice.available"
              )}
              value={voiceUsage.available}
            />
          </div>

          <div className="mt-7">
            <ProgressBar
              used={voiceUsage.used}
              total={voiceUsage.total}
            />
          </div>

          <p className="mt-4 text-sm text-white/40">
            {t(
              "portal.plan.voice.unit"
            )}
          </p>

          {voiceUsage.cycle_start ? (
            <p className="mt-2 text-sm text-white/40">
              {t(
                "portal.plan.voice.cycleStarted"
              )}{" "}
              {formatDate(
                voiceUsage.cycle_start
              )}
            </p>
          ) : null}

          {voiceChannel.maintenance &&
          voiceChannel.maintenance_message ? (
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              {
                voiceChannel.maintenance_message
              }
            </div>
          ) : null}
        </section>
      ) : null}

      {showWhatsappUsage ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/15 p-3 text-emerald-300">
                <FaWhatsapp size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {t(
                    "portal.plan.whatsapp.title"
                  )}
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  {t(
                    "portal.plan.whatsapp.description"
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ChannelBadge
                active={
                  whatsappChannel.enabled
                }
                maintenance={
                  whatsappChannel.maintenance
                }
                activeLabel={t(
                  "portal.plan.channel.active"
                )}
                inactiveLabel={t(
                  "portal.plan.channel.off"
                )}
                maintenanceLabel={t(
                  "portal.plan.channel.maintenance"
                )}
              />

              <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-200">
                {whatsappSummary.percentage}%
              </span>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <UsageCard
              label={t(
                "portal.plan.messages.included"
              )}
              value={
                whatsappSummary.included
              }
            />

            <UsageCard
              label={t(
                "portal.plan.messages.bought"
              )}
              value={whatsappSummary.bought}
            />

            <UsageCard
              label={t(
                "portal.plan.messages.used"
              )}
              value={whatsappSummary.used}
            />

            <UsageCard
              label={t(
                "portal.plan.messages.total"
              )}
              value={whatsappSummary.total}
            />

            <UsageCard
              label={t(
                "portal.plan.messages.available"
              )}
              value={
                whatsappSummary.available
              }
            />
          </div>

          <div className="mt-7">
            <ProgressBar
              used={whatsappSummary.used}
              total={whatsappSummary.total}
            />
          </div>

          <p className="mt-4 text-sm text-white/40">
            {t(
              "portal.plan.messages.unit"
            )}
          </p>

          {whatsappChannel.maintenance &&
          whatsappChannel.maintenance_message ? (
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              {
                whatsappChannel.maintenance_message
              }
            </div>
          ) : null}
        </section>
      ) : null}

      {showMetaUsage ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/15 p-3 text-blue-300">
                <SiMeta size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {t(
                    "portal.plan.meta.title"
                  )}
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  {t(
                    "portal.plan.meta.description"
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ChannelBadge
                active={metaChannel.enabled}
                maintenance={
                  metaChannel.maintenance
                }
                activeLabel={t(
                  "portal.plan.channel.active"
                )}
                inactiveLabel={t(
                  "portal.plan.channel.off"
                )}
                maintenanceLabel={t(
                  "portal.plan.channel.maintenance"
                )}
              />

              <span className="rounded-full bg-blue-500/15 px-3 py-1.5 text-sm font-semibold text-blue-200">
                {metaSummary.percentage}%
              </span>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <UsageCard
              label={t(
                "portal.plan.messages.included"
              )}
              value={metaSummary.included}
            />

            <UsageCard
              label={t(
                "portal.plan.messages.bought"
              )}
              value={metaSummary.bought}
            />

            <UsageCard
              label={t(
                "portal.plan.messages.used"
              )}
              value={metaSummary.used}
            />

            <UsageCard
              label={t(
                "portal.plan.messages.total"
              )}
              value={metaSummary.total}
            />

            <UsageCard
              label={t(
                "portal.plan.messages.available"
              )}
              value={metaSummary.available}
            />
          </div>

          <div className="mt-7">
            <ProgressBar
              used={metaSummary.used}
              total={metaSummary.total}
            />
          </div>

          <p className="mt-4 text-sm text-white/40">
            {t(
              "portal.plan.meta.unit"
            )}
          </p>

          {metaChannel.maintenance &&
          metaChannel.maintenance_message ? (
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              {
                metaChannel.maintenance_message
              }
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/5 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {t(
                "portal.plan.changes.title"
              )}
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              {t(
                "portal.plan.changes.description"
              )}
            </p>
          </div>

          <Link
            href="/portal/support"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/90"
          >
            <FiHelpCircle />
            {t(
              "portal.plan.changes.action"
            )}
          </Link>
        </div>
      </section>
    </div>
  );
}