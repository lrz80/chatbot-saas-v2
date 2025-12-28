'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 🚫 Cloud API CALLBACK — DESHABILITADO
 *
 * Este callback pertenece al flujo antiguo de WhatsApp Cloud API (Meta directo).
 * NO debe usarse para Twilio Tech Provider / Embedded Signup.
 *
 * Se mantiene únicamente para evitar que URLs viejas rompan la app.
 */
export default function WhatsAppConnectCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(
      `/dashboard/training?wa_connected=error&msg=${encodeURIComponent(
        'Este callback es de Cloud API y está deshabilitado. Usa el flujo Twilio Embedded Signup.'
      )}`
    );
  }, [router]);

  return null;
}
