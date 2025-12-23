'use client';

import { useState } from 'react';
import { BACKEND_URL } from '@/utils/api';

type Props = {
  disabled?: boolean;
};

export default function ConnectWhatsAppTwilioEmbeddedSignupButton({ disabled }: Props) {
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (disabled) return;

    try {
        setLoading(true);

        const res = await fetch(
        `${BACKEND_URL}/api/twilio/whatsapp/start-embedded-signup`,
        {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        }
        );

        const data = await res.json().catch(() => ({} as any));

        if (!res.ok) {
        throw new Error(data?.error || "No se pudo iniciar Twilio (subcuenta)");
        }

        // ✅ Nuevo contrato del backend (sin signupUrl)
        // data = { ok:true, status:'pending'|'approved'|'connected', message:'...' }
        const status = String(data?.status || "pending").toLowerCase();

        if (status === "approved" || status === "connected") {
        alert("WhatsApp conectado correctamente ✅");
        } else {
        alert(
            data?.message ||
            "Subcuenta Twilio creada/validada. Falta comprar y asignar el número de WhatsApp. La activación puede tardar hasta 24 horas."
        );
        }
    } catch (e: any) {
        console.error("❌ Twilio start-embedded-signup error:", e);
        alert(e?.message || "Error iniciando conexión con Twilio");
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
