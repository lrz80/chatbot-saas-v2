"use client";

import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.aamy.ai";

type Appointment = {
  id: string;
  tenant_id: string;
  channel: string;
  customer_name: string | null;
  customer_phone: string;
  start_time: string; // ISO string desde el backend
  created_at: string; // ISO string
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/appointments`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `Error ${res.status} al cargar citas: ${text || res.statusText}`
          );
        }

        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || "No se pudieron cargar las citas");
        }

        setAppointments(data.appointments || []);
      } catch (err: any) {
        console.error("Error cargando citas:", err);
        setError(err.message || "Error inesperado al cargar citas");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const formatDateTime = (iso: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Título */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Citas agendadas
        </h1>
        <p className="text-sm text-muted-foreground">
          Aquí verás las citas generadas automáticamente por Aamy desde
          WhatsApp, Facebook e Instagram (Fase 1 – sin Google Calendar aún).
        </p>
      </div>

      {/* Estados de carga / error */}
      {loading && (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Cargando citas...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && appointments.length === 0 && (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Aún no hay citas registradas para este negocio.
        </div>
      )}

      {!loading && !error && appointments.length > 0 && (
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4 text-left">Fecha / hora cita</th>
                  <th className="py-2 px-4 text-left">Canal</th>
                  <th className="py-2 px-4 text-left">Cliente</th>
                  <th className="py-2 px-4 text-left">Teléfono</th>
                  <th className="py-2 px-4 text-left hidden sm:table-cell">
                    Creada
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    className="border-b last:border-0 hover:bg-muted/40"
                  >
                    <td className="py-2 pr-4 align-middle">
                      <div className="font-medium">
                        {formatDateTime(appt.start_time)}
                      </div>
                    </td>

                    <td className="py-2 px-4 align-middle">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide">
                        {appt.channel}
                      </span>
                    </td>

                    <td className="py-2 px-4 align-middle">
                      {appt.customer_name || "WhatsApp client"}
                    </td>

                    <td className="py-2 px-4 align-middle">
                      <a
                        href={`https://wa.me/${appt.customer_phone.replace(
                          /^\+/,
                          ""
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {appt.customer_phone}
                      </a>
                    </td>

                    <td className="py-2 px-4 align-middle hidden sm:table-cell text-xs text-muted-foreground">
                      {formatDateTime(appt.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
