"use client";
import { useEffect, useState } from "react";

type Canal = "sms" | "email" | "whatsapp" | "meta" | "voice";

export default function ChannelStatus({ canal }: { canal: Canal }) {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/channel/status?canal=${canal}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [canal]);

  const label: Record<Canal, string> = {
    sms: "SMS",
    email: "Email",
    whatsapp: "WhatsApp",
    meta: "Facebook / Instagram",
    voice: "Voz",
  };

  const blocked = status?.blocked;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-2xl font-bold">{`Campañas por ${label[canal]}`}</h2>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            blocked
              ? "bg-yellow-600/30 text-yellow-300"
              : "bg-green-600/30 text-green-300"
          }`}
        >
          {blocked ? "Bloqueado por tu plan" : "Activo"}
        </span>
      </div>

      {blocked && (
        <div className="p-4 bg-yellow-900/30 border border-yellow-700/40 rounded text-yellow-100 text-sm">
          {`${label[canal]} está bloqueado en tu plan actual.`}
          <a
            href="/upgrade"
            className="ml-3 px-3 py-1 bg-indigo-600 rounded text-white text-xs"
          >
            Actualizar plan
          </a>
        </div>
      )}
    </div>
  );
}
