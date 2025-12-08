// src/app/dashboard/follow-up/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import { SiSpeedtest } from 'react-icons/si';
import { Clock3, Mail, SendHorizonal } from 'lucide-react';

export default function FollowUpSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [horasEspera, setHorasEspera] = useState<number>(0);
  const [mensajePrecio, setMensajePrecio] = useState('');
  const [mensajeAgendar, setMensajeAgendar] = useState('');
  const [mensajeUbicacion, setMensajeUbicacion] = useState('');
  const [mensajeGeneral, setMensajeGeneral] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [mensajesEnviados, setMensajesEnviados] = useState<any[]>([]);
  const [loadingMensajes, setLoadingMensajes] = useState(true);
  const [reloadingMensajes, setReloadingMensajes] = useState(false);
  const [membresiaActiva, setMembresiaActiva] = useState(false);
  const [usoFollowup, setUsoFollowup] = useState<any>(null);

  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/follow-up-settings`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Error al cargar configuración');

      const data = await res.json();
      if (data) {
        const totalMinutos = data.minutos_espera || 60;
        setHorasEspera(Math.floor(totalMinutos / 60));
        setMensajePrecio(data.mensaje_precio || '');
        setMensajeAgendar(data.mensaje_agendar || '');
        setMensajeUbicacion(data.mensaje_ubicacion || '');
        setMensajeGeneral(data.mensaje_general || '');
        setMembresiaActiva(data.membresia_activa ?? false);
      }
    } catch (error) {
      console.error('❌ Error al cargar configuración de seguimiento:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMensajesEnviados = async () => {
    try {
      setLoadingMensajes(true);
      const res = await fetch(
        `${BACKEND_URL}/api/follow-up/sent-messages?status=sent&limit=100`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Error al cargar mensajes enviados');

      const data = await res.json();
      // ✅ El backend devuelve { items, page, total, ... }
      const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
      setMensajesEnviados(items);
    } catch (error) {
      console.error('❌ Error al cargar mensajes enviados:', error);
      setMensajesEnviados([]);
    } finally {
      setLoadingMensajes(false);
      setReloadingMensajes(false);
    }
  };

  const handleReloadMensajes = async () => {
    try {
      setReloadingMensajes(true);
      await fetchMensajesEnviados();
    } catch (error) {
      console.error('❌ Error recargando mensajes:', error);
      setReloadingMensajes(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const totalMinutos = horasEspera * 60;

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

  useEffect(() => {
    const fetchUsos = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/usage`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUsoFollowup(data.usos.find((u: any) => u.canal === 'followup'));
        }
      } catch (error) {
        console.error("Error obteniendo uso de seguimiento:", error);
      }
    };
    fetchUsos();
  }, [BACKEND_URL]);

  const comprarMas = async (canal: string, cantidad: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout-credit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal, cantidad, redirectPath: "/dashboard/follow-up" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("❌ Error al iniciar la compra.");
      }
    } catch (error) {
      console.error("❌ Error al procesar la compra:", error);
      alert("❌ Error al procesar la compra.");
    }
  };

  const calcularPorcentaje = (usados: number, limite: number) =>
    limite > 0 ? (usados / limite) * 100 : 0;

  const colorBarra = (p: number) =>
    p > 80 ? "bg-red-500" : p > 50 ? "bg-yellow-500" : "bg-green-500";

  useEffect(() => {
    fetchSettings();
    fetchMensajesEnviados();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="text-white p-10">Cargando configuración...</div>;
  }

  return (
    <div className="p-4 md:p-6 text-white">
      <h1
        className="
          text-2xl
          sm:text-3xl
          md:text-4xl
          font-extrabold
          text-center
          flex flex-col sm:flex-row
          justify-center items-center
          gap-2
          mb-6 md:mb-8
          text-purple-300
        "
      >
        <SiSpeedtest
          size={28}
          className="text-green-400 animate-pulse sm:size-9"
        />
        <span>
          Seguimiento de Leads
        </span>
      </h1>

      {usoFollowup && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <SiSpeedtest /> Seguimiento de Leads (Follow-up)
          </h3>

          <p className="text-white text-sm mb-2">
            {usoFollowup.usados ?? 0} de {usoFollowup.limite} seguimientos realizados
            {(usoFollowup.creditos_extras ?? 0) > 0 && " (incluye créditos extra)"}
          </p>

          {(usoFollowup.creditos_extras ?? 0) > 0 && (
            <p className="text-green-300 text-sm">
              Incluye {usoFollowup.creditos_extras} seguimientos extra comprados.
            </p>
          )}

          <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
            <div
              className={`h-full ${colorBarra(
                calcularPorcentaje(usoFollowup.usados, usoFollowup.limite)
              )} transition-all duration-500`}
              style={{
                width: `${calcularPorcentaje(
                  usoFollowup.usados,
                  usoFollowup.limite
                )}%`,
              }}
            />
          </div>

          <div className="flex gap-2">
            {[500, 1000, 2000].map((extra) => (
              <button
                key={extra}
                onClick={() => comprarMas("followup", extra)}
                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
              >
                +{extra}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="bg-green-600/90 border border-green-400 text-white px-4 py-3 rounded-xl mb-8 text-center font-medium animate-pulse">
          ✅ ¡Configuración guardada exitosamente!
        </div>
      )}

      {/* Configuración de Seguimiento */}
      <section className="bg-gradient-to-r from-purple-800/20 to-fuchsia-600/10 border border-purple-600/30 backdrop-blur-md p-6 rounded-2xl mb-8 shadow-md">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Clock3 className="text-purple-300" /> Tiempo de Espera para Seguimiento
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm mb-2 font-semibold text-purple-200">Horas:</label>
            <input
              type="number"
              min="0"
              max="23"
              value={horasEspera}
              onChange={(e) => setHorasEspera(parseInt(e.target.value) || 0)}
              onBlur={() => {
                if (horasEspera > 23) setHorasEspera(23);
                if (horasEspera < 0) setHorasEspera(0);
              }}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none text-white"
            />
          </div>
        </div>
      </section>

      {/* Mensajes de Seguimiento */}
      <section className="bg-gradient-to-r from-purple-800/20 to-fuchsia-600/10 border border-purple-600/30 backdrop-blur-md p-6 rounded-2xl shadow-md space-y-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Mail className="text-purple-300" /> Mensajes Personalizados de Seguimiento
        </h2>

        <div>
          <label className="block text-sm mb-2 font-semibold text-purple-200">Mensaje para clientes que preguntan precios:</label>
          <textarea
            value={mensajePrecio}
            onChange={(e) => setMensajePrecio(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 font-semibold text-purple-200">Mensaje para clientes que desean agendar cita:</label>
          <textarea
            value={mensajeAgendar}
            onChange={(e) => setMensajeAgendar(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 font-semibold text-purple-200">Mensaje para clientes que preguntan ubicación:</label>
          <textarea
            value={mensajeUbicacion}
            onChange={(e) => setMensajeUbicacion(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 font-semibold text-purple-200">Mensaje general para otros casos:</label>
          <textarea
            value={mensajeGeneral}
            onChange={(e) => setMensajeGeneral(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none text-white resize-none"
          />
        </div>

        <div className="pt-6">
          <button
            onClick={() => {
              if (!membresiaActiva) {
                router.push("/upgrade");
                return;
              }
              handleSave();
            }}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full text-white font-bold w-full transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </section>

      {/* Mensajes enviados */}
      <section className="bg-gradient-to-r from-purple-800/20 to-fuchsia-600/10 border border-purple-600/30 backdrop-blur-md p-6 rounded-2xl shadow-md mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <SendHorizonal className="text-purple-300" /> Seguimientos Enviados
          </h2>
          <button
            onClick={handleReloadMensajes}
            className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-full font-semibold transition-all disabled:opacity-50"
            disabled={reloadingMensajes}
          >
            {reloadingMensajes ? 'Recargando...' : 'Recargar'}
          </button>
        </div>

        {loadingMensajes ? (
          <p className="text-white/50 animate-pulse">Cargando mensajes enviados...</p>
        ) : mensajesEnviados.length === 0 ? (
          <p className="text-white/50">Aún no se han enviado mensajes de seguimiento.</p>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {mensajesEnviados.map((m) => {
              const fecha = m.sent_at || m.fecha_envio; // ✅ fallback
              return (
                <div
                  key={m.id}
                  className="bg-white/5 border border-white/10 p-4 rounded-lg text-sm text-white flex flex-col gap-2 transition-all duration-300"
                >
                  <div className="flex flex-wrap gap-2 justify-between text-xs text-white/60">
                    <span>{fecha ? new Date(fecha).toLocaleString() : '-'}</span>
                    <span className="uppercase">{m.canal}</span>
                    <span>{m.contacto}</span>
                  </div>
                  <div className="text-white whitespace-pre-wrap">{m.contenido}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}