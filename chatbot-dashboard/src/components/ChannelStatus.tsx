"use client";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "../i18n/LanguageProvider";


type Canal = "sms" | "email" | "whatsapp" | "meta" | "voice";

type Status = {
  canal: Canal;
  enabled: boolean;
  blocked: boolean;
  blocked_by_plan: boolean;
  maintenance: boolean;
  maintenance_message: string | null;
  paused_until: string | null;
  reason: "plan" | "maintenance" | "paused" | null;
};

async function fetchStatus(canal: Canal): Promise<Status | null> {
  try {
    const r = await fetch(`${BACKEND_URL}/api/channel/status?canal=${canal}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) return null;
    return (await r.json()) as Status;
  } catch {
    return null;
  }
}

const CANAL_LABEL: Record<Canal, string> = {
  sms: "SMS",
  email: "Email",
  whatsapp: "WhatsApp",
  meta: "Facebook / Instagram",
  voice: "Voz",
};

export default function ChannelStatus({
  canal,
  className = "",
  showBanner = true,
  hideTitle = true,
  membershipInactive = false,              // ✅ nueva prop
}: {
  canal: Canal;
  className?: string;
  showBanner?: boolean;
  hideTitle?: boolean;
  membershipInactive?: boolean;           // ✅ en el tipo también
}) {
  const { t } = useI18n();

  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchStatus(canal).then((s) => {
      if (!alive) return;
      setStatus(s);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [canal]);

  const label = t(`channel.label.${canal}`) || CANAL_LABEL[canal];

  // PILL
  const pill = (() => {
    if (loading) {
      return (
        <span className="rounded-full px-2 py-1 text-xs font-semibold bg-zinc-700/40 text-zinc-300 animate-pulse">
          {t("channel.loading")}
        </span>
      );
    }
    if (!status) {
      return (
        <span className="rounded-full px-2 py-1 text-xs font-semibold bg-zinc-700/40 text-zinc-300">
          {t("channel.noData")}
        </span>
      );
    }

    const isPlanBlocked = status.blocked_by_plan || status.reason === "plan";
    const isMaint = status.reason === "maintenance";
    const isPaused = status.reason === "paused";

    // ✅ La membresía inactiva fuerza bloqueo visual
    const blocked =
      membershipInactive || status.blocked || isPlanBlocked || isMaint || isPaused;

    let text = t("channel.active");

    if (blocked) {
      if (membershipInactive) text = t("channel.blocked.membership");
      else if (isPlanBlocked) text = t("channel.blocked.plan");
      else if (isMaint) text = t("channel.blocked.maintenance");
      else if (isPaused) text = t("channel.blocked.paused");
      else text = t("channel.blocked.generic");
    }

    const color = blocked
      ? "bg-yellow-700/40 text-yellow-200"
      : "bg-green-700/40 text-green-200";

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${color}`}>
        {text}
      </span>
    );
  })();

  // BANNER
  const banner = (() => {
    if (!showBanner || loading || !status) return null;

    const isPlanBlocked = status.blocked_by_plan || status.reason === "plan";
    const isMaint = status.reason === "maintenance";
    const isPaused = status.reason === "paused";

    const shouldShow =
      membershipInactive || status.blocked || isPlanBlocked || isMaint || isPaused;
    if (!shouldShow) return null;

    let title = t("channel.banner.blockedTitle", { channel: label });
    let body = t("channel.banner.blockedBody");
    let action = t("channel.banner.upgrade");
    let isPlan = true;

    if (membershipInactive) {
      // ✅ Caso membresía inactiva (más claro que “plan”)
      body = t("channel.banner.membershipInactive");
    } else if (isMaint) {
      title = t("channel.banner.maintenanceTitle", { channel: label });
      body = status.maintenance_message || t("channel.banner.maintenanceBody");
      action = t("channel.banner.comeBackLater");
      isPlan = false;
    } else if (isPaused) {
      title = `${label} en pausa`;
      body = status.paused_until
        ? t("channel.banner.pausedUntil", {
            datetime: new Date(status.paused_until).toLocaleString(),
          })
        : t("channel.banner.pausedBody");
      action = t("channel.banner.comeBackLater");
      isPlan = false;
    }

    return (
      <div className="rounded-md border border-yellow-700/30 bg-yellow-900/30 p-4 text-yellow-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold mb-1">{title}</div>
            <div className="text-sm opacity-80">{body}</div>
          </div>
          <a
            href={isPlan ? "/upgrade" : "#"}
            className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${
              isPlan
                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-zinc-700 text-white cursor-default"
            }`}
            onClick={(e) => { if (!isPlan) e.preventDefault(); }}
          >
            {action}
          </a>
        </div>
      </div>
    );
  })();

  return (
    <div className={className}>
      {hideTitle ? (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm opacity-75">{t("channel.statusLabel")}</span>
          {pill}
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{t("channel.campaignsTitle", { channel: label })}</h2>
          {pill}
        </div>
      )}
      {banner}
    </div>
  );
}
