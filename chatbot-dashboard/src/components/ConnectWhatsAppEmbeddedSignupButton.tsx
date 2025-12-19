'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export default function ConnectWhatsAppEmbeddedSignupButton({
  tenantId,
  disabled,
}: {
  tenantId?: string;
  disabled?: boolean;
}) {
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const appId = process.env.NEXT_PUBLIC_META_APP_ID!;
  const redirectUri = process.env.NEXT_PUBLIC_WA_REDIRECT_URI!;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const configId = process.env.NEXT_PUBLIC_WA_CONFIG_ID!;

  const timeoutRef = useRef<number | null>(null);

  const state = useMemo(() => {
    // Anti-CSRF + identificar tenant
    return `${tenantId || 'no-tenant'}::${Date.now()}`;
  }, [tenantId]);

  const exchangeCode = async (code: string) => {
    try {
      console.log('[WA BTN] Exchanging code with backend...', { tenantId });

      const res = await fetch(`${apiBaseUrl}/api/meta/whatsapp/exchange-code`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          // backend usa req.user, pero lo mandamos por compatibilidad/trace
          tenantId,
          // puedes mandarlo, aunque tu backend actual NO lo valida para el exchange
          redirectUri,
          state,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('[WA BTN] exchange-code failed', res.status, data);
        throw new Error(data?.error || `exchange-code failed (${res.status})`);
      }

      if (!data?.ok) {
        console.error('[WA BTN] exchange-code returned ok=false', data);
        throw new Error(data?.error || 'exchange-code ok=false');
      }

      console.log('[WA BTN] exchange-code OK:', data);
      return data;
    } catch (err) {
      console.error('[WA BTN] exchangeCode error:', err);
      throw err;
    }
  };

  // 1) Listener: recibe code desde /meta/whatsapp-redirect por postMessage
  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      const data: any = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'WA_EMBEDDED_SIGNUP_CODE' && data.code) {
        console.log('[WA BTN] Received code from redirect page:', {
          hasCode: true,
          state: data.state,
        });

        // limpia timeout si estaba corriendo
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        try {
          setLoading(true);
          await exchangeCode(String(data.code));
          window.location.reload();
        } catch (e) {
          console.error('[WA BTN] exchange-code failed after redirect:', e);
          setLoading(false);
        }
      }

      if (data.type === 'WA_EMBEDDED_SIGNUP_ERROR') {
        console.error('[WA BTN] Embedded Signup error:', data);

        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setLoading(false);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, apiBaseUrl, redirectUri, state]);

  // 2) Cargar FB SDK
  useEffect(() => {
    console.log('[WA BTN] useEffect init. appId:', appId);
    console.log('[WA BTN] redirectUri:', redirectUri);
    console.log('[WA BTN] tenantId:', tenantId);
    console.log('[WA BTN] apiBaseUrl:', apiBaseUrl);
    console.log('[WA BTN] configId:', configId);

    if (!appId) return;

    // Si ya existe el script, asumimos listo
    if (document.getElementById('facebook-jssdk')) {
      setSdkReady(!!(window as any).FB);
      return;
    }

    (window as any).fbAsyncInit = function () {
      console.log('[WA BTN] fbAsyncInit fired');

      (window as any).FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: 'v18.0',
      });

      console.log('[WA BTN] FB.init OK. window.FB exists?', !!(window as any).FB);
      setSdkReady(true);
    };

    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.async = true;
    js.defer = true;
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    document.body.appendChild(js);
  }, [appId, redirectUri, tenantId, apiBaseUrl, configId]);

  const handleFBLogin = async (response: any) => {
    console.log('[WA BTN] FB.login response:', response);
    console.log('[WA BTN] response.status:', response?.status);
    console.log('[WA BTN] authResponse exists?:', !!response?.authResponse);
    console.log('[WA BTN] authResponse:', response?.authResponse);
    console.log('[WA BTN] grantedScopes:', response?.authResponse?.grantedScopes);

    // Si el usuario cancela, no llega authResponse
    if (!response?.authResponse) {
      console.warn('[WA BTN] Usuario canceló o no hubo authResponse');
      setLoading(false);
      return;
    }

    // Caso A: Meta devuelve code aquí
    const code = response?.authResponse?.code;
    if (code) {
      try {
        setLoading(true);
        await exchangeCode(String(code));
        window.location.reload();
      } catch (e) {
        console.error('[WA BTN] Error finalizando conexión:', e);
        setLoading(false);
      }
      return;
    }

    // Caso B: Meta no devuelve code en callback. Debe llegar por redirectUri -> postMessage.
    console.log('[WA BTN] No llegó authResponse.code. Esperando code via redirectUri/postMessage...');
    // NO pongas loading=false aquí, porque la ventana de redirect puede llegar en segundos.
    // Deja que el timeout o el postMessage lo resuelva.
  };

  const start = () => {
    console.log('[WA BTN] start() clicked', {
      disabled,
      sdkReady,
      hasFB: !!(window as any).FB,
      tenantId,
      redirectUri,
      apiBaseUrl,
      configId,
    });

    if (disabled) return;
    if (!tenantId) {
      console.error('[WA BTN] Falta tenantId');
      return;
    }
    if (!sdkReady || !(window as any).FB) {
      console.error('[WA BTN] FB SDK no listo');
      return;
    }
    if (!configId) {
      console.error('[WA BTN] Falta NEXT_PUBLIC_WA_CONFIG_ID');
      return;
    }

    setLoading(true);

    // Limpia cualquier timeout previo
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Timeout “suave” (solo para UI)
    timeoutRef.current = window.setTimeout(() => {
      console.log('[WA BTN] 20s timeout. Forcing loading=false');
      setLoading(false);
      timeoutRef.current = null;
    }, 20000);

    console.log('[WA BTN] calling FB.login with Embedded Signup config_id:', configId);
    console.log('[WA BTN] FINAL redirect_uri sent to Meta:', redirectUri);

    (window as any).FB.login(
      (response: any) => {
        // si llegó respuesta, cancelamos timeout solo si hay un resultado final.
        // OJO: si Meta no trae code aquí, el “final” llega por postMessage.
        handleFBLogin(response);
      },
      {
        // Embedded Signup Wizard
        config_id: configId,

        // fuerza code flow
        response_type: 'code',
        override_default_response_type: true,

        redirect_uri: redirectUri,
        state,

        // scopes WA
        scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management',
        return_scopes: true,
        auth_type: 'rerequest',
      }
    );
  };

  const isDisabled = disabled || !sdkReady || loading || !tenantId;

  return (
    <button
      type="button"
      onClick={start}
      disabled={isDisabled}
      className={`px-4 py-2 rounded-lg font-semibold border border-white/20 ${
        isDisabled ? 'bg-white/10 text-white/50' : 'bg-green-600 hover:bg-green-700 text-white'
      }`}
      title={!tenantId ? 'No hay tenant_id cargado' : undefined}
    >
      {loading ? 'Abriendo Meta...' : 'Conectar WhatsApp (Cloud API)'}
    </button>
  );
}
