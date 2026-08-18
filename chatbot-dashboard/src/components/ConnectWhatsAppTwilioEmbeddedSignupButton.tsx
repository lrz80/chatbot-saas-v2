'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BACKEND_URL } from '@/utils/api';
import { useI18n } from '../i18n/LanguageProvider';

type Props = {
  disabled?: boolean;
  onComplete?: () => void;
};

type EmbeddedSignupPrepareResponse = {
  ok: boolean;
  app_id: string;
  config_id: string;
  state: string;
  embedded_signup_version?: string;
  error?: string;
};

type EmbeddedSignupSessionData = {
  waba_id?: string;
  whatsapp_business_account_id?: string;
  wabaId?: string;

  business_id?: string;
  business_manager_id?: string;
  businessId?: string;

  phone_number_id?: string;
  whatsapp_phone_number_id?: string;
  phoneNumberId?: string;
};

export default function ConnectWhatsAppTwilioEmbeddedSignupButton({
  disabled,
  onComplete,
}: Props) {
  const { t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  const finishOnceRef = useRef(false);
  const oauthCodeRef = useRef<string | null>(null);
  const stateRef = useRef<string | null>(null);

  const buttonLabel = useMemo(() => {
    if (loading) {
      return t('waConnectTwilio.button.connecting');
    }

    return t('waConnectTwilio.button.connect');
  }, [loading, t]);

  /**
   * 1) Cargar Facebook JavaScript SDK.
   */
  useEffect(() => {
    const initializeFacebookSdk = () => {
      const FB = (window as any).FB;

      if (!FB) {
        return;
      }

      FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID || '672113805196816',
        cookie: true,
        xfbml: false,
        version: 'v26.0',
      });

      setSdkReady(true);
    };

    if ((window as any).FB) {
      initializeFacebookSdk();
      return;
    }

    if (document.getElementById('facebook-jssdk')) {
      const existingInit = (window as any).fbAsyncInit;

      (window as any).fbAsyncInit = function () {
        if (typeof existingInit === 'function') {
          existingInit();
        }

        initializeFacebookSdk();
      };

      return;
    }

    (window as any).fbAsyncInit = function () {
      initializeFacebookSdk();
    };

    const js = document.createElement('script');

    js.id = 'facebook-jssdk';
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    js.async = true;
    js.defer = true;

    document.body.appendChild(js);
  }, []);

  /**
   * Finaliza el onboarding cuando ya tenemos:
   *
   * - OAuth code
   * - WABA ID
   * - Phone Number ID
   */
  const finalizeEmbeddedSignup = async (params: {
    code: string;
    state: string;
    wabaId: string;
    phoneNumberId: string;
    businessId?: string | null;
    raw?: unknown;
  }) => {
    if (finishOnceRef.current) {
      return;
    }

    finishOnceRef.current = true;

    try {
      /**
       * 1) Intercambiar el code por token Meta
       */
      const exchangeResponse = await fetch(
        `${BACKEND_URL}/api/meta/whatsapp/exchange-code`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: params.code,
            state: params.state,
          }),
        }
      );

      const exchangeJson = await exchangeResponse
        .json()
        .catch(() => ({} as any));

      if (!exchangeResponse.ok) {
        throw new Error(
          exchangeJson?.error ||
            'No se pudo autorizar WhatsApp con Meta.'
        );
      }

      /**
       * 2) Guardar WABA + Phone Number ID y suscribir webhook.
       */
      const completeResponse = await fetch(
        `${BACKEND_URL}/api/meta/whatsapp/onboard-complete`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            waba_id: params.wabaId,
            phone_number_id: params.phoneNumberId,
            business_id: params.businessId || null,
            raw: params.raw || null,
          }),
        }
      );

      const completeJson = await completeResponse
        .json()
        .catch(() => ({} as any));

      if (!completeResponse.ok) {
        throw new Error(
          completeJson?.error ||
            'No se pudo finalizar la conexión de WhatsApp.'
        );
      }

      alert(t('waConnectTwilio.alert.completeOk'));

      onComplete?.();
    } finally {
      setLoading(false);
      finishOnceRef.current = false;
      oauthCodeRef.current = null;
      stateRef.current = null;
    }
  };

  /**
   * 2) Capturar session info enviada por Meta Embedded Signup.
   */
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      const allowedOrigins = new Set([
        'https://www.facebook.com',
        'https://web.facebook.com',
        'https://business.facebook.com',
      ]);

      if (!allowedOrigins.has(event.origin)) {
        return;
      }

      let payload: any = event.data;

      try {
        if (typeof payload === 'string') {
          payload = JSON.parse(payload);
        }
      } catch {
        return;
      }

      const root = payload?.payload ?? payload;
      const metaData: EmbeddedSignupSessionData =
        root?.data ?? root;

      const eventType = String(
        root?.type ??
          payload?.type ??
          ''
      ).toLowerCase();

      const eventName = String(
        root?.event ??
          payload?.event ??
          ''
      ).toLowerCase();

      const isEmbeddedSignupEvent =
        eventType === 'wa_embedded_signup';

      const isFinishEvent =
        eventName === 'finish' ||
        eventName === 'complete' ||
        eventName === 'finish_only_waba' ||
        eventName === 'embedded_signup_finish' ||
        eventName === 'embedded_signup_complete' ||
        eventName.startsWith('finish');

      if (!isEmbeddedSignupEvent || !isFinishEvent) {
        return;
      }

      const wabaId =
        metaData?.waba_id ||
        metaData?.whatsapp_business_account_id ||
        metaData?.wabaId ||
        null;

      const phoneNumberId =
        metaData?.phone_number_id ||
        metaData?.whatsapp_phone_number_id ||
        metaData?.phoneNumberId ||
        null;

      const businessId =
        metaData?.business_id ||
        metaData?.business_manager_id ||
        metaData?.businessId ||
        null;

      console.log('[WA META ESU] FINISH:', {
        wabaId,
        phoneNumberId,
        businessId,
        raw: payload,
      });

      /**
       * En Cloud API necesitamos WABA + phone_number_id.
       */
      if (!wabaId || !phoneNumberId) {
        console.warn(
          '[WA META ESU] FINISH sin wabaId o phoneNumberId.',
          payload
        );

        setLoading(false);
        return;
      }

      const code = oauthCodeRef.current;
      const state = stateRef.current;

      /**
       * FB.login y postMessage pueden llegar en cualquier orden.
       * Si todavía no llegó OAuth code, esperamos.
       */
      if (!code || !state) {
        console.log(
          '[WA META ESU] Esperando OAuth code antes de finalizar.'
        );

        return;
      }

      try {
        await finalizeEmbeddedSignup({
          code,
          state,
          wabaId,
          phoneNumberId,
          businessId,
          raw: payload,
        });
      } catch (error: any) {
        console.error(
          '[WA META ESU] Error finalizando onboarding:',
          error
        );

        alert(
          error?.message ||
            t('waConnectTwilio.error.finalize')
        );

        setLoading(false);
        finishOnceRef.current = false;
      }
    };

    window.addEventListener('message', handler);

    return () => {
      window.removeEventListener('message', handler);
    };
  }, [onComplete, t]);

  /**
   * 3) Iniciar Embedded Signup.
   */
  const start = async () => {
    if (disabled || loading) {
      return;
    }

    const FB = (window as any).FB;

    if (!sdkReady || !FB) {
      alert(t('waConnectTwilio.alert.sdkNotReady'));
      return;
    }

    try {
      setLoading(true);

      finishOnceRef.current = false;
      oauthCodeRef.current = null;
      stateRef.current = null;

      /**
       * Backend devuelve app_id, config_id y state.
       *
       * Ya NO:
       * - crea subaccount Twilio
       * - compra número Twilio
       * - usa Partner Solution ID
       */
      const prepareResponse = await fetch(
        `${BACKEND_URL}/api/meta/whatsapp-onboard/start`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const prepareJson =
        (await prepareResponse
          .json()
          .catch(() => ({}))) as EmbeddedSignupPrepareResponse;

      if (!prepareResponse.ok) {
        throw new Error(
          prepareJson?.error ||
            t('waConnectTwilio.error.prepare')
        );
      }

      if (!prepareJson?.config_id) {
        throw new Error(
          'Meta Embedded Signup no devolvió config_id.'
        );
      }

      if (!prepareJson?.state) {
        throw new Error(
          'Meta Embedded Signup no devolvió state.'
        );
      }

      stateRef.current = prepareJson.state;

      const opts = {
        config_id: prepareJson.config_id,

        response_type: 'code',

        override_default_response_type: true,

        auth_type: 'rerequest',

        extras: {
          /**
           * Meta Coexistence:
           * permite conectar una cuenta/número que ya utiliza
           * WhatsApp Business App.
           */
          featureType: 'whatsapp_business_app_onboarding',

          sessionInfoVersion: 3,

          setup: {},
        },
      };

      console.log('[WA META ESU] Launch:', {
        appId: prepareJson.app_id,
        configId: prepareJson.config_id,
        embeddedSignupVersion:
          prepareJson.embedded_signup_version || null,
      });

      FB.login(
        async (response: any) => {
          console.log(
            '[WA META ESU] FB.login response:',
            response
          );

          const code =
            response?.authResponse?.code ||
            response?.code ||
            null;

          if (!code) {
            setLoading(false);

            if (
              response?.status &&
              response.status !== 'connected'
            ) {
              console.warn(
                '[WA META ESU] Usuario canceló o no autorizó Embedded Signup.'
              );
            }

            return;
          }

          oauthCodeRef.current = code;

          /**
           * IMPORTANTE:
           * normalmente session info llegará mediante postMessage.
           * Por eso aquí solo guardamos el code.
           */
        },
        opts
      );
    } catch (error: any) {
      console.error(
        '[WA META ESU] Error iniciando conexión:',
        error
      );

      alert(
        error?.message ||
          t('waConnectTwilio.error.start')
      );

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