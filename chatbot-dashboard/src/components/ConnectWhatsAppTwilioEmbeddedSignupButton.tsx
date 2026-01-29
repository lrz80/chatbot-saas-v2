'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { BACKEND_URL } from '@/utils/api';
import { useI18n } from '../i18n/LanguageProvider';

type Props = {
  disabled?: boolean;
  onComplete?: () => void;
};

const META_APP_ID = '672113805196816';
const CONFIG_ID = '859575230051675';
const SOLUTION_ID = process.env.NEXT_PUBLIC_TWILIO_PARTNER_SOLUTION_ID;

export default function ConnectWhatsAppTwilioEmbeddedSignupButton({
  disabled,
  onComplete,
}: Props) {
  const { t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const finishOnceRef = useRef(false);

  const buttonLabel = useMemo(() => {
    if (loading) return t('waConnectTwilio.button.connecting');
    return t('waConnectTwilio.button.connect');
  }, [loading, t]);

  // 1) Load FB SDK
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

  // 2) Capture postMessage from Embedded Signup
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
        // can arrive as object, ignore JSON parsing errors
      }

      const root = payload?.payload ?? payload;
      const metaData = root?.data ?? root;

      const rawType = root?.type ?? payload?.type ?? metaData?.type;
      const rawEvent = root?.event ?? payload?.event ?? metaData?.event;

      const eventType = String(rawType || '').toLowerCase();
      const eventName = String(rawEvent || '').toLowerCase();

      const isFinish =
        eventType === 'wa_embedded_signup' &&
        (eventName === 'finish' ||
          eventName === 'complete' ||
          eventName === 'finish_only_waba' ||
          eventName === 'embedded_signup_finish' ||
          eventName === 'embedded_signup_complete' ||
          eventName.startsWith('finish'));

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

      console.log('✅ [WA ESU] postMessage:', {
        eventType,
        eventName,
        wabaId,
        businessId,
        phoneNumberId,
        raw: payload,
      });

      if (!isFinish) return;

      // If finish came but IDs missing, release UI (avoid stuck state)
      if (!wabaId || !businessId) {
        console.warn('⚠️ FINISH received but missing IDs. Releasing UI.');
        setLoading(false);
        finishOnceRef.current = false;
        return;
      }

      if (finishOnceRef.current) return;
      finishOnceRef.current = true;

      try {
        setLoading(true);

        const r = await fetch(
          `${BACKEND_URL}/api/twilio/whatsapp/embedded-signup/complete`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              waba_id: wabaId,
              business_id: businessId,
              phone_number_id: phoneNumberId || null,
              raw: payload,
            }),
          }
        );

        const j = await r.json().catch(() => ({} as any));
        if (!r.ok) throw new Error(j?.error || t('waConnectTwilio.error.complete'));

        alert(t('waConnectTwilio.alert.completeOk'));
        onComplete?.();
      } catch (e: any) {
        console.error('❌ ESU complete error:', e);
        alert(e?.message || t('waConnectTwilio.error.finalize'));
      } finally {
        setLoading(false);
        finishOnceRef.current = false;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onComplete, t]);

  const start = async () => {
    if (disabled || loading) return;

    if (!sdkReady || !(window as any).FB) {
      alert(t('waConnectTwilio.alert.sdkNotReady'));
      return;
    }

    if (!SOLUTION_ID) {
      alert(t('waConnectTwilio.alert.missingSolutionId'));
      return;
    }

    try {
      setLoading(true);

      // 0) Prepare backend: subaccount + Twilio number (Twilio-only)
      const r1 = await fetch(`${BACKEND_URL}/api/twilio/whatsapp/start-embedded-signup`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_number_type: 'twilio' }),
      });

      const j1 = await r1.json().catch(() => ({} as any));
      if (!r1.ok) throw new Error(j1?.error || t('waConnectTwilio.error.prepare'));

      // 1) Open Embedded Signup (ESU)
      const opts: any = {
        config_id: CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        auth_type: 'rerequest',
        scope: 'whatsapp_business_management,whatsapp_business_messaging',
        extras: {
          sessionInfoVersion: 3,
          featureType: 'only_waba_sharing',
          setup: {
            solutionID: SOLUTION_ID,
          },
        },
      };

      console.log('=== WA ESU PARAMS CHECK ===', {
        featureType: opts?.extras?.featureType,
        solutionID: opts?.extras?.setup?.solutionID,
      });

      (window as any).FB.login(
        (response: any) => {
          console.log('[ESU] FB.login response:', response);
          // if cancelled / not authorized, release button
          if (!response || response.status !== 'connected') {
            setLoading(false);
          }
        },
        opts
      );
    } catch (e: any) {
      console.error('❌ WhatsApp connect start error:', e);
      alert(e?.message || t('waConnectTwilio.error.start'));
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
        {t('waConnectTwilio.helper')}
      </p>
    </div>
  );
}
