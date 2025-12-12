// app/dashboard/appointments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/utils/api';
import { FiClock, FiPhone, FiUser, FiChevronDown } from 'react-icons/fi';
import { FaWhatsapp, FaFacebookMessenger } from 'react-icons/fa';

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended';

type Appointment = {
  id: string;
  tenant_id: string;
  service_id: string | null;
  service_name?: string | null;
  channel: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  start_time: string;
  end_time: string | null;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/appointments`, {
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Error al cargar citas');

        const data = await res.json();
        setAppointments(data.appointments || []);
      } catch (error) {
        console.error('[Appointments] Error cargando citas:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChannelBadge = (channel: string) => {
    const ch = channel.toLowerCase();
    if (ch === 'whatsapp') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/40">
          <FaWhatsapp className="text-green-400" />
          WhatsApp
        </span>
      );
    }
    if (ch === 'facebook' || ch === 'messenger') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/40">
          <FaFacebookMessenger className="text-blue-400" />
          Facebook
        </span>
      );
    }
    if (ch === 'instagram') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/40">
          IG
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-200 border border-slate-500/40">
        {channel}
      </span>
    );
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmada';
      case 'cancelled':
        return 'Cancelada';
      case 'attended':
        return 'Asistió';
      default:
        return status;
    }
  };

  const getStatusClasses = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-300 border border-amber-500/40';
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-300 border border-rose-500/40 line-through';
      case 'attended':
        return 'bg-sky-500/10 text-sky-300 border border-sky-500/40';
      default:
        return 'bg-slate-500/10 text-slate-200 border border-slate-500/40';
    }
  };

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      setSavingId(id);

      const res = await fetch(`${BACKEND_URL}/api/appointments/${id}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        console.error('Error al actualizar estado', await res.text());
        return;
      }

      const data = await res.json();

      setAppointments(prev =>
        prev.map(a =>
          a.id === id ? { ...a, status: data.appointment.status as AppointmentStatus } : a
        )
      );
    } catch (error) {
      console.error('[Appointments] Error en handleStatusChange:', error);
    } finally {
      setSavingId(null);
      setOpenMenuId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050012] text-white px-4 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Citas agendadas</h1>
          <p className="text-sm text-white/70 max-w-2xl">
            Aquí verás las citas que Aamy genera automáticamente desde WhatsApp, Facebook e Instagram.
            (Fase 1 – sin Google Calendar aún).
          </p>
        </header>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {/* Header fila */}
          <div className="grid grid-cols-12 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white/60 border-b border-white/10">
            <div className="col-span-3 flex items-center gap-2">
              <FiClock className="text-white/50" />
              Fecha / hora cita
            </div>
            <div className="col-span-2">Canal</div>
            <div className="col-span-3 flex items-center gap-2">
              <FiUser className="text-white/50" />
              Cliente
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <FiPhone className="text-white/50" />
              Teléfono
            </div>
            <div className="col-span-2 text-right">Estado</div>
          </div>

          <div className="divide-y divide-white/5">
            {loading && (
              <div className="px-5 py-6 text-sm text-white/70">
                Cargando citas...
              </div>
            )}

            {!loading && appointments.length === 0 && (
              <div className="px-5 py-6 text-sm text-white/60">
                Aún no hay citas agendadas.
              </div>
            )}

            {!loading &&
              appointments.map(appt => (
                <div
                  key={appt.id}
                  className="grid grid-cols-12 px-5 py-4 items-center hover:bg-white/5 transition-colors text-sm"
                >
                  {/* Fecha / hora cita + creada */}
                  <div className="col-span-3 flex flex-col gap-1">
                    <span className="font-medium">
                      {formatDateTime(appt.start_time)}
                    </span>
                    <span className="text-[11px] text-white/50">
                      Creada: {formatDateTime(appt.created_at)}
                    </span>
                  </div>

                  {/* Canal */}
                  <div className="col-span-2">
                    {getChannelBadge(appt.channel)}
                  </div>

                  {/* Cliente */}
                  <div className="col-span-3">
                    <div className="font-medium">
                      {appt.customer_name || appt.customer_phone || 'Cliente'}
                    </div>
                    <div className="text-[11px] text-white/50 truncate max-w-[180px]">
                      ID: {appt.id}
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div className="col-span-2">
                    <span className="text-sm">
                      {appt.customer_phone || '—'}
                    </span>
                  </div>

                  {/* Estado con menú */}
                  <div className="col-span-2 flex justify-end relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId(prev => (prev === appt.id ? null : appt.id))
                      }
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${getStatusClasses(
                        appt.status
                      )}`}
                    >
                      {savingId === appt.id ? (
                        <span className="animate-pulse">Guardando...</span>
                      ) : (
                        <>
                          {getStatusLabel(appt.status)}
                          <FiChevronDown className="w-3 h-3 opacity-80" />
                        </>
                      )}
                    </button>

                    {openMenuId === appt.id && (
                      <div className="absolute right-0 top-9 w-40 bg-[#060014] border border-white/15 rounded-xl shadow-lg z-20 text-xs">
                        {[
                          { value: 'pending', label: 'Pendiente' },
                          { value: 'confirmed', label: 'Confirmada' },
                          { value: 'attended', label: 'Asistió' },
                          { value: 'cancelled', label: 'Cancelada' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              handleStatusChange(appt.id, opt.value as AppointmentStatus)
                            }
                            className={`w-full text-left px-3 py-2 hover:bg-white/10 ${
                              appt.status === opt.value
                                ? 'text-purple-300'
                                : 'text-white/80'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
