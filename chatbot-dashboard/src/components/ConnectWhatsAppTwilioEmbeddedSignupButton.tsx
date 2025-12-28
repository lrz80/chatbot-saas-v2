'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { BACKEND_URL } from '@/utils/api';

type Props = {
  disabled?: boolean;
  onComplete?: () => void;
};

const META_APP_ID = '672113805196816';
const CONFIG_ID = '632870913208512';
const SOLUTION_ID = process.env.NEXT_PUBLIC_TWILIO_PARTNER_SOLUTION_ID;

export default function ConnectWhatsAppTwilioEmbeddedSignupButton({
  disabled,
  onComplete,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const finishOnceRef = useRef(false);

  const buttonLabel = useMemo(() => {
    if (loading) return 'Conectando…';
    return 'Conectar WhatsApp (Twilio)';
  }, [loading]);

  // 1) Cargar FB SDK
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

  // 2) Capturar postMessage del Embedded Signup
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      const allowedOrigins = [
        'https://www.facebook.com',
        'https://web.facebook.com',
        'https://business.facebook.com',
      ];

      if (!allowedOrigins.includes(event.origin)) return;

      let payload: any = event.data;
      try {
        if (typeof payload === 'string') payload = JSON.parse(payload);
      } catch {
        // si no es JSON, igual puede venir como object
      }

      // Meta suele envolver en { payload: { ... } } y/o { data: { ... } }
      const root = payload?.payload ?? payload;
      const metaData = root?.data ?? root;

      // Intentar identificar evento final
      const eventType = String(root?.type || metaData?.type || '').toLowerCase();
      const eventName = String(root?.event || metaData?.event || '').toLowerCase();

      // Solo dispara cuando ESU termina.
      // En distintos builds, Meta manda valores diferentes; estos cubren lo típico.
      const isFinish =
        eventType === 'finish' ||
        eventType === 'complete' ||
        eventName === 'finish' ||
        eventName === 'complete' ||
        eventName === 'embedded_signup_finish' ||
        eventName === 'embedded_signup_complete';

      const wabaId =
        metaData?.waba_id ||
        metaData?.whatsapp_business_account_id ||
        metaData?.wabaId;

      const businessId =
        metaData?.business_id ||
        metaData?.business_manager_id ||
        metaData?.businessId;

      const phoneNumberId =
        metaData?.phone_number_id ||
        metaData?.whatsapp_phone_number_id ||
        metaData?.phoneNumberId;

      // Debug útil
      console.log('✅ [WA ESU] postMessage:', {
        eventType,
        eventName,
        wabaId,
        businessId,
        phoneNumberId,
        raw: payload,
      });

      // Si no es fin, no hagas nada (evita dobles llamadas)
      if (!isFinish) return;

      if (finishOnceRef.current) return;
      finishOnceRef.current = true;

      // En el fin deben existir al menos waba_id (lo exigimos en backend)
      if (!wabaId || !businessId) return;

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
            raw: payload,
          }),
        });

        const j = await r.json().catch(() => ({} as any));
        if (!r.ok) throw new Error(j?.error || 'Error completando Embedded Signup');

        alert('⏳ Embedded Signup OK. El sender se está registrando. Revisa Sync en 1-3 minutos.');
        onComplete?.();
      } catch (e: any) {
        console.error('❌ ESU complete error:', e);
        alert(e?.message || 'Error finalizando conexión');
      } finally {
        setLoading(false);
        finishOnceRef.current = false;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onComplete]);

  const start = async () => {
    if (disabled || loading) return;

    if (!sdkReady || !(window as any).FB) {
      alert('FB SDK no está listo todavía.');
      return;
    }

    if (!SOLUTION_ID) {
      alert('Falta NEXT_PUBLIC_TWILIO_PARTNER_SOLUTION_ID (solutionID).');
      return;
    }

    setLoading(true);
    try {
      // 0) Preparar backend: subcuenta + número Twilio (Twilio-only)
      const r1 = await fetch(`${BACKEND_URL}/api/twilio/whatsapp/start-embedded-signup`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_number_type: 'twilio',
        }),
      });

      const j1 = await r1.json().catch(() => ({} as any));
      if (!r1.ok) throw new Error(j1?.error || 'Error preparando WhatsApp');

      // 1) Abrir Embedded Signup (ESU)
      const opts: any = {
        config_id: CONFIG_ID,

        // ✅ CLAVE: fuerza Authorization Code Flow (evita response_type=token)
        override_default_response_type: true,
        response_type: 'code',

        auth_type: 'rerequest',
        scope: 'whatsapp_business_management,whatsapp_business_messaging',
        extras: {
          sessionInfoVersion: 3,

          // ✅ NO fuerces "only_waba_sharing" (eso dispara Cloud API / WABA sharing)
          // featureType: 'only_waba_sharing',

          setup: {
              // ✅ clave correcta que Meta/Twilio esperan:
              solution_id: SOLUTION_ID,
          },
        },
      };

      console.log('=== WA ESU DEBUG (Twilio-only) ===', {
        CONFIG_ID,
        SOLUTION_ID,
        opts,
      });

      console.log("=== WA ESU PARAMS CHECK ===", {
        has_only_waba_sharing: opts?.extras?.featureType,
        setup_keys: Object.keys(opts?.extras?.setup || {}),
        setup: opts?.extras?.setup,
      });

      (window as any).FB.login(
        (response: any) => {
          console.log('[ESU] FB.login response:', response);
          // ✅ si canceló o no autorizó, libera el botón
          if (!response || response.status !== 'connected') {
            setLoading(false);
          }
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
        Twilio-only: tu sistema asigna un número Twilio en la subcuenta y registra el sender por API.
        El popup no debe pedir número/OTP.
      </p>
    </div>
  );
}
