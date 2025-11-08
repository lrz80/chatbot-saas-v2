"use client";
import { useEffect, useState } from "react";

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
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/channel/status?canal=${canal}`,
      { credentials: "include" }
    );
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
}: {
  canal: Canal;
  className?: string;
  showBanner?: boolean;
}) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetchStatus(canal).then(setStatus);
  }, [canal]);

  const label = CANAL_LABEL[canal];

  // 🔵 Estado pill (chip)
  const pill = (() => {
    const blocked = status?.blocked;
    const text = blocked ? "Bloqueado por tu plan" : "Activo";
    const color = blocked
      ? "bg-yellow-700/40 text-yellow-200"
      : "bg-green-700/40 text-green-200";
    return (
      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${color}`}>
        {text}
      </span>
    );
  })();

  // 🟡 Banner (bloqueo o mantenimiento)
  const banner = (() => {
    if (!showBanner || !status) return null;
    if (!status.blocked) return null;

    let title = `${label} está bloqueado`;
    let body = "Tu plan actual no incluye este canal.";
    let action = "Actualizar plan";
    let actionLink = "/upgrade";

    if (status.reason === "maintenance") {
      title = `${label} en mantenimiento`;
      body =
        status.maintenance_message ||
        "Este canal está temporalmente en mantenimiento.";
      action = "Volver más tarde";
      actionLink = "#";
    } else if (status.reason === "paused") {
      title = `${label} en pausa`;
      body = status.paused_until
        ? `Este canal se reanudará aprox. el ${new Date(
            status.paused_until
          ).toLocaleString()}.`
        : "Este canal está en pausa temporal.";
      action = "Volver más tarde";
      actionLink = "#";
    }

    return (
      <div className="rounded-md border border-yellow-700/30 bg-yellow-900/30 p-4 text-yellow-100 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold mb-1">{title}</div>
            <div className="text-sm opacity-80">{body}</div>
          </div>
          <a
            href={actionLink}
            className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${
              status.reason === "plan"
                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-zinc-700 text-white cursor-default"
            }`}
            {...(status.reason === "plan"
              ? {}
              : { onClick: (e) => e.preventDefault() })}
          >
            {action}
          </a>
        </div>
      </div>
    );
  })();

  // 🧱 Render principal
  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-purple-200">
          {`Campañas por ${label}`}
        </h1>
        {pill}
      </div>
      {banner}
    </div>
  );
}
