"use client";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";

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

  const label = CANAL_LABEL[canal];

  // PILL
  const pill = (() => {
    if (loading) {
      return (
        <span className="rounded-full px-2 py-1 text-xs font-semibold bg-zinc-700/40 text-zinc-300 animate-pulse">
          Cargando…
        </span>
      );
    }
    if (!status) {
      return (
        <span className="rounded-full px-2 py-1 text-xs font-semibold bg-zinc-700/40 text-zinc-300">
          Sin datos
        </span>
      );
    }

    const isPlanBlocked = status.blocked_by_plan || status.reason === "plan";
    const isMaint = status.reason === "maintenance";
    const isPaused = status.reason === "paused";

    // ✅ La membresía inactiva fuerza bloqueo visual
    const blocked =
      membershipInactive || status.blocked || isPlanBlocked || isMaint || isPaused;

    let text = "Activo";
    if (blocked) {
      if (membershipInactive) text = "Restringido por membresía";
      else if (isPlanBlocked) text = "Bloqueado por tu plan";
      else if (isMaint) text = "En mantenimiento";
      else if (isPaused) text = "En pausa";
      else text = "Bloqueado";
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

    let title = `${label} está bloqueado`;
    let body = "Tu plan actual no incluye este canal.";
    let action = "Actualizar plan";
    let isPlan = true;

    if (membershipInactive) {
      // ✅ Caso membresía inactiva (más claro que “plan”)
      body = "Tu membresía está inactiva. Activa un plan para continuar.";
    } else if (isMaint) {
      title = `${label} en mantenimiento`;
      body = status.maintenance_message || "Este canal está temporalmente en mantenimiento.";
      action = "Volver más tarde";
      isPlan = false;
    } else if (isPaused) {
      title = `${label} en pausa`;
      body = status.paused_until
        ? `Este canal se reanudará aprox. el ${new Date(status.paused_until).toLocaleString()}.`
        : "Este canal está en pausa temporal.";
      action = "Volver más tarde";
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
          <span className="text-sm opacity-75">Estado del canal:</span>
          {pill}
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{`Campañas por ${label}`}</h2>
          {pill}
        </div>
      )}
      {banner}
    </div>
  );
}
