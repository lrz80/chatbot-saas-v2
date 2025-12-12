'use client';

import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/utils/api';
import { FiCalendar, FiClock, FiSmartphone, FiUser } from 'react-icons/fi';
import { FaWhatsapp, FaFacebookMessenger, FaPhone } from 'react-icons/fa';

type Appointment = {
  id: string;
  tenant_id: string;
  channel: string;
  customer_name: string | null;
  customer_phone: string;
  start_time: string;   // ISO
  created_at: string;   // ISO
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${BACKEND_URL}/api/appointments`, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('No se pudieron cargar las citas');
        }

        const data = await res.json();
        setAppointments(data || []);
      } catch (err: any) {
        console.error('❌ Error cargando citas:', err);
        setError(err.message || 'Error al cargar citas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function formatDateTime(iso: string) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderChannelBadge(channel: string) {
    const ch = (channel || '').toLowerCase();

    if (ch === 'whatsapp') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 text-green-400 px-3 py-1 text-xs font-semibold">
          <FaWhatsapp className="text-[0.9rem]" />
          WhatsApp
        </span>
      );
    }

    if (ch === 'meta' || ch === 'facebook' || ch === 'instagram') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-400 px-3 py-1 text-xs font-semibold">
          <FaFacebookMessenger className="text-[0.9rem]" />
          Meta
        </span>
      );
    }

    if (ch === 'voice' || ch === 'phone' || ch === 'llamada') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 text-purple-300 px-3 py-1 text-xs font-semibold">
          <FaPhone className="text-[0.9rem]" />
          Voz
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 text-slate-200 px-3 py-1 text-xs font-semibold">
        {ch || 'Otro'}
      </span>
    );
  }

  // Fase 2 real usará un campo status. Por ahora, siempre “Pendiente”.
  function renderStatusBadge() {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/10 text-amber-300 px-3 py-1 text-xs font-semibold">
        Pendiente
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05010f] to-[#05010f] text-white px-4 md:px-8 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Citas agendadas
            </h1>
            <p className="text-sm md:text-base text-white/60 mt-1">
              Aquí verás las citas que Aamy genera automáticamente desde WhatsApp, Facebook e Instagram.
              (Fase 1 – sin Google Calendar aún).
            </p>
          </div>
        </div>

        {/* Card contenedor */}
        <div className="bg-[#070616]/80 border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Header de la tabla */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white/50 border-b border-white/10 bg-white/5">
            <div className="col-span-3 flex items-center gap-2">
              <FiCalendar className="text-white/60" />
              Fecha / hora cita
            </div>
            <div className="col-span-2 flex items-center gap-2">
              Canal
            </div>
            <div className="col-span-3 flex items-center gap-2">
              <FiUser className="text-white/60" />
              Cliente
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <FiSmartphone className="text-white/60" />
              Teléfono
            </div>
            <div className="col-span-2 flex items-center gap-2">
              Estado
            </div>
          </div>

          {/* Estados: loading / error / vacío */}
          {loading && (
            <div className="px-6 py-10 flex items-center justify-center text-white/60 text-sm">
              Cargando citas...
            </div>
          )}

          {!loading && error && (
            <div className="px-6 py-10 text-center">
              <p className="text-red-400 text-sm mb-2">
                {error}
              </p>
              <p className="text-white/50 text-xs">
                Intenta recargar la página. Si el problema persiste, revisa el endpoint
                <span className="font-mono ml-1">/api/appointments</span> en el backend.
              </p>
            </div>
          )}

          {!loading && !error && appointments.length === 0 && (
            <div className="px-6 py-10 text-center text-white/60 text-sm">
              Aún no hay citas agendadas. Cuando un cliente pida una cita por WhatsApp, Facebook o Instagram,
              verás la información aquí.
            </div>
          )}

          {/* Lista de citas */}
          {!loading && !error && appointments.length > 0 && (
            <div className="divide-y divide-white/5">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="px-4 md:px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center hover:bg-white/[0.03] transition-colors"
                >
                  {/* Fecha / hora */}
                  <div className="md:col-span-3 flex flex-col">
                    <span className="text-sm font-medium text-white">
                      {formatDateTime(appt.start_time)}
                    </span>
                    <span className="text-xs text-white/40 flex items-center gap-1 mt-1">
                      <FiClock className="text-[0.8rem]" />
                      Creada: {formatDateTime(appt.created_at)}
                    </span>
                  </div>

                  {/* Canal */}
                  <div className="md:col-span-2">
                    {renderChannelBadge(appt.channel)}
                  </div>

                  {/* Cliente */}
                  <div className="md:col-span-3 flex flex-col">
                    <span className="text-sm font-medium text-white">
                      {appt.customer_name || 'WhatsApp client'}
                    </span>
                    <span className="text-xs text-white/40">
                      ID: {appt.id.slice(0, 8)}…
                    </span>
                  </div>

                  {/* Teléfono */}
                  <div className="md:col-span-2">
                    <span className="inline-flex items-center gap-2 text-sm text-white">
                      <FiSmartphone className="text-white/60" />
                      {appt.customer_phone}
                    </span>
                  </div>

                  {/* Estado (por ahora fijo) */}
                  <div className="md:col-span-2 flex md:justify-end">
                    {renderStatusBadge()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
