'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BACKEND_URL } from '@/utils/api';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleDelete = async () => {
    const confirmacion = confirm('⚠️ Esta acción eliminará tu cuenta permanentemente. ¿Deseas continuar?');
    if (!confirmacion) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/delete`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/register');
        }, 3000);
      } else {
        setError(data.error || '❌ No se pudo eliminar la cuenta.');
      }
    } catch (err) {
      setLoading(false);
      setError('❌ Error al conectar con el servidor.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] flex items-center justify-center text-white px-6">
      <div className="max-w-lg bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg rounded-2xl p-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-red-400">Eliminar Cuenta</h1>
        <p className="text-white/80 mb-6">
          Esta acción eliminará permanentemente tu cuenta y todos tus datos relacionados.
        </p>

        {error && <p className="text-red-400 mb-4">{error}</p>}
        {success && (
          <p className="text-green-400 mb-4">
            ✅ Tu cuenta fue eliminada. Serás redirigido al registro...
          </p>
        )}

        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 transition px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
        </button>

        <div className="mt-6 text-sm text-white/60">
          <button
            onClick={() => router.back()}
            className="hover:underline text-white/70"
          >
            ⬅️ Volver al panel
          </button>
        </div>
      </div>
    </div>
  );
}
