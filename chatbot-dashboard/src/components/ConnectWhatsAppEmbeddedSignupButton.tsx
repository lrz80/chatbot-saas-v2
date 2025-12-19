'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

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
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const state = useMemo(() => {
    return `${tenantId || 'no-tenant'}::${Date.now()}`;
  }, [tenantId]);

  // 1) Listener del FINISH (aquí Meta entrega waba_id y phone_number_id)
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      const allowedOrigins = ['https://www.facebook.com', 'https://web.facebook.com'];
      if (!allowedOrigins.includes(event.origin)) return;

      const payload: any = event.data;
      console.log('📩 [WA EMBEDDED] postMessage recibido:', payload);

      const type = payload?.type || payload?.data?.type;
      const evt = payload?.event || payload?.data?.event;

      // Normalizamos la parte “data”
      const data = payload?.data?.data || payload?.data || payload;

      if (type !== 'WA_EMBEDDED_SIGNUP') return;

      if (evt === 'FINISH') {
        const wabaId = data?.waba_id || data?.wabaId;
        const phoneNumberId = data?.phone_number_id || data?.phoneNumberId;

        console.log('✅ [WA EMBEDDED] FINISH:', { wabaId, phoneNumberId });

        if (!wabaId || !phoneNumberId) {
          console.error('❌ [WA EMBEDDED] FINISH sin IDs:', data);
          return;
        }

        try {
          const res = await fetch(`${apiBaseUrl}/api/meta/whatsapp/onboard-complete`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wabaId, phoneNumberId }),
          });

          const json = await res.json().catch(() => null);
          console.log('💾 [WA EMBEDDED] onboard-complete:', res.status, json);

          if (!res.ok || !json?.ok) {
            throw new Error(json?.error || `onboard-complete failed (${res.status})`);
          }

          // Refresca UI (ya tendrás whatsapp_business_id guardado)
          window.location.reload();
        } catch (err) {
          console.error('❌ [WA EMBEDDED] Error guardando IDs:', err);
        }
      }

      if (evt === 'CANCEL') console.warn('⚠️ [WA EMBEDDED] Usuario canceló.');
      if (evt === 'ERROR') console.error('❌ [WA EMBEDDED] ERROR:', data);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [apiBaseUrl]);

  // 2) Cargar SDK
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
      console.log('[WA BTN] FB SDK listo');
    };

    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.async = true;
    js.defer = true;
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    document.body.appendChild(js);
  }, [appId]);

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      // ✅ seguridad: solo aceptar orígenes de Meta
      const okOrigin =
        event.origin.includes("facebook.com") ||
        event.origin.includes("meta.com");

      if (!okOrigin) return;

      const raw = event.data;
      const payload = typeof raw === "string" ? safeJson(raw) : raw;

      if (payload?.type !== "WA_EMBEDDED_SIGNUP") return;
      if (payload?.event !== "FINISH") return;

      const wabaId = payload?.data?.waba_id;
      const phoneNumberId = payload?.data?.phone_number_id;

      console.log("[WA EMBEDDED] FINISH ->", { wabaId, phoneNumberId, payload });

      if (!wabaId || !phoneNumberId) return;

      try {
        const res = await fetch(`${apiBaseUrl}/api/meta/whatsapp/onboard-complete`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wabaId, phoneNumberId }),
        });

        const data = await res.json().catch(() => null);
        console.log("[WA EMBEDDED] onboard-complete:", res.status, data);

        if (res.ok && data?.ok) {
          window.location.reload();
        }
      } catch (e) {
        console.error("[WA EMBEDDED] onboard-complete error:", e);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [apiBaseUrl]);

  // 3) Exchange del code (para guardar token y poder consultar Graph)
  const exchangeCode = async (code: string) => {
    const res = await fetch(`${apiBaseUrl}/api/meta/whatsapp/exchange-code`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri, state }),
    });

    const json = await res.json().catch(() => null);
    console.log('🔁 [WA BTN] exchange-code:', res.status, json);

    if (!res.ok || !json?.ok) {
      throw new Error(json?.error || `exchange-code failed (${res.status})`);
    }

    return json;
  };

  const timeoutRef = useRef<number | null>(null);

  const start = () => {
    if (disabled) return;
    if (!tenantId) {
      console.error('[WA BTN] Falta tenantId');
      return;
    }
    if (!sdkReady || !(window as any).FB) {
      console.error('[WA BTN] SDK no listo');
      return;
    }
    if (!configId) {
      console.error('[WA BTN] Falta NEXT_PUBLIC_WA_CONFIG_ID');
      return;
    }

    setLoading(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    timeoutRef.current = window.setTimeout(() => {
      setLoading(false);
      timeoutRef.current = null;
      console.warn('[WA BTN] Timeout esperando respuesta de Meta');
    }, 15000);

    (window as any).FB.login(
      (response: any) => {
        // ✅ callback NO async
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        console.log('[WA BTN] FB.login response:', response);

        const code = response?.authResponse?.code;
        if (!code) {
          setLoading(false);
          console.warn('[WA BTN] No llegó authResponse.code');
          return;
        }

        // ✅ haz el async adentro
        (async () => {
          try {
            await exchangeCode(code);
          } catch (err) {
            console.error('❌ [WA BTN] exchange-code error:', err);
          } finally {
            setLoading(false);
          }
        })();
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        redirect_uri: redirectUri,
        state,
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
