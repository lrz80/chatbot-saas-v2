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

        const res = await fetch(`${BACKEND_URL}/api/twilio/whatsapp/start-embedded-signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        });

        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) throw new Error(data?.error || "No se pudo iniciar la conexión con Twilio");

        // ✅ NO redirigir a Twilio
        // ✅ NO alert
        // Solo refrescar settings para que UI muestre "Pendiente"
        onComplete?.();

    } catch (e: any) {
        console.error("❌ Twilio start-embedded-signup error:", e);
        // Si quieres, aquí puedes setear un estado local para mostrar error en UI,
        // pero por ahora lo dejamos solo log.
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
