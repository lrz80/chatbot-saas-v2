'use client';

import { useEffect, useMemo, useState } from 'react';

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

  const state = useMemo(() => {
    // Anti-CSRF + identificar tenant
    return `${tenantId || 'no-tenant'}::${Date.now()}`;
  }, [tenantId]);

  useEffect(() => {
    console.log("[WA BTN] useEffect init. appId:", appId);
    console.log("[WA BTN] appId:", appId);
    console.log("[WA BTN] redirectUri:", redirectUri);
    console.log("[WA BTN] tenantId:", tenantId);
    if (!appId) return;

    if (document.getElementById('facebook-jssdk')) {
      setSdkReady(true);
      return;
    }

    window.fbAsyncInit = function () {
        console.log("[WA BTN] fbAsyncInit fired");

        window.FB.init({
            appId,
            cookie: true,
            xfbml: false,
            version: "v18.0",
        });

        console.log("[WA BTN] FB.init OK. window.FB exists?", !!window.FB);
        setSdkReady(true);
        };

    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.async = true;
    js.defer = true;
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    document.body.appendChild(js);
  }, [appId]);

  const start = () => {
    console.log("[WA BTN] start() clicked", {
      disabled,
      sdkReady,
      hasFB: !!window.FB,
      tenantId,
      redirectUri,
    });

    if (disabled) return;
    if (!sdkReady || !window.FB) return;

    setLoading(true);
    setTimeout(() => {
      console.log("[WA BTN] 8s timeout. Still loading:", true);
      setLoading(false);
    }, 8000);

    console.log("[WA BTN] calling FB.login...");
    window.FB.login(
    (response: any) => {
        console.log("[WA BTN] FB.login response:", response);
        console.log("[WA BTN] response.status:", response?.status);
        console.log("[WA BTN] authResponse exists?:", !!response?.authResponse);
        console.log("[WA BTN] authResponse:", response?.authResponse);
        console.log("[WA BTN] grantedScopes:", response?.authResponse?.grantedScopes);

        setLoading(false);

        if (!response?.authResponse) return;

        // por ahora NO hacemos nada más hasta ver qué contiene authResponse
    },
    {
        scope:
        "whatsapp_business_management,whatsapp_business_messaging,business_management",
        return_scopes: true,
        auth_type: "rerequest",
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
