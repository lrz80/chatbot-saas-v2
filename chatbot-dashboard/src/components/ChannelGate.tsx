"use client";
import { ReactNode, useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";

type Canal = "sms" | "email" | "whatsapp" | "meta" | "voice";

type StatusSlim = { canal: Canal; blocked: boolean };

async function fetchStatus(canal: Canal): Promise<StatusSlim | null> {
  try {
    const r = await fetch(`${BACKEND_URL}/api/channel/status?canal=${canal}`, {
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

  if (variant === "banner-only") return <div className={className}>{children}</div>;
  if (blocked === null) return <div className={className}>{children}</div>;
  if (blocked) return <div className={className} />;

  return <div className={className}>{children}</div>;
}
