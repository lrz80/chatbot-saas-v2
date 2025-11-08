"use client";
import { ReactNode, useEffect, useState } from "react";

type Canal = "sms" | "email" | "whatsapp" | "meta" | "voice";
type Status = {
  canal: Canal;
  blocked: boolean;
};

async function fetchStatus(canal: Canal): Promise<Status | null> {
  try {
    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      (typeof window !== "undefined" ? "" : "");
    const r = await fetch(`${base}/api/channel/status?canal=${canal}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = await r.json();
    return { canal: j.canal, blocked: !!j.blocked };
  } catch {
    return null;
  }
}

/**
 * variant:
 * - "banner-only": nunca oculta children (útil si quieres ver todo pero mostrar el aviso con ChannelStatus).
 * - "block-when-locked": oculta children cuando el canal está bloqueado (default).
 */
export default function ChannelGate({
  canal,
  children,
  className,
  variant = "block-when-locked",
}: {
  canal: Canal;
  children: ReactNode;
  className?: string;
  variant?: "banner-only" | "block-when-locked";
}) {
  const [blocked, setBlocked] = useState<boolean | null>(null);

  useEffect(() => {
    fetchStatus(canal).then((s) => setBlocked(s?.blocked ?? null));
  }, [canal]);

  if (variant === "banner-only") {
    return <div className={className}>{children}</div>;
  }

  // Mientras carga, no ocultes nada (evita parpadeo)
  if (blocked === null) return <div className={className}>{children}</div>;

  // Bloqueado => oculta children
  if (blocked) return <div className={className} />;

  // Desbloqueado => muestra children
  return <div className={className}>{children}</div>;
}
