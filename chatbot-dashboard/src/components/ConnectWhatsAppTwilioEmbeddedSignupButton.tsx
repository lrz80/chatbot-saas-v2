'use client';

import { useEffect, useMemo, useState } from 'react';
import { BACKEND_URL } from '@/utils/api';

type Props = {
  disabled?: boolean;
  onComplete?: () => void;
};

const META_APP_ID = '672113805196816';
const CONFIG_ID = '632870913208512';
const SOLUTION_ID = process.env.NEXT_PUBLIC_TWILIO_PARTNER_SOLUTION_ID;

type NumberType = 'twilio' | 'personal';

export default function ConnectWhatsAppTwilioEmbeddedSignupButton({ disabled, onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [numberType, setNumberType] = useState<NumberType>('twilio');

  const buttonLabel = useMemo(() => {
    if (loading) return 'Conectando…';
    return numberType === 'twilio'
      ? 'Conectar WhatsApp (Número Twilio)'
      : 'Conectar WhatsApp (Mi número personal)';
  }, [loading, numberType]);

  // 1) Cargar SDK
  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) {
      setSdkReady(true);
      return;
    }

    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
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

      const payload = data?.payload ?? data;

      const wabaId =
        payload?.waba_id ||
        payload?.whatsapp_business_account_id ||
        payload?.wabaId;

      const businessId =
        payload?.business_id ||
        payload?.business_manager_id ||
        payload?.businessId;

      // En modo "personal" suele existir phone_number_id (pero depende del payload real)
      const phoneNumberId =
        payload?.phone_number_id ||
        payload?.whatsapp_phone_number_id ||
        payload?.phoneNumberId;

      if (!wabaId && !businessId && !phoneNumberId) return;

      console.log('✅ EmbeddedSignup capturado:', {
        numberType,
        wabaId,
        businessId,
        phoneNumberId,
        raw: data,
      });

      try {
        setLoading(true);

        const r = await fetch(`${BACKEND_URL}/api/twilio/whatsapp/embedded-signup/complete`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            waba_id: wabaId,
            business_id: businessId,
            phone_number_id: phoneNumberId,
            raw: data,
          }),
        });

        const j = await r.json().catch(() => ({} as any));
        if (!r.ok) throw new Error(j?.error || 'Error completando Embedded Signup');

        // Backend puede devolver:
        // - { mode: "personal", status: "connected" }
        // - { mode: "twilio", status: "pending" | "connected", whatsapp_sender_sid, ... }
        if (j?.status === 'connected') {
          alert('✅ WhatsApp conectado correctamente.');
          onComplete?.();
          window.location.reload();
          return;
        }

        alert('⏳ Embedded Signup OK. El estado está pendiente (puede requerir verificación/tiempo).');
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
  }, [onComplete, numberType]);

  const start = async () => {
    if (disabled || loading) return;
    if (!sdkReady || !(window as any).FB) {
      alert('FB SDK no está listo todavía.');
      return;
    }

    setLoading(true);
    try {
      // 0) Preparar backend + guardar whatsapp_number_type
      const r1 = await fetch(`${BACKEND_URL}/api/twilio/whatsapp/start-embedded-signup`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_number_type: numberType, // "twilio" | "personal"
        }),
      });

      const j1 = await r1.json().catch(() => ({} as any));
      if (!r1.ok) throw new Error(j1?.error || 'Error preparando WhatsApp');

      // 1) Abrir Embedded Signup
      if (!SOLUTION_ID) {
        throw new Error('Falta NEXT_PUBLIC_TWILIO_PARTNER_SOLUTION_ID (solutionID).');
        }

        const opts: any = {
        config_id: CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        scope: 'whatsapp_business_management,whatsapp_business_messaging',
        auth_type: 'rerequest',
        };

        const extras: any = {
        sessionInfoVersion: 3,
        setup: {
            solutionID: SOLUTION_ID,
        },
        };

        // SOLO cuando el número es Twilio: salta pantallas de número/OTP
        if (numberType === 'twilio') {
        extras.featureType = 'only_waba_sharing';
        }

        opts.extras = extras;

        (window as any).FB.login(
        (response: any) => {
            console.log('[EmbeddedSignup] FB.login response:', response);
        },
        opts
        );

        } catch (e: any) {
        console.error('❌ WhatsApp connect start error:', e);
        alert(e?.message || 'Error iniciando Embedded Signup');
        setLoading(false);
        }
    };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 items-center text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="whatsapp-number-type"
            value="twilio"
            checked={numberType === 'twilio'}
            onChange={() => setNumberType('twilio')}
            disabled={disabled || loading}
          />
          <span>Usar número Twilio</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="whatsapp-number-type"
            value="personal"
            checked={numberType === 'personal'}
            onChange={() => setNumberType('personal')}
            disabled={disabled || loading}
          />
          <span>Usar mi número personal</span>
        </label>
      </div>

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
        {buttonLabel}
      </button>

      <p className="text-xs opacity-70 leading-relaxed">
        {numberType === 'twilio'
          ? 'Twilio: el popup no pedirá número/OTP. Tu sistema registrará el sender por API usando tu número Twilio.'
          : 'Personal: el popup pedirá tu número y validación OTP en Meta. Luego tu sistema registrará el sender en Twilio por API con ese número.'}
      </p>
    </div>
  );
}
