'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BACKEND_URL } from '@/utils/api';

export default function WhatsAppConnectPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'approved' | 'pending' | 'error'>('loading');
  const [message, setMessage] = useState('Sincronizando WhatsApp con Twilio…');

  const sync = async () => {
    try {
      setStatus('loading');
      setMessage('Sincronizando WhatsApp con Twilio…');

      const res = await fetch(`${BACKEND_URL}/api/twilio/whatsapp/sync-sender`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || 'Error sincronizando sender');

      if (data?.status === 'approved') {
        setStatus('approved');
        setMessage('WhatsApp conectado correctamente. Redirigiendo…');
        setTimeout(() => router.push('/dashboard/training'), 800);
        return;
      }

      // Si no hay sender aprobado aún
      setStatus('pending');
      setMessage('Aún está pendiente la aprobación del sender en Twilio. Reintenta en unos minutos.');
    } catch (e: any) {
      console.error('❌ sync-sender error:', e);
      setStatus('error');
      setMessage(e?.message || 'Error en la sincronización');
    }
  };

  useEffect(() => {
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e2c] text-white px-4">
      <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-xl p-6">
        <h1 className="text-xl font-bold mb-2">Conectando WhatsApp</h1>
        <p className="text-sm text-white/80">{message}</p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={sync}
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-sm"
          >
            Reintentar
          </button>

          <button
            type="button"
            onClick={() => router.push('/dashboard/training')}
            className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 text-sm"
          >
            Volver
          </button>
        </div>

        {status === 'approved' && (
          <div className="mt-4 text-xs text-green-300">
            Estado: approved
          </div>
        )}
        {status === 'pending' && (
          <div className="mt-4 text-xs text-yellow-300">
            Estado: pending
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 text-xs text-red-300">
            Estado: error
          </div>
        )}
      </div>
    </div>
  );
}
