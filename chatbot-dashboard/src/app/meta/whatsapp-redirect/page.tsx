'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WhatsAppRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [saving, setSaving] = useState(true);

  useEffect(() => {
    const saveWhatsAppData = async () => {
      const waba_id = searchParams.get('waba_id');
      const phone_number_id = searchParams.get('phone_number_id');
      const access_token = searchParams.get('access_token');
      const phone_number = searchParams.get('phone_number');
      const state = searchParams.get('state'); // tenantId

      if (!state) {
        alert('No se encontró el TenantId (state).');
        router.push('/dashboard/training');
        return;
      }

      try {
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

        if (!res.ok) throw new Error('Fallo al guardar WhatsApp');

        router.push('/dashboard/training?wa_connected=1');
      } catch (err) {
        console.error(err);
        alert('No se pudo guardar la conexión de WhatsApp');
        router.push('/dashboard/training');
      }
    };

    saveWhatsAppData();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-lg font-medium">Conectando WhatsApp...</h2>
      <p className="text-sm text-gray-500 mt-2">
        Espera un momento mientras guardamos la configuración.
      </p>
    </div>
  );
}
