//src/app/portal/appointments/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiMapPin } from "react-icons/fi";
import {
  FaFacebookMessenger,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa";
import { io, Socket } from "socket.io-client";

import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/i18n/LanguageProvider";
import FieldOperationsRouteMap from "@/components/FieldOperationsRouteMap";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "attended";

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

  service_address?: string | null;
  address?: string | null;
  customer_address?: string | null;
};

type BookingStep = {
  id?: string;
  step_key?: string;
  step_order?: number;
  enabled?: boolean;
  expected_type?: string;
  validation_config?: {
    slot?: string;
    [key: string]: unknown;
  } | null;
};

type Filters = {
  desde: string;
  hasta: string;
  canal: string;
  estado: string;
  cliente: string;
  telefono: string;
};

const EMPTY_FILTERS: Filters = {
  desde: "",
  hasta: "",
  canal: "",
  estado: "",
  cliente: "",
  telefono: "",
};

const STATUS_OPTIONS: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "attended",
];

function normalizeKey(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function bookingFlowHasAddressStep(steps: BookingStep[]): boolean {
  return steps.some((step) => {
    if (step?.enabled === false) {
      return false;
    }

    const stepKey = normalizeKey(step?.step_key);
    const slot = normalizeKey(
      step?.validation_config?.slot
    );

    return (
      stepKey === "address" ||
      stepKey === "service_address" ||
      stepKey === "customer_address" ||
      slot === "address" ||
      slot === "service_address" ||
      slot === "customer_address"
    );
  });
}

export default function PortalAppointmentsPage() {
  const { t, lang } = useI18n();

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [bookingSteps, setBookingSteps] =
    useState<BookingStep[]>([]);

  const [filters, setFilters] =
    useState<Filters>(EMPTY_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState<Filters>(EMPTY_FILTERS);

  const [loading, setLoading] = useState(true);
  const [flowLoading, setFlowLoading] = useState(true);

  const [savingId, setSavingId] =
    useState<string | null>(null);

  const [openStatusId, setOpenStatusId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const socketRef = useRef<Socket | null>(null);

  const locale = useMemo(() => {
    if (lang === "pt") return "pt-BR";
    if (lang === "es") return "es-US";

    return "en-US";
  }, [lang]);

  const hasAddressStep = useMemo(
    () => bookingFlowHasAddressStep(bookingSteps),
    [bookingSteps]
  );

  const safeAppointments = useMemo(() => {
    return Array.isArray(appointments)
      ? appointments.filter(
          (appointment) =>
            appointment &&
            typeof appointment === "object" &&
            Boolean(appointment.id)
        )
      : [];
  }, [appointments]);

  const totalPages = Math.max(
    1,
    Math.ceil(safeAppointments.length / pageSize)
    );

    const paginatedAppointments = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return safeAppointments.slice(start, end);
    }, [page, pageSize, safeAppointments]);

    const paginationStart =
    safeAppointments.length === 0
        ? 0
        : (page - 1) * pageSize + 1;

    const paginationEnd = Math.min(
    page * pageSize,
    safeAppointments.length
    );

  const statusMeta = useMemo(() => {
    return {
      pending: {
        label: t("appointments.status.pending"),
        classes:
          "border-amber-500/30 bg-amber-500/15 text-amber-300",
      },
      confirmed: {
        label: t("appointments.status.confirmed"),
        classes:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
      },
      cancelled: {
        label: t("appointments.status.cancelled"),
        classes:
          "border-red-500/30 bg-red-500/15 text-red-300",
      },
      attended: {
        label: t("appointments.status.attended"),
        classes:
          "border-sky-500/30 bg-sky-500/15 text-sky-300",
      },
    };
  }, [t]);

  function tr(
    key: string,
    vars?: Record<string, string | number>
  ): string {
    let text = t(key);

    if (!vars) {
      return text;
    }

    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(
        `{{${name}}}`,
        String(value)
      );
    }

    return text;
  }

  function formatDateTime(value: string): string {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getAppointmentAddress(
    appointment: Appointment
  ): string | null {
    return (
      appointment.service_address ||
      appointment.customer_address ||
      appointment.address ||
      null
    );
  }

  function getChannelBadge(channel: string) {
    const normalized = normalizeKey(channel);

    if (normalized.includes("whatsapp")) {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
          <FaWhatsapp />
          WhatsApp
        </span>
      );
    }

    if (normalized.includes("facebook")) {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300">
          <FaFacebookMessenger />
          Facebook
        </span>
      );
    }

    if (normalized.includes("instagram")) {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-pink-500/15 px-3 py-1 text-xs font-semibold text-pink-300">
          <FaInstagram />
          Instagram
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
        {channel || t("appointments.channel.other")}
      </span>
    );
  }

  async function loadBookingFlow() {
    setFlowLoading(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/appointment-booking-flow`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || `HTTP ${response.status}`
        );
      }

      setBookingSteps(
        Array.isArray(data?.steps)
          ? data.steps
          : []
      );
    } catch (loadError) {
      console.error(
        "[PORTAL_APPOINTMENTS][BOOKING_FLOW_LOAD_FAILED]",
        loadError
      );

      /*
       * Si no se puede confirmar que existe el step
       * de dirección, el mapa permanece oculto.
       */
      setBookingSteps([]);
    } finally {
      setFlowLoading(false);
    }
  }

  async function loadAppointments() {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();

      if (appliedFilters.desde) {
        query.set("desde", appliedFilters.desde);
      }

      if (appliedFilters.hasta) {
        query.set("hasta", appliedFilters.hasta);
      }

      if (appliedFilters.canal) {
        query.set("canal", appliedFilters.canal);
      }

      if (appliedFilters.estado) {
        query.set("estado", appliedFilters.estado);
      }

      if (appliedFilters.cliente) {
        query.set("cliente", appliedFilters.cliente);
      }

      if (appliedFilters.telefono) {
        query.set(
          "telefono",
          appliedFilters.telefono
        );
      }

      const suffix = query.toString()
        ? `?${query.toString()}`
        : "";

      const response = await fetch(
        `${BACKEND_URL}/api/appointments${suffix}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            t("appointments.errors.load")
        );
      }

      setAppointments(
        Array.isArray(data?.appointments)
          ? data.appointments
          : []
      );
    } catch (loadError) {
      console.error(
        "[PORTAL_APPOINTMENTS][LOAD_FAILED]",
        loadError
      );

      setAppointments([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : t("appointments.errors.load")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeStatus(
    appointmentId: string,
    status: AppointmentStatus
  ) {
    setSavingId(appointmentId);
    setError(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/appointments/${appointmentId}/status`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            t("appointments.errors.statusUpdate")
        );
      }

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId
            ? data.appointment
            : appointment
        )
      );

      setOpenStatusId(null);
    } catch (saveError) {
      console.error(
        "[PORTAL_APPOINTMENTS][STATUS_UPDATE_FAILED]",
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : t("appointments.errors.statusUpdate")
      );
    } finally {
      setSavingId(null);
    }
  }

  function applyFilters() {
    setPage(1);
    setAppliedFilters(filters);
  }

  function clearFilters() {
    setPage(1);
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  }

  useEffect(() => {
    void loadBookingFlow();
  }, []);

  useEffect(() => {
    void loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("appointment:new", (payload: unknown) => {
      const candidate =
        (payload as any)?.appointment ?? payload;

      if (
        !candidate ||
        typeof candidate !== "object" ||
        !(candidate as any).id
      ) {
        return;
      }

      const newAppointment =
        candidate as Appointment;

      setAppointments((current) => {
        if (
          current.some(
            (appointment) =>
              appointment.id === newAppointment.id
          )
        ) {
          return current;
        }

        return [newAppointment, ...current];
      });
    });

    return () => {
      socket.off("appointment:new");
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-purple-300">
          {t("portal.navigation.appointments")}
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {t("appointments.title")}
        </h1>

        <p className="mt-2 text-sm text-white/50">
          {t("portal.appointments.description")}
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!flowLoading && hasAddressStep ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <FiMapPin className="text-purple-300" />

            <div>
              <h2 className="font-semibold">
                {t("portal.appointments.routes.title")}
              </h2>

              <p className="text-sm text-white/45">
                {t(
                  "portal.appointments.routes.description"
                )}
              </p>
            </div>
          </div>

          <FieldOperationsRouteMap lang={lang} />
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div>
            <label className="mb-1 block text-xs text-white/55">
              {t("appointments.filters.from")}
            </label>

            <input
              type="datetime-local"
              value={filters.desde}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  desde: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/55">
              {t("appointments.filters.to")}
            </label>

            <input
              type="datetime-local"
              value={filters.hasta}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  hasta: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/55">
              {t("appointments.filters.channel")}
            </label>

            <select
              value={filters.canal}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  canal: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
            >
              <option value="">
                {t("appointments.filters.all")}
              </option>
              <option value="voice">
                {t("dashboard.channels.voice")}
              </option>
              <option value="whatsapp">
                WhatsApp
              </option>
              <option value="instagram">
                Instagram
              </option>
              <option value="facebook">
                Facebook
              </option>
              <option value="manual">
                {t("appointments.filters.manual")}
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/55">
              {t("appointments.filters.status")}
            </label>

            <select
              value={filters.estado}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  estado: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
            >
              <option value="">
                {t("appointments.filters.all")}
              </option>

              {STATUS_OPTIONS.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {statusMeta[status].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/55">
              {t("appointments.filters.customer")}
            </label>

            <input
              type="text"
              value={filters.cliente}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  cliente: event.target.value,
                }))
              }
              placeholder={t(
                "appointments.filters.searchPlaceholder"
              )}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/55">
              {t("appointments.filters.phone")}
            </label>

            <input
              type="text"
              value={filters.telefono}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  telefono: event.target.value,
                }))
              }
              placeholder={t(
                "appointments.filters.phonePlaceholder"
              )}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"
          >
            {t("appointments.filters.clear")}
          </button>

          <button
            type="button"
            onClick={applyFilters}
            className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold hover:bg-purple-500"
          >
            {t("appointments.filters.apply")}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-bold">
            {t("appointments.cards.history.title")}
          </h2>

          <p className="mt-1 text-sm text-white/45">
            {tr(
              "appointments.cards.history.subtitle",
              {
                count: safeAppointments.length,
              }
            )}
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-white/50">
            {t("appointments.loading")}
          </div>
        ) : null}

        {!loading && safeAppointments.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/50">
            {t("appointments.empty")}
          </div>
        ) : null}

        {!loading && safeAppointments.length > 0 ? (
          <>
            <div className="space-y-3 p-3 sm:hidden">
              {paginatedAppointments.map((appointment) => {
                const meta =
                  statusMeta[appointment.status] ||
                  statusMeta.pending;

                const address =
                  getAppointmentAddress(appointment);

                return (
                  <article
                    key={appointment.id}
                    className="rounded-2xl border border-white/10 bg-black/15 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {formatDateTime(
                            appointment.start_time
                          )}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {appointment.service_name ||
                            "—"}
                        </p>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenStatusId(
                              openStatusId ===
                                appointment.id
                                ? null
                                : appointment.id
                            )
                          }
                          disabled={
                            savingId === appointment.id
                          }
                          className={[
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                            meta.classes,
                          ].join(" ")}
                        >
                          {meta.label}
                          <FiChevronDown />
                        </button>

                        {openStatusId ===
                        appointment.id ? (
                          <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#11101c] shadow-2xl">
                            {STATUS_OPTIONS.map(
                              (status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() =>
                                    void handleChangeStatus(
                                      appointment.id,
                                      status
                                    )
                                  }
                                  className="block w-full px-4 py-2.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white"
                                >
                                  {
                                    statusMeta[status]
                                      .label
                                  }
                                </button>
                              )
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4">
                      {getChannelBadge(
                        appointment.channel
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <span className="text-white/45">
                          {t(
                            "appointments.table.customer"
                          )}
                          :
                        </span>{" "}
                        {appointment.customer_name ||
                          t(
                            "appointments.customer.unnamed"
                          )}
                      </p>

                      <p>
                        <span className="text-white/45">
                          {t(
                            "appointments.table.phone"
                          )}
                          :
                        </span>{" "}
                        {appointment.customer_phone ||
                          "—"}
                      </p>

                      {hasAddressStep && address ? (
                        <p className="flex items-start gap-2">
                          <FiMapPin className="mt-0.5 shrink-0 text-purple-300" />
                          <span>{address}</span>
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full">
                <thead className="border-b border-white/10 bg-white/[0.025]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">
                      {t(
                        "appointments.table.datetime"
                      )}
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">
                      {t(
                        "appointments.table.channel"
                      )}
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">
                      {t(
                        "appointments.table.customer"
                      )}
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">
                      {t(
                        "appointments.table.phone"
                      )}
                    </th>

                    {hasAddressStep ? (
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">
                        {t(
                          "portal.appointments.address"
                        )}
                      </th>
                    ) : null}

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/45">
                      {t(
                        "appointments.table.status"
                      )}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {paginatedAppointments.map(
                    (appointment) => {
                      const meta =
                        statusMeta[
                          appointment.status
                        ] || statusMeta.pending;

                      const address =
                        getAppointmentAddress(
                          appointment
                        );

                      return (
                        <tr
                          key={appointment.id}
                          className="hover:bg-white/[0.025]"
                        >
                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="font-medium">
                              {formatDateTime(
                                appointment.start_time
                              )}
                            </p>

                            <p className="mt-1 text-xs text-white/40">
                              {appointment.service_name ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            {getChannelBadge(
                              appointment.channel
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium">
                              {appointment.customer_name ||
                                t(
                                  "appointments.customer.unnamed"
                                )}
                            </p>

                            <p className="mt-1 max-w-[260px] truncate text-xs text-white/35">
                              {appointment.customer_email ||
                                appointment.id}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            {appointment.customer_phone ||
                              "—"}
                          </td>

                          {hasAddressStep ? (
                            <td className="max-w-[320px] px-5 py-4">
                              {address ? (
                                <div className="flex items-start gap-2">
                                  <FiMapPin className="mt-0.5 shrink-0 text-purple-300" />
                                  <span className="text-sm text-white/70">
                                    {address}
                                  </span>
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                          ) : null}

                          <td className="px-5 py-4 text-right">
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenStatusId(
                                    openStatusId ===
                                      appointment.id
                                      ? null
                                      : appointment.id
                                  )
                                }
                                disabled={
                                  savingId ===
                                  appointment.id
                                }
                                className={[
                                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                                  meta.classes,
                                ].join(" ")}
                              >
                                {meta.label}
                                <FiChevronDown />
                              </button>

                              {openStatusId ===
                              appointment.id ? (
                                <div className="absolute bottom-[calc(100%+8px)] right-0 z-30 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#11101c] shadow-2xl">
                                  {STATUS_OPTIONS.map(
                                    (status) => (
                                      <button
                                        key={status}
                                        type="button"
                                        onClick={() =>
                                          void handleChangeStatus(
                                            appointment.id,
                                            status
                                          )
                                        }
                                        className="block w-full px-4 py-2.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white"
                                      >
                                        {
                                          statusMeta[
                                            status
                                          ].label
                                        }
                                      </button>
                                    )
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
                        <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-white/50">
                {paginationStart}-{paginationEnd} /{" "}
                {safeAppointments.length}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-sm text-white/50">
                  <span>
                    {t(
                      "portal.appointments.pagination.perPage"
                    )}
                  </span>

                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(
                        Number(event.target.value)
                      );
                      setPage(1);
                    }}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-purple-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.max(1, current - 1)
                      )
                    }
                    disabled={page <= 1}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {t(
                      "portal.appointments.pagination.previous"
                    )}
                  </button>

                  <span className="min-w-[80px] text-center text-sm text-white/60">
                    {page} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(
                          totalPages,
                          current + 1
                        )
                      )
                    }
                    disabled={page >= totalPages}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {t(
                      "portal.appointments.pagination.next"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}