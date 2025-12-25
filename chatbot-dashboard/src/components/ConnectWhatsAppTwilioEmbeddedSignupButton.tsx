'use client';

import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/utils/api';

type Props = {
  disabled?: boolean;
  onComplete?: () => void;
};

const META_APP_ID = '672113805196816';
const CONFIG_ID = '632870913208512';

export default function ConnectWhatsAppTwilioEmbeddedSignupButton({ disabled, onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  // 1) Cargar SDK
  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) {
      setSdkReady(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v21.0',
      });
      setSdkReady(true);
    };

    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    js.async = true;
    document.body.appendChild(js);
  }, []);

  // 2) Listener para capturar datos del Embedded Signup
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      const allowedOrigins = ['https://www.facebook.com', 'https://web.facebook.com'];
      if (!allowedOrigins.includes(event.origin)) return;

      let data: any = event.data;
      try {
        if (typeof data === 'string') data = JSON.parse(data);
      } catch {}

      // IMPORTANTE: aquí no asumimos estructura exacta: log y extraemos lo que podamos
      // En producción, cuando veamos el payload real, afinamos.
      const payload = data?.payload ?? data;

      const wabaId =
        payload?.waba_id ||
        payload?.whatsapp_business_account_id ||
        payload?.wabaId;

      const businessId =
        payload?.business_id ||
        payload?.business_manager_id ||
        payload?.businessId;

      const phoneNumberId =
        payload?.phone_number_id ||
        payload?.whatsapp_phone_number_id ||
        payload?.phoneNumberId;

      // Si no hay nada útil, ignorar
      if (!wabaId && !businessId && !phoneNumberId) return;

      console.log('✅ EmbeddedSignup capturado:', { wabaId, businessId, phoneNumberId, raw: data });

      try {
        setLoading(true);

        // 3) Guardar resultado del signup + que backend registre sender en Twilio
        const r = await fetch(`${BACKEND_URL}/api/twilio/whatsapp/embedded-signup/complete`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            waba_id: wabaId,
            business_id: businessId,
            phone_number_id: phoneNumberId,
            raw: data, // opcional: si quieres guardar el raw para debug
          }),
        });

        const j = await r.json().catch(() => ({} as any));
        if (!r.ok) throw new Error(j?.error || 'Error completando Embedded Signup');

        if (j?.status === 'approved') {
          alert(`✅ WhatsApp Twilio conectado: ${j.twilio_number || ''}`);
          onComplete?.();
          window.location.reload();
          return;
        }

        alert('⏳ Embedded Signup OK. El sender está pendiente de aprobación o falta número. Revisa Twilio > WhatsApp Senders.');
        onComplete?.();
      } catch (e: any) {
        console.error('❌ EmbeddedSignup complete error:', e);
        alert(e?.message || 'Error finalizando conexión');
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onComplete]);

  const start = async () => {
    if (disabled || loading) return;
    if (!sdkReady || !window.FB) {
      alert('FB SDK no está listo todavía.');
      return;
    }

    setLoading(true);
    try {
      // (Opcional) Si tu backend necesita preparar subcuenta/estado interno, deja este paso:
      const r1 = await fetch(`${BACKEND_URL}/api/twilio/whatsapp/start-embedded-signup`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const j1 = await r1.json().catch(() => ({} as any));
      if (!r1.ok) throw new Error(j1?.error || 'Error preparando Twilio');

      // Ahora sí: abrir Embedded Signup (NO hacemos sync-sender aquí)
      window.FB.login(
        (response: any) => {
          console.log('[EmbeddedSignup] FB.login response:', response);
          // Lo importante llega por postMessage (listener)
        },
        {
          config_id: CONFIG_ID,
          response_type: 'code',
          override_default_response_type: true,
          scope: 'whatsapp_business_management,whatsapp_business_messaging',
        }
      );
    } catch (e: any) {
      console.error('❌ Twilio connect start error:', e);
      alert(e?.message || 'Error iniciando Embedded Signup');
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
