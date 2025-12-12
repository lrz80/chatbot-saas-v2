'use client';

import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/utils/api';
import { FiChevronDown } from 'react-icons/fi';
import { FaWhatsapp, FaFacebookMessenger, FaInstagram } from 'react-icons/fa';

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended';

type Appointment = {
  id: string;
  tenant_id: string;
  service_id: string | null;
  service_name: string | null;
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

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; badgeClass: string }
> = {
  pending: {
    label: 'Pendiente',
    badgeClass:
      'bg-amber-600/80 text-white hover:bg-amber-500 border border-amber-400/60',
  },
  confirmed: {
    label: 'Confirmada',
    badgeClass:
      'bg-emerald-600/80 text-white hover:bg-emerald-500 border border-emerald-400/60',
  },
  cancelled: {
    label: 'Cancelada',
    badgeClass:
      'bg-red-600/80 text-white hover:bg-red-500 border border-red-400/60',
  },
  attended: {
    label: 'Atendida',
    badgeClass:
      'bg-sky-600/80 text-white hover:bg-sky-500 border border-sky-400/60',
  },
};

const STATUS_OPTIONS: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'cancelled',
  'attended',
];

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getChannelBadge(channel: string) {
  const ch = (channel || '').toLowerCase();

  if (ch === 'whatsapp') {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/90 text-xs font-medium text-white shadow-sm">
        <FaWhatsapp className="text-sm" />
        WhatsApp
      </span>
    );
  }

  if (ch === 'facebook') {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-600/90 text-xs font-medium text-white shadow-sm">
        <FaFacebookMessenger className="text-sm" />
        Facebook
      </span>
    );
  }

  if (ch === 'instagram') {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-600/90 text-xs font-medium text-white shadow-sm">
        <FaInstagram className="text-sm" />
        Instagram
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-600/80 text-xs font-medium text-white shadow-sm">
      {channel || 'Otro'}
    </span>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar citas
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${BACKEND_URL}/api/appointments`, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Error al cargar citas (${res.status})`);
        }

        const data = await res.json();

        if (!data.ok) {
          throw new Error(data.error || 'Error al cargar citas');
        }

        setAppointments(data.appointments || []);
      } catch (err: any) {
        console.error('❌ Error al cargar citas:', err);
        setError(
          err?.message || 'Hubo un problema al cargar las citas. Intenta de nuevo.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleChangeStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      setSavingId(id);
      setError(null);

      const res = await fetch(`${BACKEND_URL}/api/appointments/${id}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('❌ Error HTTP al actualizar estado:', res.status, text);
        throw new Error(`Error al actualizar estado (${res.status})`);
      }

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || 'Error al actualizar estado');
      }

      const updated: Appointment = data.appointment;

      setAppointments((prev) =>
        prev.map((appt) => (appt.id === id ? updated : appt))
      );
      setOpenStatusId(null);
    } catch (err: any) {
      console.error('❌ Error al actualizar estado de cita:', err);
      setError(
        err?.message || 'No se pudo actualizar el estado de la cita. Intenta de nuevo.'
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050314] via-[#050018] to-[#050010] text-white px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Citas agendadas
          </h1>
          <p className="mt-2 text-sm text-white/60 max-w-2xl">
            Aquí verás las citas que Aamy genera automáticamente desde WhatsApp, Facebook e Instagram. (Fase 1 – sin Google Calendar aún).
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl">
          {/* Cabecera */}
          <div className="grid grid-cols-12 gap-2 px-4 sm:px-6 py-3 text-xs font-semibold text-white/60 bg-white/5 border-b border-white/10">
            <div className="col-span-3 sm:col-span-3 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 text-[10px]">
                ⏱
              </span>
              FECHA / HORA CITA
            </div>
            <div className="col-span-2 sm:col-span-2 flex items-center">CANAL</div>
            <div className="col-span-3 sm:col-span-3 flex items-center">CLIENTE</div>
            <div className="col-span-2 sm:col-span-2 flex items-center">TELÉFONO</div>
            <div className="col-span-2 sm:col-span-2 flex items-center justify-end">
              ESTADO
            </div>
          </div>

          {/* Estado de carga */}
          {loading && (
            <div className="px-6 py-10 text-center text-sm text-white/60">
              Cargando citas...
            </div>
          )}

          {!loading && appointments.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-white/60">
              Aún no hay citas registradas para este negocio.
            </div>
          )}

          {/* Filas */}
          {!loading &&
            appointments.length > 0 &&
            appointments.map((appt) => {
              const statusMeta = STATUS_META[appt.status] || STATUS_META.pending;

              return (
                <div
                  key={appt.id}
                  className="grid grid-cols-12 gap-2 px-4 sm:px-6 py-4 border-t border-white/5 hover:bg-white/5 transition-colors"
                >
                  {/* Fecha / hora */}
                  <div className="col-span-3 sm:col-span-3">
                    <div className="text-sm font-medium text-white">
                      {formatDateTime(appt.start_time)}
                    </div>
                    <div className="mt-1 text-[11px] text-white/45">
                      Creada: {formatDateTime(appt.created_at)}
                    </div>
                  </div>

                  {/* Canal */}
                  <div className="col-span-2 sm:col-span-2 flex items-center">
                    {getChannelBadge(appt.channel)}
                  </div>

                  {/* Cliente */}
                  <div className="col-span-3 sm:col-span-3 flex flex-col justify-center">
                    <div className="text-sm text-white">
                      {appt.customer_name || appt.customer_phone || 'Cliente sin nombre'}
                    </div>
                    <div className="text-[11px] text-white/40 truncate max-w-[220px]">
                      ID: {appt.id}
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div className="col-span-2 sm:col-span-2 flex items-center text-sm text-white">
                    {appt.customer_phone || '-'}
                  </div>

                  {/* Estado + dropdown */}
                  <div className="col-span-2 sm:col-span-2 flex items-center justify-end relative">
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenStatusId(
                            openStatusId === appt.id ? null : appt.id
                          )
                        }
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050314] focus:ring-purple-500 ${statusMeta.badgeClass}`}
                        disabled={savingId === appt.id}
                      >
                        <span>{statusMeta.label}</span>
                        <FiChevronDown
                          className={`text-sm transition-transform ${
                            openStatusId === appt.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {openStatusId === appt.id && (
                        <div
                            className="absolute right-0 w-40 rounded-xl bg-[#050314] border border-white/10 shadow-2xl z-30"
                            style={{ bottom: 'calc(100% + 8px)' }} // 8px arriba del botón
                        >
                            <div className="py-1 text-xs text-white/80">
                            {STATUS_OPTIONS.map((opt) => {
                                const optMeta = STATUS_META[opt];
                                const isActive = opt === appt.status;

                                return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleChangeStatus(appt.id, opt)}
                                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-white/10 ${
                                    isActive ? 'text-white' : 'text-white/70'
                                    }`}
                                    disabled={savingId === appt.id}
                                >
                                    <span>{optMeta.label}</span>
                                    {isActive && (
                                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                    )}
                                </button>
                                );
                            })}
                            </div>
                        </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
