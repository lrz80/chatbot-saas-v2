//src/components/ConnectWhatsAppMetaEmbeddedSignupButton.tsx

'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { BACKEND_URL } from '@/utils/api';
import { useI18n } from '../i18n/LanguageProvider';

type Props = {
  disabled?: boolean;
  onComplete?: () => void;
};

type PrepareResponse = {
  ok?: boolean;
  app_id?: string;
  config_id?: string;
  state?: string;
  embedded_signup_version?: string;
  error?: string;
};

type SessionInfo = {
  wabaId: string;
  phoneNumberId: string;
  businessId: string | null;
  raw: unknown;
};

type ExchangeResponse = {
  ok?: boolean;
  error?: string;
};

type CompleteResponse = {
  ok?: boolean;
  error?: string;
};

const FALLBACK_META_APP_ID = '672113805196816';

export default function ConnectWhatsAppMetaEmbeddedSignupButton({
  disabled,
  onComplete,
}: Props) {
  const { t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  /**
   * Datos que pueden llegar en distinto orden:
   *
   * 1. FB.login -> OAuth code
   * 2. postMessage -> WABA + phone_number_id
   *
   * Guardamos ambos hasta tener todo.
   */
  const oauthCodeRef = useRef<string | null>(null);
  const stateRef = useRef<string | null>(null);
  const sessionInfoRef = useRef<SessionInfo | null>(null);

  /**
   * Evita completar dos veces si Meta dispara
   * varios eventos FINISH.
   */
  const finalizingRef = useRef(false);

  const buttonLabel = useMemo(() => {
    if (loading) {
      return t('waConnectTwilio.button.connecting');
    }

    return t('waConnectTwilio.button.connect');
  }, [loading, t]);

  /**
   * Limpia solamente el estado temporal del onboarding.
   */
  const resetFlow = useCallback(() => {
    oauthCodeRef.current = null;
    stateRef.current = null;
    sessionInfoRef.current = null;
    finalizingRef.current = false;
  }, []);

  /**
   * Completar onboarding solamente cuando tenemos:
   *
   * - OAuth code
   * - state firmado por backend
   * - WABA ID
   * - Phone Number ID
   */
  const tryFinalize = useCallback(async () => {
    const code = oauthCodeRef.current;
    const state = stateRef.current;
    const session = sessionInfoRef.current;

    if (!code || !state || !session) {
      console.log('[WA META ESU] Esperando datos:', {
        hasCode: Boolean(code),
        hasState: Boolean(state),
        hasSession: Boolean(session),
      });

      return;
    }

    if (finalizingRef.current) {
      return;
    }

    finalizingRef.current = true;

    try {
      console.log('[WA META ESU] Finalizando onboarding:', {
        wabaId: session.wabaId,
        phoneNumberId: session.phoneNumberId,
        businessId: session.businessId,
      });

      /**
       * PASO 1
       * Intercambiar OAuth code por access token.
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
            code,
            state,
          }),
        }
      );

      const exchangeJson =
        (await exchangeResponse
          .json()
          .catch(() => ({}))) as ExchangeResponse;

      if (!exchangeResponse.ok || exchangeJson?.ok === false) {
        throw new Error(
          exchangeJson?.error ||
            'No se pudo autorizar WhatsApp con Meta.'
        );
      }

      /**
       * PASO 2
       * Guardar WABA + phone_number_id y terminar conexión.
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
            waba_id: session.wabaId,
            phone_number_id: session.phoneNumberId,
            business_id: session.businessId,
          }),
        }
      );

      const completeJson =
        (await completeResponse
          .json()
          .catch(() => ({}))) as CompleteResponse;

      if (!completeResponse.ok || completeJson?.ok === false) {
        throw new Error(
          completeJson?.error ||
            'No se pudo finalizar la conexión de WhatsApp.'
        );
      }

      console.log(
        '[WA META ESU] WhatsApp conectado correctamente.'
      );

      alert(t('waConnectTwilio.alert.completeOk'));

      resetFlow();
      setLoading(false);

      onComplete?.();
    } catch (error: any) {
      console.error(
        '[WA META ESU] Error finalizando onboarding:',
        error
      );

      alert(
        error?.message ||
          t('waConnectTwilio.error.finalize')
      );

      resetFlow();
      setLoading(false);
    }
  }, [onComplete, resetFlow, t]);

  /**
   * 1. Cargar Facebook JavaScript SDK.
   */
  useEffect(() => {
    let mounted = true;

    const initFacebookSdk = () => {
      if (!mounted) {
        return;
      }

      const FB = (window as any).FB;

      if (!FB) {
        return;
      }

      const appId =
        process.env.NEXT_PUBLIC_META_APP_ID ||
        FALLBACK_META_APP_ID;

      FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: 'v26.0',
      });

      setSdkReady(true);
    };

    if ((window as any).FB) {
      initFacebookSdk();

      return () => {
        mounted = false;
      };
    }

    const existingScript =
      document.getElementById('facebook-jssdk');

    if (existingScript) {
      const previousInit = (window as any).fbAsyncInit;

      (window as any).fbAsyncInit = () => {
        if (typeof previousInit === 'function') {
          previousInit();
        }

        initFacebookSdk();
      };

      return () => {
        mounted = false;
      };
    }

    (window as any).fbAsyncInit = () => {
      initFacebookSdk();
    };

    const script = document.createElement('script');

    script.id = 'facebook-jssdk';
    script.src =
      'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;

    document.body.appendChild(script);

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * 2. Escuchar sessionInfo del Embedded Signup.
   */
  useEffect(() => {
    const allowedOrigins = new Set([
      'https://www.facebook.com',
      'https://web.facebook.com',
      'https://business.facebook.com',
    ]);

    const handler = async (event: MessageEvent) => {
      if (!allowedOrigins.has(event.origin)) {
        return;
      }

      let payload: any = event.data;

      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }

      if (!payload || typeof payload !== 'object') {
        return;
      }

      const root = payload?.payload ?? payload;
      const data = root?.data ?? root;

      const eventType = String(
        root?.type ??
          payload?.type ??
          data?.type ??
          ''
      ).toLowerCase();

      const eventName = String(
        root?.event ??
          payload?.event ??
          data?.event ??
          ''
      ).toLowerCase();

      if (eventType !== 'wa_embedded_signup') {
        return;
      }

      /**
       * Los nombres pueden variar según el flujo/version.
       * No usamos regex: manejamos explícitamente
       * las variantes conocidas.
       */
      const finishEvents = new Set([
        'finish',
        'complete',
        'finish_only_waba',
        'embedded_signup_finish',
        'embedded_signup_complete',
      ]);

      const isFinish =
        finishEvents.has(eventName) ||
        eventName.startsWith('finish');

      if (!isFinish) {
        /**
         * Útil para diagnosticar cancelaciones o eventos
         * sin tratarlos como conexión completada.
         */
        console.log('[WA META ESU] Evento:', {
          eventType,
          eventName,
        });

        return;
      }

      const wabaId = String(
        data?.waba_id ??
          data?.whatsapp_business_account_id ??
          data?.wabaId ??
          ''
      ).trim();

      const phoneNumberId = String(
        data?.phone_number_id ??
          data?.whatsapp_phone_number_id ??
          data?.phoneNumberId ??
          ''
      ).trim();

      const businessIdRaw =
        data?.business_id ??
        data?.business_manager_id ??
        data?.businessId ??
        null;

      const businessId = businessIdRaw
        ? String(businessIdRaw).trim()
        : null;

      console.log('[WA META ESU] FINISH recibido:', {
        wabaId,
        phoneNumberId,
        businessId,
      });

      if (!wabaId) {
        console.error(
          '[WA META ESU] FINISH recibido sin WABA ID.',
          payload
        );

        resetFlow();
        setLoading(false);
        return;
      }

      if (!phoneNumberId) {
        console.error(
          '[WA META ESU] FINISH recibido sin phone_number_id.',
          payload
        );

        resetFlow();
        setLoading(false);
        return;
      }

      /**
       * Guardamos sessionInfo aunque todavía no haya
       * llegado el code de FB.login.
       */
      sessionInfoRef.current = {
        wabaId,
        phoneNumberId,
        businessId,
        raw: payload,
      };

      /**
       * Si el code ya llegó, esto termina.
       * Si no llegó, simplemente espera.
       */
      await tryFinalize();
    };

    window.addEventListener('message', handler);

    return () => {
      window.removeEventListener('message', handler);
    };
  }, [resetFlow, tryFinalize]);

  /**
   * 3. Iniciar Embedded Signup.
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

    resetFlow();
    setLoading(true);

    try {
      /**
       * El backend entrega el config_id correcto
       * para este ambiente/tenant.
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
          .catch(() => ({}))) as PrepareResponse;

      if (!prepareResponse.ok) {
        throw new Error(
          prepareJson?.error ||
            t('waConnectTwilio.error.prepare')
        );
      }

      const configId =
        typeof prepareJson?.config_id === 'string'
          ? prepareJson.config_id.trim()
          : '';

      const state =
        typeof prepareJson?.state === 'string'
          ? prepareJson.state.trim()
          : '';

      if (!configId) {
        throw new Error(
          'El backend no devolvió config_id de Meta Embedded Signup.'
        );
      }

      if (!state) {
        throw new Error(
          'El backend no devolvió state de Meta Embedded Signup.'
        );
      }

      stateRef.current = state;

      const options = {
        config_id: configId,

        response_type: 'code',

        override_default_response_type: true,

        auth_type: 'rerequest',

        extras: {
          sessionInfoVersion: 3,

          /**
           * Flujo para números que ya existen
           * en WhatsApp Business App.
           */
          featureType:
            'whatsapp_business_app_onboarding',
        },
      };

      console.log('[WA META ESU] Abriendo Embedded Signup:', {
        configId,
        embeddedSignupVersion:
          prepareJson?.embedded_signup_version ?? null,
      });

      console.log(
        '[WA META ESU] OPTIONS COMPLETAS:',
        JSON.stringify(options, null, 2)
      );

      FB.login(
        (response: any) => {
          console.log(
            '[WA META ESU] FB.login response:',
            response
          );

          const code = String(
            response?.authResponse?.code ??
              response?.code ??
              ''
          ).trim();

          if (!code) {
            console.warn(
              '[WA META ESU] Embedded Signup cancelado o sin OAuth code.',
              {
                status: response?.status ?? null,
              }
            );

            resetFlow();
            setLoading(false);
            return;
          }

          oauthCodeRef.current = code;

          void tryFinalize();
        },
        options
      );
    } catch (error: any) {
      console.error(
        '[WA META ESU] Error iniciando Embedded Signup:',
        error
      );

      alert(
        error?.message ||
          t('waConnectTwilio.error.start')
      );

      resetFlow();
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