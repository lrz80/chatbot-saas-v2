"use client";

import { useEffect, useMemo, useState } from "react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.aamy.ai";

type MonthlySummary = {
  month: string;
  totalMessages: number;
  uniqueCustomers: number;
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

function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
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

function ProgressBar({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
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
  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error || "Error loading monthly report");
      }

      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error loading monthly report"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(month);
  }, [month]);

  const voiceEstimateLabel = data?.voice.estimatedFromMessages
    ? "Estimated from conversation history"
    : data?.voice.partiallyEstimated
      ? "Partially estimated from history"
      : "Based on real voice call records";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Monthly Report
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Performance summary for Aamy conversations, voice calls, and bookings.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Select month
            </label>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm outline-none focus:border-gray-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
            Loading report...
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
                    Report period
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {formatMonthLabel(data.month)}
                  </h2>
                </div>

                <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                  {data.month}
                </div>
              </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total messages"
                value={data.totalMessages}
                subtitle="All recorded customer and assistant messages"
              />

              <StatCard
                title="Unique customers"
                value={data.uniqueCustomers}
                subtitle="Unique contacts detected this month"
              />

              <StatCard
                title="Voice calls"
                value={data.voice.calls}
                subtitle={voiceEstimateLabel}
              />

              <StatCard
                title="Voice minutes"
                value={data.voice.minutes}
                subtitle={`${data.voice.seconds} seconds used`}
              />
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Bookings
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Booking activity created by Aamy during this period.
                    </p>
                  </div>

                  <div className="rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white">
                    {data.bookings.conversionRate}% conversion
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatCard
                    title="Started"
                    value={data.bookings.started}
                    subtitle={
                      data.bookings.startedEstimatedFromAppointments
                        ? "Estimated from appointments"
                        : "From booking sessions"
                    }
                  />

                  <StatCard
                    title="Created"
                    value={data.bookings.appointmentsCreated}
                    subtitle="Appointments created"
                  />

                  <StatCard
                    title="Confirmed"
                    value={data.bookings.confirmed}
                    subtitle="Successful appointments"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">
                  Follow-up needed
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  High-interest conversations that may need human attention.
                </p>

                <div className="mt-6 text-center">
                  <p className="text-5xl font-bold text-gray-900">
                    {data.followUpNeeded}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    pending follow-ups
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">
                  Conversations by channel
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Message volume grouped by channel.
                </p>

                <div className="mt-6 space-y-5">
                  {Object.entries(data.conversationsByChannel).map(
                    ([channel, value]) => {
                      const total = typeof value === "number" ? value : 0;

                      return (
                        <div key={channel}>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="capitalize text-sm font-medium text-gray-700">
                              {channel}
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
                  Top intentions
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Most common customer intentions detected this month.
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
                      No intentions detected yet
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      This will populate when sales intelligence records are available.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">
                Voice details
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Voice messages"
                  value={data.voice.messages}
                  subtitle="Voice conversation messages"
                />

                <StatCard
                  title="Call records"
                  value={data.voice.realCalls ?? data.voice.calls}
                  subtitle="Rows found in voice_calls"
                />

                <StatCard
                  title="Estimated calls"
                  value={data.voice.estimatedCalls ?? 0}
                  subtitle="Fallback from message history"
                />

                <StatCard
                  title="Data source"
                  value={
                    data.voice.estimatedFromMessages
                      ? "Estimated"
                      : data.voice.partiallyEstimated
                        ? "Mixed"
                        : "Real"
                  }
                  subtitle={voiceEstimateLabel}
                />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}