"use client";
import { useEffect, useState } from "react";
import ChannelStatus from "./ChannelStatus";

type Canal = "sms" | "email" | "whatsapp" | "meta" | "voice";

export default function ChannelGate({
  canal,
  children,
}: {
  canal: Canal;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/channel/status?canal=${canal}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [canal]);

  // 🟣 SIEMPRE mostrar encabezado + banner
  return (
    <div className="w-full">
      <ChannelStatus canal={canal} />

      {/* ✅ Si el canal está bloqueado, SOLO ocultar las acciones */}
      {status?.blocked ? (
        <div className="opacity-50 pointer-events-none select-none">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
