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

      const res = await fetch(`${BACKEND_URL}/api/twilio/whatsapp/start-embedded-signup`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || 'No se pudo iniciar Twilio Embedded Signup');
      if (!data?.signupUrl) throw new Error('No se recibió signupUrl desde backend');

      window.location.href = data.signupUrl;
    } catch (e: any) {
      console.error('❌ Twilio start-embedded-signup error:', e);
      alert(e?.message || 'Error iniciando conexión con Twilio');
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
