'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function WhatsAppConnectCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const code = sp.get('code');
    const state = sp.get('state');
    const error = sp.get('error');
    const error_description = sp.get('error_description');

    if (error) {
      const msg = encodeURIComponent(error_description || error);
      router.replace(`/dashboard/training?wa_connected=error&msg=${msg}`);
      return;
    }

    if (!code) {
      router.replace(`/dashboard/training?wa_connected=error&msg=${encodeURIComponent('No llegó code de Meta')}`);
      return;
    }

    // FASE 2: aquí vas a llamar al backend para exchange-code.
    // En Fase 1 solo confirmamos que el code llega.
    router.replace(`/dashboard/training?wa_connected=code&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`);
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
