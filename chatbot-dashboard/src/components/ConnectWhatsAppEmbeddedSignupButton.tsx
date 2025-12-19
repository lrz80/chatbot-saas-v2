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
  const configId = process.env.NEXT_PUBLIC_WA_CONFIG_ID!;

  const state = useMemo(() => {
    return `${tenantId || 'no-tenant'}::${Date.now()}`;
  }, [tenantId]);

  useEffect(() => {
    if (!appId) return;

    if (document.getElementById('facebook-jssdk')) {
      setSdkReady(!!(window as any).FB);
      return;
    }

    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: 'v18.0',
      });
      setSdkReady(true);
    };

    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.async = true;
    js.defer = true;
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    document.body.appendChild(js);
  }, [appId]);

  const timeoutRef = useRef<number | null>(null);

  const start = () => {
    if (disabled) return;
    if (!tenantId) return;
    if (!sdkReady || !(window as any).FB) return;
    if (!configId) return;

    setLoading(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    timeoutRef.current = window.setTimeout(() => {
      setLoading(false);
      timeoutRef.current = null;
    }, 15000);

    (window as any).FB.login(
      (response: any) => {
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        // OJO: aquí NO hacemos exchange.
        // Meta te va a redirigir a redirectUri con ?code=...
        setLoading(false);
        console.log('[WA BTN] FB.login response:', response);
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        redirect_uri: redirectUri,
        state,

        // Forzar re-consent / reauth
        scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management',
        auth_type: 'rerequest',
        return_scopes: true,
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
