//src/app/portal/page.tsx
"use client";

import Link from "next/link";
import {
  FiArrowRight,
  FiCalendar,
  FiClock,
  FiMessageSquare,
  FiPhone,
  FiUsers,
} from "react-icons/fi";

import { useTenant } from "@/context/TenantContext";
import { useI18n } from "@/i18n/LanguageProvider";

type MetricValue = number | string | null | undefined;

type PortalSummary = {
  interactions?: MetricValue;
  calls?: MetricValue;
  appointments?: MetricValue;
  newCustomers?: MetricValue;
  afterHours?: MetricValue;
  minutesUsed?: MetricValue;
};

function displayMetric(value: MetricValue): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat().format(value);
  }

  return String(value);
}

export default function PortalHomePage() {
  const tenant = useTenant();
  const { t } = useI18n();

  const summary: PortalSummary =
    tenant?.portal_summary ??
    tenant?.summary ??
    tenant?.metrics ??
    {};

  const metrics = [
    {
      key: "interactions",
      label: t("portal.home.metrics.interactions"),
      value: summary.interactions,
      icon: <FiMessageSquare />,
    },
    {
      key: "calls",
      label: t("portal.home.metrics.calls"),
      value: summary.calls,
      icon: <FiPhone />,
    },
    {
      key: "appointments",
      label: t("portal.home.metrics.appointments"),
      value: summary.appointments,
      icon: <FiCalendar />,
    },
    {
      key: "newCustomers",
      label: t("portal.home.metrics.newCustomers"),
      value: summary.newCustomers,
      icon: <FiUsers />,
    },
    {
      key: "afterHours",
      label: t("portal.home.metrics.afterHours"),
      value: summary.afterHours,
      icon: <FiClock />,
    },
    {
      key: "minutesUsed",
      label: t("portal.home.metrics.minutesUsed"),
      value: summary.minutesUsed,
      icon: <FiPhone />,
    },
  ];

  const quickActions = [
    {
      href: "/portal/appointments",
      title: t("portal.home.actions.appointments.title"),
      description: t("portal.home.actions.appointments.description"),
    },
    {
      href: "/portal/customers",
      title: t("portal.home.actions.customers.title"),
      description: t("portal.home.actions.customers.description"),
    },
    {
      href: "/portal/conversations",
      title: t("portal.home.actions.conversations.title"),
      description: t("portal.home.actions.conversations.description"),
    },
    {
      href: "/portal/reports",
      title: t("portal.home.actions.reports.title"),
      description: t("portal.home.actions.reports.description"),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <p className="mb-2 text-sm font-medium text-purple-300">
          {t("portal.home.eyebrow")}
        </p>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("portal.home.title")}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
          {t("portal.home.description")}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <article
            key={metric.key}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/55">{metric.label}</p>

                <p className="mt-3 text-3xl font-bold">
                  {displayMetric(metric.value)}
                </p>
              </div>

              <div className="rounded-xl bg-purple-500/15 p-3 text-xl text-purple-300">
                {metric.icon}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            {t("portal.home.actions.title")}
          </h2>

          <p className="mt-1 text-sm text-white/50">
            {t("portal.home.actions.description")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-purple-500/40 hover:bg-purple-500/[0.08]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{action.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-white/55">
                    {action.description}
                  </p>
                </div>

                <FiArrowRight className="mt-1 shrink-0 text-white/40 transition group-hover:translate-x-1 group-hover:text-purple-300" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}