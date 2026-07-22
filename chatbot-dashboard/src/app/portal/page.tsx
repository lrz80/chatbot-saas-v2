"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMessageSquare,
  FiPhone,
  FiRefreshCw,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import {
  FaFacebookMessenger,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa";

import { BACKEND_URL } from "@/utils/api";
import { useTenant } from "@/context/TenantContext";
import { useI18n } from "@/i18n/LanguageProvider";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "attended";

type MonthlySummary = {
  month: string;
  totalMessages: number;
  uniqueCustomers: number;
  estimatedTimeSavedMinutes?: number;
  estimatedTimeSavedHours?: number;

  conversationsByChannel: {
    voice?: number;
    whatsapp?: number;
    instagram?: number;
    facebook?: number;
    unknown?: number;
    [key: string]: number | undefined;
  };

  voice: {
    calls: number;
    realCalls?: number;
    estimatedCalls?: number;
    messages: number;
    seconds: number;
    minutes: number;
    estimatedFromMessages: boolean;
    partiallyEstimated?: boolean;
    afterHoursCalls?: number;
    afterHoursAvailable?: boolean;
  };

  bookings: {
    started: number;
    startedEstimatedFromAppointments?: boolean;
    appointmentsCreated: number;
    confirmed: number;
    conversionRate: number;
  };

  topIntentions: Array<{
    intention: string;
    total: number;
  }>;

  followUpNeeded: number;
};

type Appointment = {
  id: string;
  tenant_id: string;
  service_id: string | null;
  service_name: string | null;
  channel: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  start_time: string;
  end_time: string | null;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
};

type Contact = {
  id: number;
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  estado_cliente: string;
  marketing_opt_in: boolean;
  idioma: string | null;
  origen: string | null;
  ultimo_canal: string | null;
  llamadas: number;
  reservas: number;
  ultimo_servicio: string | null;
  proxima_cita_at: string | null;
  ultima_interaccion_at: string | null;
};

type ContactsResponse = {
  ok: boolean;
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    leads: number;
    clientes: number;
    recurrentes: number;
    marketingOptIn: number;
  };
  error?: string;
};

type PortalMessage = {
  id: string | number;
  timestamp: string;
  role?: string;
  content: string;
  canal?: string;
  channel?: string;
  source?: string;
  nombre_cliente?: string;
  from_number?: string;
};

type ChannelKey =
  | "voice"
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "sms"
  | "email";

type MetricCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  icon: React.ReactNode;
};

function getCurrentMonth(): string {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function finiteNumber(...values: unknown[]): number {
  for (const value of values) {
    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return 0;
}

function canonicalChannel(value?: string): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized.includes("whatsapp")) return "whatsapp";
  if (normalized.includes("facebook")) return "facebook";
  if (normalized.includes("instagram")) return "instagram";

  if (
    normalized === "voz" ||
    normalized.includes("voice") ||
    normalized.includes("call")
  ) {
    return "voice";
  }

  return normalized || "unknown";
}

function calculateTimeSaved(data: MonthlySummary | null): number {
  if (!data) return 0;

  if (
    typeof data.estimatedTimeSavedMinutes === "number" &&
    Number.isFinite(data.estimatedTimeSavedMinutes)
  ) {
    return data.estimatedTimeSavedMinutes;
  }

  const messageMinutes = data.totalMessages * 0.75;
  const voiceMinutes = data.voice.calls * 3;
  const bookingMinutes = data.bookings.confirmed * 4;

  return Math.round(
    messageMinutes + voiceMinutes + bookingMinutes
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/55">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>

          {detail ? (
            <p className="mt-2 text-sm text-white/45">
              {detail}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 rounded-xl bg-purple-500/15 p-3 text-xl text-purple-300">
          {icon}
        </div>
      </div>
    </article>
  );
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
      ? Math.min(100, Math.round((used / total) * 100))
      : 0;

  return (
    <div className="h-3 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function PortalHomePage() {
  const tenant = useTenant();
  const { t, lang } = useI18n();

  const [report, setReport] =
    useState<MonthlySummary | null>(null);

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [contacts, setContacts] = useState<Contact[]>([]);

  const [contactStats, setContactStats] = useState({
    total: 0,
    leads: 0,
    clientes: 0,
    recurrentes: 0,
    marketingOptIn: 0,
  });

  const [messages, setMessages] =
    useState<PortalMessage[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const locale = useMemo(() => {
    if (lang === "pt") return "pt-BR";
    if (lang === "es") return "es-US";

    return "en-US";
  }, [lang]);

  const month = getCurrentMonth();

  function formatDateTime(value?: string | null): string {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function channelLabel(channel: string): string {
    const normalized = canonicalChannel(channel);

    if (normalized === "voice") {
      return t("dashboard.channels.voice");
    }

    if (normalized === "whatsapp") {
      return t("dashboard.channels.whatsapp");
    }

    if (normalized === "facebook") {
      return t("dashboard.channels.facebook");
    }

    if (normalized === "instagram") {
      return t("dashboard.channels.instagram");
    }

    return t("dashboard.channels.other");
  }

  function channelIcon(channel: string) {
    const normalized = canonicalChannel(channel);

    if (normalized === "whatsapp") {
      return <FaWhatsapp />;
    }

    if (normalized === "facebook") {
      return <FaFacebookMessenger />;
    }

    if (normalized === "instagram") {
      return <FaInstagram />;
    }

    return <FiPhone />;
  }

  function appointmentStatusLabel(
    status: AppointmentStatus
  ): string {
    return t(`appointments.status.${status}`);
  }

  function appointmentStatusClass(
    status: AppointmentStatus
  ): string {
    switch (status) {
      case "confirmed":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";

      case "attended":
        return "bg-sky-500/15 text-sky-300 border-sky-500/25";

      case "cancelled":
        return "bg-red-500/15 text-red-300 border-red-500/25";

      default:
        return "bg-amber-500/15 text-amber-300 border-amber-500/25";
    }
  }

  async function loadPortalData(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    const requestOptions: RequestInit = {
      credentials: "include",
      cache: "no-store",
    };

    try {
      const [
        reportResult,
        appointmentsResult,
        contactsResult,
        messagesResult,
      ] = await Promise.allSettled([
        fetch(
          `${BACKEND_URL}/api/reports/monthly-summary?month=${encodeURIComponent(
            month
          )}&lang=${encodeURIComponent(lang || "en")}`,
          requestOptions
        ),
        fetch(
          `${BACKEND_URL}/api/appointments`,
          requestOptions
        ),
        fetch(
          `${BACKEND_URL}/api/contactos/crm?page=1&limit=5`,
          requestOptions
        ),
        fetch(
          `${BACKEND_URL}/api/messages?page=1&limit=8`,
          requestOptions
        ),
        
      ]);

      if (
        reportResult.status === "fulfilled" &&
        reportResult.value.ok
      ) {
        const data =
          (await reportResult.value.json()) as MonthlySummary;

        setReport(data);
      } else {
        setReport(null);
      }

      if (
        appointmentsResult.status === "fulfilled" &&
        appointmentsResult.value.ok
      ) {
        const data = await appointmentsResult.value.json();

        setAppointments(
          Array.isArray(data?.appointments)
            ? data.appointments
            : []
        );
      } else {
        setAppointments([]);
      }

      if (
        contactsResult.status === "fulfilled" &&
        contactsResult.value.ok
      ) {
        const data =
          (await contactsResult.value.json()) as ContactsResponse;

        setContacts(
          Array.isArray(data?.contacts)
            ? data.contacts
            : []
        );

        if (data?.stats) {
          setContactStats({
            total: finiteNumber(data.stats.total),
            leads: finiteNumber(data.stats.leads),
            clientes: finiteNumber(data.stats.clientes),
            recurrentes: finiteNumber(
              data.stats.recurrentes
            ),
            marketingOptIn: finiteNumber(
              data.stats.marketingOptIn
            ),
          });
        }
      } else {
        setContacts([]);
      }

      if (
        messagesResult.status === "fulfilled" &&
        messagesResult.value.ok
      ) {
        const data = await messagesResult.value.json();

        const loadedMessages = Array.isArray(data?.mensajes)
          ? data.mensajes
          : [];

        setMessages(
          loadedMessages
            .filter(
              (message: PortalMessage) =>
                message &&
                typeof message === "object" &&
                message.id !== undefined
            )
            .sort(
              (
                first: PortalMessage,
                second: PortalMessage
              ) =>
                new Date(second.timestamp).getTime() -
                new Date(first.timestamp).getTime()
            )
            .slice(0, 6)
        );
      } else {
        setMessages([]);
      }

      const successfulRequests = [
        reportResult,
        appointmentsResult,
        contactsResult,
        messagesResult,
      ].filter(
        (result) =>
          result.status === "fulfilled" &&
          result.value.ok
      ).length;

      if (successfulRequests === 0) {
        setError(t("portal.errors.data"));
      }
    } catch (loadError) {
      console.error(
        "[CLIENT_PORTAL][LOAD_FAILED]",
        loadError
      );

      setError(t("portal.errors.data"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadPortalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const upcomingAppointments = useMemo(() => {
    const now = Date.now();

    return appointments
      .filter((appointment) => {
        const start = new Date(
          appointment.start_time
        ).getTime();

        return (
          Number.isFinite(start) &&
          start >= now &&
          appointment.status !== "cancelled"
        );
      })
      .sort(
        (first, second) =>
          new Date(first.start_time).getTime() -
          new Date(second.start_time).getTime()
      )
      .slice(0, 5);
  }, [appointments]);

  const voiceUsage = useMemo(() => {
    const voiceLimits = tenant?.limites?.voz ?? {};

    const included = finiteNumber(
        voiceLimits.limite_base
    );

    const extras = finiteNumber(
        voiceLimits.creditos_extras
    );

    const used = finiteNumber(
        voiceLimits.usados
    );

    const total = included + extras;

    const available = Math.max(
        0,
        finiteNumber(
        voiceLimits.total_disponible,
        total - used
        )
    );

    return {
        included,
        extras,
        used,
        total,
        available,
    };
    }, [tenant]);

  const activeChannels = useMemo(() => {
    const flags = tenant?.channel_flags ?? {};
    const metaFlags = tenant?.meta_subchannel_flags ?? {};

    return [
        {
        key: "voice" as const,
        enabled:
            flags.voice === true ||
            Boolean(tenant?.twilio_voice_number),
        label: t("dashboard.channels.voice"),
        icon: <FiPhone />,
        },
        {
        key: "whatsapp" as const,
        enabled:
            flags.whatsapp === true ||
            Boolean(
            tenant?.whatsapp_cloud_connected ||
            tenant?.whatsapp_twilio_connected
            ),
        label: t("dashboard.channels.whatsapp"),
        icon: <FaWhatsapp />,
        },
        {
        key: "facebook" as const,
        enabled:
            flags.meta === true &&
            metaFlags.facebook !== false,
        label: t("dashboard.channels.facebook"),
        icon: <FaFacebookMessenger />,
        },
        {
        key: "instagram" as const,
        enabled:
            flags.meta === true &&
            metaFlags.instagram !== false,
        label: t("dashboard.channels.instagram"),
        icon: <FaInstagram />,
        },
        {
        key: "sms" as const,
        enabled: flags.sms === true,
        label: t("channel.label.sms"),
        icon: <FiMessageSquare />,
        },
        {
        key: "email" as const,
        enabled: flags.email === true,
        label: t("channel.label.email"),
        icon: <FiMessageSquare />,
        },
    ];
    }, [tenant, t]);

  const estimatedTimeSaved =
    calculateTimeSaved(report);

  const voiceTotal =
    voiceUsage.total || voiceUsage.included;

  const voicePercentage =
    voiceTotal > 0
      ? Math.min(
          100,
          Math.round(
            (voiceUsage.used / voiceTotal) * 100
          )
        )
      : 0;

  function downloadReport() {
    window.open(
      `${BACKEND_URL}/api/reports/monthly-summary.pdf?month=${encodeURIComponent(
        month
      )}&lang=${encodeURIComponent(lang || "en")}`,
      "_blank"
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-purple-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-purple-300">
            {t("portal.home.eyebrow")}
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {tenant?.name ||
              tenant?.business_name ||
              t("sidebar.fallbackBusiness")}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55 sm:text-base">
            {t("portal.home.description")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPortalData(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing
            ? t("portal.home.refreshing")
            : t("portal.home.refresh")}
        </button>
      </header>

      {error ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label={t("reports.totalMessages")}
          value={report?.totalMessages ?? 0}
          detail={t("reports.totalMessagesSubtitle")}
          icon={<FiMessageSquare />}
        />

        <MetricCard
          label={t("reports.voiceCalls")}
          value={report?.voice?.calls ?? 0}
          detail={t("reports.voiceCallsReal")}
          icon={<FiPhone />}
        />

        <MetricCard
          label={t("reports.created")}
          value={
            report?.bookings?.appointmentsCreated ?? 0
          }
          detail={t("reports.createdSubtitle")}
          icon={<FiCalendar />}
        />

        <MetricCard
          label={t("reports.uniqueCustomers")}
          value={
            report?.uniqueCustomers ??
            contactStats.total
          }
          detail={t("reports.uniqueCustomersSubtitle")}
          icon={<FiUsers />}
        />

        <MetricCard
          label={t("reports.estimatedTimeSaved")}
          value={`${estimatedTimeSaved} min`}
          detail={t(
            "reports.estimatedTimeSavedSubtitle"
          )}
          icon={<FiClock />}
        />

        <MetricCard
          label={t("reports.followUpNeeded")}
          value={report?.followUpNeeded ?? 0}
          detail={t("reports.followUpSubtitle")}
          icon={<FiTrendingUp />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 xl:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {t("portal.home.voiceUsage.title")}
              </h2>

              <p className="mt-1 text-sm text-white/50">
                {t("portal.home.voiceUsage.description")}
              </p>
            </div>

            <span className="rounded-full bg-purple-500/15 px-3 py-1 text-sm font-semibold text-purple-200">
              {voicePercentage}%
            </span>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-white/45">
                {t("portal.home.voiceUsage.included")}
              </p>

              <p className="mt-2 text-2xl font-bold">
                {voiceUsage.included}
              </p>
            </div>

            <div>
              <p className="text-sm text-white/45">
                {t("portal.home.voiceUsage.used")}
              </p>

              <p className="mt-2 text-2xl font-bold">
                {voiceUsage.used}
              </p>
            </div>

            <div>
              <p className="text-sm text-white/45">
                {t("portal.home.voiceUsage.available")}
              </p>

              <p className="mt-2 text-2xl font-bold">
                {voiceUsage.available}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <ProgressBar
              used={voiceUsage.used}
              total={voiceTotal}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
          <h2 className="text-xl font-bold">
            {t("portal.home.channels.title")}
          </h2>

          <p className="mt-1 text-sm text-white/50">
            {t("portal.home.channels.description")}
          </p>

          <div className="mt-5 space-y-3">
            {activeChannels.map((channel) => (
              <div
                key={channel.key}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/15 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg text-purple-300">
                    {channel.icon}
                  </span>

                  <span className="text-sm font-medium">
                    {channel.label}
                  </span>
                </div>

                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                    channel.enabled
                      ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 bg-white/5 text-white/40",
                  ].join(" ")}
                >
                  {channel.enabled ? (
                    <FiCheckCircle />
                  ) : null}

                  {channel.enabled
                    ? t("channel.active")
                    : t("common.off")}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] xl:col-span-2">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 p-6">
            <div>
              <h2 className="text-xl font-bold">
                {t("portal.home.appointments.title")}
              </h2>

              <p className="mt-1 text-sm text-white/50">
                {t(
                  "portal.home.appointments.description"
                )}
              </p>
            </div>

            <Link
              href="/portal/appointments"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-purple-300 hover:text-purple-200"
            >
              {t("portal.home.viewAll")}
              <FiArrowRight />
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="p-10 text-center text-sm text-white/45">
              {t("portal.home.appointments.empty")}
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {upcomingAppointments.map(
                (appointment) => (
                  <div
                    key={appointment.id}
                    className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {appointment.customer_name ||
                          t(
                            "appointments.customer.unnamed"
                          )}
                      </p>

                      <p className="mt-1 truncate text-sm text-white/50">
                        {appointment.service_name || "—"}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/45">
                        <span>
                          {formatDateTime(
                            appointment.start_time
                          )}
                        </span>

                        <span>
                          {channelLabel(
                            appointment.channel
                          )}
                        </span>

                        {appointment.customer_phone ? (
                          <span>
                            {appointment.customer_phone}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <span
                      className={[
                        "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold",
                        appointmentStatusClass(
                          appointment.status
                        ),
                      ].join(" ")}
                    >
                      {appointmentStatusLabel(
                        appointment.status
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                {t("reports.bookings")}
              </h2>

              <p className="mt-1 text-sm text-white/50">
                {t("reports.bookingsSubtitle")}
              </p>
            </div>

            <FiBarChart2 className="text-2xl text-purple-300" />
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-black/15 p-4">
              <span className="text-sm text-white/55">
                {t("reports.started")}
              </span>

              <strong className="text-xl">
                {report?.bookings?.started ?? 0}
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-black/15 p-4">
              <span className="text-sm text-white/55">
                {t("reports.created")}
              </span>

              <strong className="text-xl">
                {report?.bookings
                  ?.appointmentsCreated ?? 0}
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-black/15 p-4">
              <span className="text-sm text-white/55">
                {t("reports.confirmed")}
              </span>

              <strong className="text-xl">
                {report?.bookings?.confirmed ?? 0}
              </strong>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4 text-center">
              <p className="text-sm text-purple-200">
                {t("portal.home.conversion")}
              </p>

              <p className="mt-1 text-3xl font-bold">
                {report?.bookings?.conversionRate ?? 0}%
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 p-6">
            <div>
              <h2 className="text-xl font-bold">
                {t("contacts.title")}
              </h2>

              <p className="mt-1 text-sm text-white/50">
                {t("portal.home.customers.description")}
              </p>
            </div>

            <Link
              href="/portal/customers"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-purple-300 hover:text-purple-200"
            >
              {t("portal.home.viewAll")}
              <FiArrowRight />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
            {[
              {
                label: t("contacts.stats.total"),
                value: contactStats.total,
              },
              {
                label: t("contacts.stats.leads"),
                value: contactStats.leads,
              },
              {
                label: t("contacts.stats.clients"),
                value: contactStats.clientes,
              },
              {
                label: t(
                  "contacts.stats.recurring"
                ),
                value: contactStats.recurrentes,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#111126] p-4 text-center"
              >
                <p className="text-xs text-white/45">
                  {item.label}
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {contacts.length === 0 ? (
            <div className="p-10 text-center text-sm text-white/45">
              {t("contacts.empty.title")}
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {contacts.slice(0, 5).map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-300">
                      {contact.estado_cliente ===
                      "recurrente" ? (
                        <FiUserCheck />
                      ) : (
                        <FiUsers />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {contact.nombre ||
                          t("contacts.unnamed")}
                      </p>

                      <p className="mt-1 truncate text-sm text-white/45">
                        {contact.telefono ||
                          contact.email ||
                          "—"}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">
                      {contact.reservas}
                    </p>

                    <p className="text-xs text-white/40">
                      {t(
                        "contacts.activity.bookings"
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 p-6">
            <div>
              <h2 className="text-xl font-bold">
                {t("history.title")}
              </h2>

              <p className="mt-1 text-sm text-white/50">
                {t(
                  "portal.home.conversations.description"
                )}
              </p>
            </div>

            <Link
              href="/portal/conversations"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-purple-300 hover:text-purple-200"
            >
              {t("portal.home.viewAll")}
              <FiArrowRight />
            </Link>
          </div>

          {messages.length === 0 ? (
            <div className="p-10 text-center text-sm text-white/45">
              {t("history.empty")}
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {messages.map((message) => {
                const isCustomer =
                  message.role?.toLowerCase() ===
                  "user";

                const resolvedChannel =
                  canonicalChannel(
                    message.canal ||
                      message.channel ||
                      message.source
                  );

                return (
                  <div
                    key={message.id}
                    className="p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-purple-300">
                          {channelIcon(
                            resolvedChannel
                          )}
                        </span>

                        <p className="truncate text-sm font-semibold">
                          {isCustomer
                            ? message.nombre_cliente ||
                              message.from_number ||
                              t(
                                "history.sender.client"
                              )
                            : t(
                                "history.sender.assistant"
                              )}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-white/35">
                        {formatDateTime(
                          message.timestamp
                        )}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">
                      {message.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/5 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {t("reports.title")}
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-white/55">
              {t("reports.subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={downloadReport}
            disabled={!report}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiBarChart2 />
            {t("reports.downloadPdf")}
          </button>
        </div>
      </section>
    </div>
  );
}