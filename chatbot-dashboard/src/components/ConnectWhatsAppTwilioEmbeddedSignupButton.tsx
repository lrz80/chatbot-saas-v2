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
    setLoading(true);

    // 1) Crear subcuenta si no existe
    await fetch(`${BACKEND_URL}/api/twilio/whatsapp/start-embedded-signup`, {
        method: "POST",
        credentials: "include",
    });

    // 2) Sincronizar número ya aprobado
    await fetch(`${BACKEND_URL}/api/twilio/whatsapp/sync-sender`, {
        method: "POST",
        credentials: "include",
    });

    alert("WhatsApp Twilio conectado correctamente.");
    window.location.reload();
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
