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

  const state = useMemo(() => {
    // Anti-CSRF + identificar tenant
    return `${tenantId || 'no-tenant'}::${Date.now()}`;
  }, [tenantId]);

  // ✅ Handler ASYNC separado (FB.login NO acepta callbacks async)
  const handleFBLogin = async (response: any) => {
    console.log('[WA BTN] FB.login response:', response);
    console.log('[WA BTN] response.status:', response?.status);
    console.log('[WA BTN] authResponse exists?:', !!response?.authResponse);
    console.log('[WA BTN] authResponse:', response?.authResponse);
    console.log('[WA BTN] grantedScopes:', response?.authResponse?.grantedScopes);

    setLoading(false);

    if (!response?.authResponse?.accessToken) {
      console.error('[WA BTN] No accessToken recibido');
      return;
    }

    const accessToken = response.authResponse.accessToken;

    console.log('[WA BTN] Guardando accessToken en backend...');
    console.log('[WA BTN] apiBaseUrl:', apiBaseUrl);
    console.log('[WA BTN] save-token URL:', `${apiBaseUrl}/api/meta/whatsapp/save-token`);
    console.log('[WA BTN] token length:', accessToken.length);

    try {
      const res = await fetch(`${apiBaseUrl}/api/meta/whatsapp/save-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsapp_access_token: accessToken,
        }),
      });

      console.log('[WA BTN] save-token HTTP status:', res.status);

      const data = await res.json();
      console.log('[WA BTN] save-token response JSON:', data);

      if (!res.ok || !data?.ok) {
        console.error('[WA BTN] Error guardando token');
        return;
      }

      console.log('[WA BTN] ✅ Token guardado correctamente');
      console.log('[WA BTN] Resolviendo WABA...');
        const r = await fetch(`${apiBaseUrl}/api/meta/whatsapp/resolve-waba`, {
        method: 'GET',
        credentials: 'include',
        });

        const rData = await r.json();
        console.log('[WA BTN] resolve-waba response:', r.status, rData);


    } catch (err) {
      console.error('[WA BTN] ❌ Error llamando save-token:', err);
    }
  };

  useEffect(() => {
    console.log('[WA BTN] useEffect init. appId:', appId);
    console.log('[WA BTN] redirectUri:', redirectUri);
    console.log('[WA BTN] tenantId:', tenantId);
    console.log('[WA BTN] apiBaseUrl:', apiBaseUrl);

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
  }, [appId, redirectUri, tenantId, apiBaseUrl]);

const timeoutRef = useRef<number | null>(null);

const start = () => {
  console.log('[WA BTN] start() clicked', {
    disabled,
    sdkReady,
    hasFB: !!(window as any).FB,
    tenantId,
    redirectUri,
    apiBaseUrl,
  });

  if (disabled) return;
  if (!sdkReady || !(window as any).FB) return;

  setLoading(true);

  // Limpia cualquier timeout previo
  if (timeoutRef.current) {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  timeoutRef.current = window.setTimeout(() => {
    console.log('[WA BTN] 8s timeout. Forcing loading=false');
    setLoading(false);
    timeoutRef.current = null;
  }, 8000);

  console.log('[WA BTN] calling FB.login...');

  // Callback SYNC (no async)
  (window as any).FB.login(
    (response: any) => {
      // si llegó respuesta, cancelamos el timeout
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      handleFBLogin(response); // aquí adentro puedes hacer async sin problema
    },
    {
      scope:
        'whatsapp_business_management,whatsapp_business_messaging,business_management',
      return_scopes: true,
      auth_type: 'rerequest',
      redirect_uri: redirectUri,
      state,
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
