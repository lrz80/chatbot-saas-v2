'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FollowUpSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [horasEspera, setHorasEspera] = useState<number>(0);
  const [diasEspera, setDiasEspera] = useState<number>(0);
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
          const totalMinutos = data.minutos_espera || 60;
          setDiasEspera(Math.floor(totalMinutos / 1440));
          setHorasEspera(Math.floor((totalMinutos % 1440) / 60));
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

      const totalMinutos = (diasEspera * 24 * 60) + (horasEspera * 60);

      const res = await fetch(`${BACKEND_URL}/api/follow-up-settings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minutos_espera: totalMinutos,
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
      <h1 className="text-2xl md:text-3xl font-extrabold mb-6">Seguimiento de Leads</h1>

      {showSuccess && (
        <div className="bg-green-600/90 border border-green-400 text-white px-4 py-3 rounded mb-6 text-center font-medium">
          ✅ Configuración guardada exitosamente
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-800/20 to-fuchsia-600/10 border border-purple-600/30 p-6 rounded-xl mb-8">
        <h2 className="text-xl font-bold mb-4">⏰ Tiempo de Espera para Seguimiento</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Días:</label>
            <input
              type="number"
              min="0"
              value={diasEspera}
              onChange={(e) => setDiasEspera(parseInt(e.target.value))}
              className="w-full p-2 rounded bg-white/20 border border-white/30 focus:outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Horas:</label>
            <input
              type="number"
              min="0"
              max="23"
              value={horasEspera}
              onChange={(e) => setHorasEspera(parseInt(e.target.value))}
              className="w-full p-2 rounded bg-white/20 border border-white/30 focus:outline-none text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-800/20 to-fuchsia-600/10 border border-purple-600/30 p-6 rounded-xl space-y-6">
        <h2 className="text-xl font-bold mb-4">✉️ Mensajes de Seguimiento</h2>

        <div>
          <label className="block text-sm mb-2">Mensaje para clientes que preguntan precios:</label>
          <textarea
            value={mensajePrecio}
            onChange={(e) => setMensajePrecio(e.target.value)}
            rows={3}
            className="w-full p-3 rounded bg-white/20 border border-white/30 focus:outline-none text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Mensaje para clientes que desean agendar cita:</label>
          <textarea
            value={mensajeAgendar}
            onChange={(e) => setMensajeAgendar(e.target.value)}
            rows={3}
            className="w-full p-3 rounded bg-white/20 border border-white/30 focus:outline-none text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Mensaje para clientes que preguntan ubicación:</label>
          <textarea
            value={mensajeUbicacion}
            onChange={(e) => setMensajeUbicacion(e.target.value)}
            rows={3}
            className="w-full p-3 rounded bg-white/20 border border-white/30 focus:outline-none text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Mensaje general para otros casos:</label>
          <textarea
            value={mensajeGeneral}
            onChange={(e) => setMensajeGeneral(e.target.value)}
            rows={3}
            className="w-full p-3 rounded bg-white/20 border border-white/30 focus:outline-none text-white"
          />
        </div>

        <div className="pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-full text-white font-semibold w-full disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}
