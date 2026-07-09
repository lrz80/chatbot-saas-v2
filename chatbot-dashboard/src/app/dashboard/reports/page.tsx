"use client";

import { useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/i18n/LanguageProvider";

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

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(month: string, lang: string): string {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  return date.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
    month: "long",
    year: "numeric",
  });
}

function calculateFrontendFallbackTimeSavedMinutes(data: MonthlySummary): number {
  const messageMinutes = data.totalMessages * 0.75;
  const voiceMinutes = data.voice.calls * 3;
  const bookingMinutes = data.bookings.confirmed * 4;

  return Math.round((messageMinutes + voiceMinutes + bookingMinutes) * 10) / 10;
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {subtitle ? (
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full bg-gray-900 transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default function MonthlyReportsPage() {
  const { t, lang } = useI18n();

  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function tr(key: string, vars?: Record<string, string | number>): string {
    let text = t(key);

    if (!vars) return text;

    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{{${name}}}`, String(value));
    }

    return text;
  }

  function downloadPdf() {
    window.open(
      `${BACKEND_URL}/api/reports/monthly-summary.pdf?month=${month}`,
      "_blank"
    );
  }

  function getChannelLabel(channel: string): string {
    const normalized = channel.toLowerCase();

    if (normalized === "voice") return t("dashboard.channels.voice");
    if (normalized === "whatsapp") return t("dashboard.channels.whatsapp");
    if (normalized === "instagram") return t("dashboard.channels.instagram");
    if (normalized === "facebook") return t("dashboard.channels.facebook");
    if (normalized === "unknown") return t("dashboard.channels.other");

    return channel;
  }

  const maxChannelValue = useMemo(() => {
    if (!data) return 0;

    return Math.max(
      ...Object.values(data.conversationsByChannel).map((value) =>
        typeof value === "number" ? value : 0
      ),
      0
    );
  }, [data]);

  async function loadReport(selectedMonth: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/reports/monthly-summary?month=${selectedMonth}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error || t("reports.errorLoading"));
      }

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reports.errorLoading"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const voiceEstimateLabel = data?.voice.estimatedFromMessages
    ? t("reports.voiceCallsEstimated")
    : data?.voice.partiallyEstimated
      ? t("reports.voiceCallsMixed")
      : t("reports.voiceCallsReal");

  const estimatedTimeSavedMinutes = data
    ? data.estimatedTimeSavedMinutes ??
      calculateFrontendFallbackTimeSavedMinutes(data)
    : 0;

  const estimatedTimeSavedHours =
    data?.estimatedTimeSavedHours ??
    Math.round((estimatedTimeSavedMinutes / 60) * 10) / 10;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("reports.title")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("reports.subtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                {t("reports.selectMonth")}
              </label>
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm outline-none focus:border-gray-900"
              />
            </div>

            <button
              type="button"
              onClick={downloadPdf}
              disabled={!data || loading}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("reports.downloadPdf")}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
            {t("reports.loading")}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        ) : null}

        {!loading && data ? (
          <>
            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {t("reports.reportPeriod")}
                  </p>
                  <h2 className="text-2xl font-bold capitalize text-gray-900">
                    {formatMonthLabel(data.month, lang)}
                  </h2>
                </div>

                <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                  {data.month}
                </div>
              </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title={t("reports.totalMessages")}
                value={data.totalMessages}
                subtitle={t("reports.totalMessagesSubtitle")}
              />

              <StatCard
                title={t("reports.uniqueCustomers")}
                value={data.uniqueCustomers}
                subtitle={t("reports.uniqueCustomersSubtitle")}
              />

              <StatCard
                title={t("reports.voiceCalls")}
                value={data.voice.calls}
                subtitle={voiceEstimateLabel}
              />

              <StatCard
                title={t("reports.estimatedTimeSaved")}
                value={`${estimatedTimeSavedMinutes} min`}
                subtitle={
                  estimatedTimeSavedHours >= 1
                    ? tr("reports.estimatedTimeSavedHours", {
                        hours: estimatedTimeSavedHours,
                      })
                    : t("reports.estimatedTimeSavedSubtitle")
                }
              />
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {t("reports.bookings")}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {t("reports.bookingsSubtitle")}
                    </p>
                  </div>

                  <div className="rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white">
                    {tr("reports.conversion", {
                      rate: data.bookings.conversionRate,
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatCard
                    title={t("reports.started")}
                    value={data.bookings.started}
                    subtitle={t("reports.startedSubtitle")}
                  />

                  <StatCard
                    title={t("reports.created")}
                    value={data.bookings.appointmentsCreated}
                    subtitle={t("reports.createdSubtitle")}
                  />

                  <StatCard
                    title={t("reports.confirmed")}
                    value={data.bookings.confirmed}
                    subtitle={t("reports.confirmedSubtitle")}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">
                  {t("reports.followUpNeeded")}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t("reports.followUpSubtitle")}
                </p>

                <div className="mt-6 text-center">
                  <p className="text-5xl font-bold text-gray-900">
                    {data.followUpNeeded}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    {t("reports.pendingFollowUps")}
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">
                  {t("reports.conversationsByChannel")}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t("reports.channelSubtitle")}
                </p>

                <div className="mt-6 space-y-5">
                  {Object.entries(data.conversationsByChannel).map(
                    ([channel, value]) => {
                      const total = typeof value === "number" ? value : 0;

                      return (
                        <div key={channel}>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">
                              {getChannelLabel(channel)}
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                              {total}
                            </p>
                          </div>
                          <ProgressBar value={total} max={maxChannelValue} />
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">
                  {t("reports.topIntentions")}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t("reports.topIntentionsSubtitle")}
                </p>

                {data.topIntentions.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    {data.topIntentions.map((item) => (
                      <div
                        key={item.intention}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {item.intention}
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {item.total}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                    <p className="text-sm font-medium text-gray-700">
                      {t("reports.noIntentions")}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {t("reports.noIntentionsSubtitle")}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">
                {t("reports.voiceDetails")}
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title={t("reports.voiceMessages")}
                  value={data.voice.messages}
                  subtitle={t("reports.voiceMessagesSubtitle")}
                />

                <StatCard
                  title={t("reports.voiceCalls")}
                  value={data.voice.calls}
                  subtitle={voiceEstimateLabel}
                />

                <StatCard
                  title={t("reports.voiceMinutes")}
                  value={data.voice.minutes}
                  subtitle={tr("reports.secondsUsed", {
                    seconds: data.voice.seconds,
                  })}
                />

                <StatCard
                  title={t("reports.afterHoursCalls")}
                  value={
                    data.voice.afterHoursAvailable === false
                      ? "-"
                      : data.voice.afterHoursCalls ?? 0
                  }
                  subtitle={
                    data.voice.afterHoursAvailable === false
                      ? t("reports.afterHoursUnavailable")
                      : t("reports.afterHoursSubtitle")
                  }
                />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}