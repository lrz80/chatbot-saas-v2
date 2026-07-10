//src/app/dashboard/contacts/[id]/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/i18n/LanguageProvider";

type Contact = {
  id: number;
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  segmento: string | null;
  estado_cliente: string;
  marketing_opt_in: boolean;
  opt_in_source: string | null;
  opt_in_at: string | null;
  idioma: string | null;
  origen: string | null;
  ultimo_canal: string | null;
  llamadas: number;
  reservas: number;
  ultimo_servicio: string | null;
  primera_llamada: string | null;
  ultima_llamada: string | null;
  primera_reserva_at: string | null;
  ultima_reserva_at: string | null;
  ultima_cita: string | null;
  proxima_cita_at: string | null;
  ultima_interaccion_at: string | null;
  valor_generado: string | number;
  resumen_ia: string | null;
  resumen_ia_actualizado_at: string | null;
  notas: string | null;
  fecha_creacion: string | null;
  updated_at: string | null;
};

type Appointment = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  channel: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  created_at: string | null;
  google_event_link: string | null;
  service_name: string | null;
};

type Message = {
  id: number;
  message_id: string;
  content: string;
  role: string;
  canal: string;
  timestamp: string;
  from_number: string | null;
  emotion: string | null;
};

type BookingHistoryItem = {
  id: number;
  appointment_id: string;
  scheduled_at: string | null;
  service_name: string | null;
  channel: string;
  created_at: string;
};

type ContactDetailResponse = {
  ok: boolean;
  contact: Contact;
  appointments: Appointment[];
  messages: Message[];
  bookingHistory: BookingHistoryItem[];
  error?: string;
};

type TimelineItem = {
  id: string;
  type: "message" | "appointment";
  timestamp: string;
  channel: string;
  title: string;
  description: string;
  role?: string;
  status?: string | null;
};

function formatDateTime(value: string | null, lang: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(lang === "en" ? "en-US" : "es-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(value: string | number, lang: string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0.00";
  }

  return new Intl.NumberFormat(lang === "en" ? "en-US" : "es-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getStateClasses(state: string): string {
  const normalized = state.toLowerCase();

  if (normalized === "recurrente") {
    return "bg-purple-100 text-purple-800";
  }

  if (normalized === "cliente") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (normalized === "vip") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-blue-100 text-blue-800";
}

function getChannelLabel(channel: string | null): string {
  const normalized = String(channel || "").toLowerCase();

  if (normalized.includes("voice") || normalized.includes("voz")) {
    return "Voice";
  }

  if (normalized.includes("whatsapp") || normalized.startsWith("wa")) {
    return "WhatsApp";
  }

  if (normalized.includes("instagram") || normalized === "ig") {
    return "Instagram";
  }

  if (normalized.includes("facebook") || normalized === "fb") {
    return "Facebook";
  }

  return channel || "Otro";
}

function InfoCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="mt-1 break-words text-lg font-bold text-gray-900">
            {value}
          </div>

          {subtitle ? (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useI18n();

  const [data, setData] = useState<ContactDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const contactId = String(params?.id || "").trim();

  const translate = useCallback(
    (key: string, fallback: string): string => {
      const translated = t(key);

      return translated && translated !== key ? translated : fallback;
    },
    [t]
  );

  const loadContact = useCallback(async () => {
    if (!contactId) {
      setError(
        translate(
          "contactDetail.errors.invalidId",
          "El contacto solicitado no es válido."
        )
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/contactos/crm/${encodeURIComponent(contactId)}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = (await response.json()) as ContactDetailResponse;

      if (!response.ok || !json.ok) {
        throw new Error(
          json.error ||
            translate(
              "contactDetail.errors.load",
              "No se pudo cargar el contacto."
            )
        );
      }

      setData(json);
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : translate(
              "contactDetail.errors.load",
              "No se pudo cargar el contacto."
            )
      );
    } finally {
      setLoading(false);
    }
  }, [contactId, translate]);

  useEffect(() => {
    void loadContact();
  }, [loadContact]);

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!data) return [];

    const messageItems: TimelineItem[] = data.messages.map((message) => ({
      id: `message:${message.id}`,
      type: "message",
      timestamp: message.timestamp,
      channel: getChannelLabel(message.canal),
      title:
        message.role === "assistant"
          ? translate("contactDetail.timeline.assistant", "Aamy respondió")
          : translate("contactDetail.timeline.customer", "Mensaje del cliente"),
      description: message.content,
      role: message.role,
    }));

    const appointmentItems: TimelineItem[] = data.appointments.map(
      (appointment) => ({
        id: `appointment:${appointment.id}`,
        type: "appointment",
        timestamp: appointment.start_time || appointment.created_at || "",
        channel: getChannelLabel(appointment.channel),
        title: translate(
          "contactDetail.timeline.appointment",
          "Cita registrada"
        ),
        description:
          appointment.service_name ||
          translate(
            "contactDetail.timeline.serviceUnavailable",
            "Servicio no especificado"
          ),
        status: appointment.status,
      })
    );

    return [...messageItems, ...appointmentItems]
      .filter((item) => Boolean(item.timestamp))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [data, translate]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
          {translate("contactDetail.loading", "Cargando contacto...")}
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => router.push("/dashboard/contacts")}
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900"
          >
            <FiArrowLeft />
            {translate("contactDetail.back", "Volver a contactos")}
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error ||
              translate(
                "contactDetail.errors.load",
                "No se pudo cargar el contacto."
              )}
          </div>
        </div>
      </main>
    );
  }

  const { contact } = data;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard/contacts")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900"
        >
          <FiArrowLeft />
          {translate("contactDetail.back", "Volver a contactos")}
        </button>

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-2xl font-bold text-purple-800">
                {(contact.nombre || contact.telefono || "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {contact.nombre ||
                      translate("contacts.unnamed", "Sin nombre")}
                  </h1>

                  <span
                    className={[
                      "inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize",
                      getStateClasses(contact.estado_cliente),
                    ].join(" ")}
                  >
                    {contact.estado_cliente}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <FiPhone />
                    {contact.telefono || "—"}
                  </p>

                  <p className="flex items-center gap-2">
                    <FiMail />
                    {contact.email || "—"}
                  </p>

                  <p className="flex items-center gap-2">
                    <FiUser />
                    {getChannelLabel(contact.origen)} ·{" "}
                    {contact.idioma || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p className="font-medium text-gray-800">
                {translate(
                  "contactDetail.lastInteraction",
                  "Última interacción"
                )}
              </p>
              <p className="mt-1">
                {formatDateTime(
                  contact.ultima_interaccion_at ||
                    contact.ultima_llamada ||
                    contact.updated_at,
                  lang
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            title={translate("contactDetail.calls", "Llamadas")}
            value={contact.llamadas}
            icon={<FiPhone />}
          />

          <InfoCard
            title={translate("contactDetail.bookings", "Reservas")}
            value={contact.reservas}
            icon={<FiCalendar />}
          />

          <InfoCard
            title={translate(
              "contactDetail.nextAppointment",
              "Próxima cita"
            )}
            value={formatDateTime(contact.proxima_cita_at, lang)}
            icon={<FiClock />}
          />

          <InfoCard
            title={translate(
              "contactDetail.generatedValue",
              "Valor generado"
            )}
            value={formatMoney(contact.valor_generado, lang)}
            icon={<FiDollarSign />}
          />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                {translate(
                  "contactDetail.aiSummary",
                  "Resumen inteligente"
                )}
              </h2>

              {contact.resumen_ia ? (
                <p className="mt-4 whitespace-pre-wrap leading-7 text-gray-700">
                  {contact.resumen_ia}
                </p>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
                  <p className="font-medium text-gray-700">
                    {translate(
                      "contactDetail.noAiSummary",
                      "Todavía no hay un resumen generado."
                    )}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {translate(
                      "contactDetail.noAiSummaryHint",
                      "El resumen aparecerá cuando se implemente el análisis automático del historial."
                    )}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {translate(
                    "contactDetail.timeline.title",
                    "Historial del cliente"
                  )}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {translate(
                    "contactDetail.timeline.subtitle",
                    "Mensajes, llamadas y citas ordenados por fecha."
                  )}
                </p>
              </div>

              {timeline.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {translate(
                    "contactDetail.timeline.empty",
                    "No hay actividad registrada para este contacto."
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {timeline.map((item) => (
                    <article key={item.id} className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={[
                            "mt-1 rounded-xl p-3",
                            item.type === "appointment"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.role === "assistant"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700",
                          ].join(" ")}
                        >
                          {item.type === "appointment" ? (
                            <FiCalendar />
                          ) : (
                            <FiMessageSquare />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-bold text-gray-900">
                              {item.title}
                            </p>

                            <p className="text-xs text-gray-500">
                              {formatDateTime(item.timestamp, lang)}
                            </p>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                              {item.channel}
                            </span>

                            {item.status ? (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold capitalize text-gray-600">
                                {item.status}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                {translate(
                  "contactDetail.customerDetails",
                  "Detalles del cliente"
                )}
              </h2>

              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">
                    {translate(
                      "contactDetail.lastService",
                      "Último servicio"
                    )}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {contact.ultimo_servicio || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="font-medium text-gray-500">
                    {translate(
                      "contactDetail.firstCall",
                      "Primera llamada"
                    )}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {formatDateTime(contact.primera_llamada, lang)}
                  </dd>
                </div>

                <div>
                  <dt className="font-medium text-gray-500">
                    {translate(
                      "contactDetail.lastBooking",
                      "Última reserva"
                    )}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {formatDateTime(
                      contact.ultima_reserva_at ||
                        contact.ultima_cita,
                      lang
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="font-medium text-gray-500">
                    {translate(
                      "contactDetail.createdAt",
                      "Creado"
                    )}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {formatDateTime(contact.fecha_creacion, lang)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                {translate(
                  "contactDetail.marketingConsent",
                  "Consentimiento"
                )}
              </h2>

              <div className="mt-5 flex items-center gap-3">
                <div
                  className={[
                    "rounded-xl p-3",
                    contact.marketing_opt_in
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500",
                  ].join(" ")}
                >
                  <FiCheckCircle />
                </div>

                <div>
                  <p className="font-bold text-gray-900">
                    {contact.marketing_opt_in
                      ? translate(
                          "contactDetail.marketingAccepted",
                          "Aceptado"
                        )
                      : translate(
                          "contactDetail.marketingNotAccepted",
                          "No aceptado"
                        )}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {contact.opt_in_source || "—"}
                  </p>
                </div>
              </div>

              {contact.opt_in_at ? (
                <p className="mt-4 text-sm text-gray-500">
                  {formatDateTime(contact.opt_in_at, lang)}
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                {translate("contactDetail.notes", "Notas")}
              </h2>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {contact.notas ||
                  translate(
                    "contactDetail.noNotes",
                    "No hay notas registradas."
                  )}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}