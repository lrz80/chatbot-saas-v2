"use client";
import { ReactNode, useEffect, useState } from "react";

type Canal = "sms" | "email" | "whatsapp" | "meta" | "voice";

async function fetchBlocked(canal: Canal) {
  const r = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/channel/status?canal=${canal}`,
    { credentials: "include" }
  );
  if (!r.ok) return true;
  const j = await r.json();
  return !!j.blocked;
}

export default function ChannelGate({
  canal,
  children,
}: {
  canal: Canal;
  children: ReactNode;
}) {
  const [blocked, setBlocked] = useState<boolean>(true);

  useEffect(() => {
    fetchBlocked(canal).then(setBlocked);
  }, [canal]);

  if (!blocked) return <>{children}</>;
  return (
    <div className="pointer-events-none opacity-40 select-none">
      {children}
    </div>
  );
}
