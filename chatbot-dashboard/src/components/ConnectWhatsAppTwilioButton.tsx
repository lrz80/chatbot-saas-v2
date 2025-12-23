'use client';

import { useState } from 'react';
import { BACKEND_URL } from '@/utils/api';

export default function ConnectWhatsAppTwilioButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${BACKEND_URL}/api/twilio/whatsapp/start-embedded-signup`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'No se pudo iniciar Embedded Signup');

      if (!data?.signupUrl) throw new Error('Backend no devolvió signupUrl');

      // ✅ redirige a Twilio Embedded Signup
      window.location.href = data.signupUrl;
    } catch (e: any) {
      setError(e?.message || 'Error iniciando conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={start}
        disabled={loading}
        style={{
          opacity: loading ? 0.7 : 1,
          padding: '10px 14px',
          borderRadius: 10,
          fontWeight: 600,
        }}
      >
        {loading ? 'Conectando…' : 'Conectar WhatsApp (Twilio)'}
      </button>

      {error && (
        <p style={{ marginTop: 10, color: 'crimson' }}>
          {error}
        </p>
      )}
    </div>
  );
}
