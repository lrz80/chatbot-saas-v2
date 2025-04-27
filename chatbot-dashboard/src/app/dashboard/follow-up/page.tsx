'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FollowUpSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [minutosEspera, setMinutosEspera] = useState<number>(5);
  const [mensajePrecio, setMensajePrecio] = useState<string>('');
  const [mensajeAgendar, setMensajeAgendar] = useState<string>('');
  const [mensajeUbicacion, setMensajeUbicacion] = useState<string>('');
  const [mensajeGeneral, setMensajeGeneral] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/follow-up-settings`, {
          credentials: 'include',
        });

        if (!res.ok) throw new Error("Error al cargar configuración");

        const data = await res.json();

        if (data) {
          setMinutosEspera(data.minutos_espera || 5);
          setMensajePrecio(data.mensaje_precio || '');
          setMensajeAgendar(data.mensaje_agendar || '');
          setMensajeUbicacion(data.mensaje_ubicacion || '');
          setMensajeGeneral(data.mensaje_general || '');
        }
      } catch (error) {
        console.error('❌ Error al cargar configuración de seguimiento:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${BACKEND_URL}/api/follow-up-settings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minutos_espera: minutosEspera,
          mensaje_precio: mensajePrecio,
          mensaje_agendar: mensajeAgendar,
          mensaje_ubicacion: mensajeUbicacion,
          mensaje_general: mensajeGeneral,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar configuración');

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error) {
      console.error('❌ Error al guardar configuración:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white p-10">Cargando configuración...</div>;

  return (
    <div className="p-4 md:p-6 text-white">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-6">Configuración de Seguimiento de Leads</h1>

      {showSuccess && (
        <div className="bg-green-600/90 border border-green-400 text-white px-4 py-3 rounded mb-6 text-center font-medium">
          ✅ Configuración guardada exitosamente
        </div>
      )}

      <div className="bg-white/10 p-6 rounded-xl border border-white/20 space-y-6">
        
        <div>
          <label className="block text-sm font-semibold mb-2">Minutos para enviar el seguimiento:</label>
          <input
            type="number"
            min="1"
            value={minutosEspera}
            onChange={(e) => setMinutosEspera(parseInt(e.target.value))}
            className="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Mensaje para clientes que preguntan precios:</label>
          <textarea
            value={mensajePrecio}
            onChange={(e) => setMensajePrecio(e.target.value)}
            className="w-full p-3 rounded bg-white/20 text-white border border-white/30 focus:outline-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Mensaje para clientes que desean agendar cita:</label>
          <textarea
            value={mensajeAgendar}
            onChange={(e) => setMensajeAgendar(e.target.value)}
            className="w-full p-3 rounded bg-white/20 text-white border border-white/30 focus:outline-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Mensaje para clientes que preguntan ubicación:</label>
          <textarea
            value={mensajeUbicacion}
            onChange={(e) => setMensajeUbicacion(e.target.value)}
            className="w-full p-3 rounded bg-white/20 text-white border border-white/30 focus:outline-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Mensaje general para cualquier otra intención:</label>
          <textarea
            value={mensajeGeneral}
            onChange={(e) => setMensajeGeneral(e.target.value)}
            className="w-full p-3 rounded bg-white/20 text-white border border-white/30 focus:outline-none"
            rows={3}
          />
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded text-white font-semibold disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}
