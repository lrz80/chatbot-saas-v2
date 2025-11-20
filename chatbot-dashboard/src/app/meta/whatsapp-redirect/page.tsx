'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WhatsAppRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        // 👇 Tomamos los parámetros desde la URL del navegador
        const params = new URLSearchParams(window.location.search);

        const waba_id = params.get('waba_id');
        const phone_number_id = params.get('phone_number_id');
        const access_token = params.get('access_token');
        const phone_number = params.get('phone_number');
        const state = params.get('state'); // tenantId

        if (!state) {
          alert('No se encontró el TenantId (state).');
          router.push('/dashboard/training');
          return;
        }

        // 👇 Enviamos los datos al backend para guardarlos en tenants
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/meta/whatsapp/onboard-complete`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              waba_id,
              phone_number_id,
              phone_number,
              access_token,
            }),
          }
        );

        if (!res.ok) {
          console.error('❌ Error HTTP', res.status);
          alert('No se pudo guardar la conexión de WhatsApp');
          router.push('/dashboard/training');
          return;
        }

        // ✅ Todo bien: volvemos al training con un query de éxito
        router.push('/dashboard/training?wa_connected=1');
      } catch (err) {
        console.error('❌ Error en WhatsAppRedirectPage:', err);
        alert('No se pudo procesar la conexión de WhatsApp');
        router.push('/dashboard/training');
      }
    };

    run();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0e0e2c] text-white">
      <h2 className="text-lg font-semibold">Conectando WhatsApp...</h2>
      <p className="text-sm text-white/70 mt-2">
        Espera un momento mientras guardamos la configuración de tu número.
      </p>
    </div>
  );
}
