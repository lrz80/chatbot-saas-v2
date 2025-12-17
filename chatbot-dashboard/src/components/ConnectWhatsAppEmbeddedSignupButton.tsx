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

  const state = useMemo(() => {
    // Anti-CSRF + identificar tenant
    return `${tenantId || 'no-tenant'}::${Date.now()}`;
  }, [tenantId]);

  // ✅ Embedded Signup: NO dependas de accessToken aquí.
  // Meta te redirige al redirectUri con ?code=...
  const handleFBLogin = (response: any) => {
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

    // En Embedded Signup, lo normal es que Meta redirija automáticamente al redirectUri.
    console.log('[WA BTN] Embedded Signup iniciado. Esperando redirect a:', redirectUri);
    setLoading(false);
  };

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

  const timeoutRef = useRef<number | null>(null);

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

    timeoutRef.current = window.setTimeout(() => {
      console.log('[WA BTN] 12s timeout. Forcing loading=false');
      setLoading(false);
      timeoutRef.current = null;
    }, 12000);

    console.log('[WA BTN] calling FB.login with Embedded Signup config_id:', configId);

    (window as any).FB.login(
      (response: any) => {
        // si llegó respuesta, cancelamos el timeout
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        handleFBLogin(response);
      },
      {
        // ✅ Esto activa el Embedded Signup Wizard (Add / Select number)
        config_id: configId,

        // ✅ fuerza code flow (lo vas a recibir en redirectUri como ?code=...)
        response_type: 'code',
        override_default_response_type: true,

        redirect_uri: redirectUri,
        state,

        // scopes mínimos para WA
        scope: 'whatsapp_business_management,whatsapp_business_messaging',
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
