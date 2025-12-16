// src/app/dashboard/whatsapp-connect/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function WhatsAppConnectCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const code = sp.get('code');
      const state = sp.get('state') || '';
      const error = sp.get('error');
      const error_description = sp.get('error_description');

      // A veces Meta puede enviar estos (según flujo). Si no vienen, quedan null.
      const wabaId =
        sp.get('wabaId') ||
        sp.get('waba_id') ||
        sp.get('whatsapp_business_id') ||
        null;

      const phoneNumberId =
        sp.get('phoneNumberId') ||
        sp.get('phone_number_id') ||
        sp.get('whatsapp_phone_number_id') ||
        null;

      if (error) {
        const msg = encodeURIComponent(error_description || error);
        router.replace(`/dashboard/training?wa_connected=error&msg=${msg}`);
        return;
      }

      if (!code) {
        router.replace(
          `/dashboard/training?wa_connected=error&msg=${encodeURIComponent(
            'No llegó code de Meta'
          )}`
        );
        return;
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (!API_BASE) {
        router.replace(
          `/dashboard/training?wa_connected=error&msg=${encodeURIComponent(
            'Falta NEXT_PUBLIC_API_BASE_URL en el frontend'
          )}`
        );
        return;
      }

      try {
        // 1) Exchange code -> guarda whatsapp_access_token (y lo que haga tu backend)
        const exchangeResp = await fetch(`${API_BASE}/api/meta/whatsapp/exchange-code`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const exchangeJson: any = await exchangeResp.json().catch(() => ({}));

        if (!exchangeResp.ok) {
          const msg =
            exchangeJson?.error ||
            exchangeJson?.detail?.error?.message ||
            exchangeJson?.detail?.message ||
            'Error en exchange-code';
          router.replace(
            `/dashboard/training?wa_connected=error&msg=${encodeURIComponent(String(msg))}`
          );
          return;
        }

        // 2) (Opcional) Si tenemos wabaId + phoneNumberId, completar onboard y guardar en tenants
        if (wabaId && phoneNumberId) {
          const onboardResp = await fetch(`${API_BASE}/api/meta/whatsapp/onboard-complete`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wabaId, phoneNumberId }),
          });

          const onboardJson: any = await onboardResp.json().catch(() => ({}));

          if (!onboardResp.ok) {
            const msg =
              onboardJson?.error ||
              onboardJson?.detail?.error?.message ||
              onboardJson?.detail?.message ||
              'Error en onboard-complete';
            router.replace(
              `/dashboard/training?wa_connected=error&msg=${encodeURIComponent(String(msg))}`
            );
            return;
          }
        }

        // OK
        router.replace(
          `/dashboard/training?wa_connected=ok&state=${encodeURIComponent(state)}`
        );
      } catch (e: any) {
        router.replace(
          `/dashboard/training?wa_connected=error&msg=${encodeURIComponent(
            e?.message || 'Error inesperado en callback'
          )}`
        );
      }
    };

    run();
  }, [router, sp]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="p-6 rounded-xl border border-white/20 bg-white/10">
        <h1 className="text-xl font-bold mb-2">Conectando WhatsApp...</h1>
        <p className="text-sm opacity-80">Procesando autorización de Meta.</p>
      </div>
    </div>
  );
}
