'use client';

import { useState } from 'react';
import { BACKEND_URL } from '@/utils/api';

type Props = {
  disabled?: boolean;
  onComplete?: () => void;
};

export default function ConnectWhatsAppTwilioEmbeddedSignupButton({ disabled, onComplete }: Props) {
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (disabled) return;

    try {
        setLoading(true);

        // 1) Crear subcuenta si hace falta
        const r1 = await fetch(`${BACKEND_URL}/api/twilio/whatsapp/start-embedded-signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        });

        const j1 = await r1.json().catch(() => ({} as any));
        if (!r1.ok) throw new Error(j1?.error || "Error creando subcuenta Twilio");

        // 2) Sincronizar sender (aquí es donde te da 500)
        const r2 = await fetch(`${BACKEND_URL}/api/twilio/whatsapp/sync-sender`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        });

        const j2 = await r2.json().catch(() => ({} as any));
        if (!r2.ok) throw new Error(j2?.error || "Error sincronizando sender (Twilio)");

        // 3) Mensaje según status real
        if (j2?.status === "approved") {
        alert(`✅ WhatsApp Twilio conectado: ${j2.twilio_number}`);
        window.location.reload();
        return;
        }

        alert("⏳ Subcuenta lista, pero el número aún no está aprobado / no hay sender activo. Revisa Twilio > WhatsApp Senders.");
    } catch (e: any) {
        console.error("❌ Twilio connect error:", e);
        alert(e?.message || "Error conectando WhatsApp Twilio");
    } finally {
        setLoading(false);
    }
    };

  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled || loading}
      className={`px-3 py-1.5 rounded-md text-sm border ${
        disabled || loading
          ? 'opacity-60 cursor-not-allowed bg-white/5 border-white/20'
          : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500'
      }`}
    >
      {loading ? 'Conectando…' : 'Conectar WhatsApp (Twilio)'}
    </button>
  );
}
