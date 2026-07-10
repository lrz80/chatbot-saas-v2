//src/app/dashboard/contacts/page.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/i18n/LanguageProvider";
import { useRouter } from "next/navigation";

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
  fecha_creacion: string | null;
  updated_at: string | null;
};

type ContactsResponse = {
  ok: boolean;
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    leads: number;
    clientes: number;
    recurrentes: number;
    marketingOptIn: number;
  };
  error?: string;
};

type Filters = {
  q: string;
  estado: string;
  origen: string;
  marketing: string;
};

const INITIAL_FILTERS: Filters = {
  q: "",
  estado: "todos",
  origen: "todos",
  marketing: "todos",
};

function buildQueryString(params: {
  filters: Filters;
  page?: number;
  limit?: number;
}): string {
  const searchParams = new URLSearchParams();

  const q = params.filters.q.trim();

  if (q) searchParams.set("q", q);

  if (params.filters.estado !== "todos") {
    searchParams.set("estado", params.filters.estado);
  }

  if (params.filters.origen !== "todos") {
    searchParams.set("origen", params.filters.origen);
  }

  if (params.filters.marketing !== "todos") {
    searchParams.set("marketing", params.filters.marketing);
  }

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  return searchParams.toString();
}

function formatDateTime(
  value: string | null,
  lang: string
): string {
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

function formatMoney(
  value: string | number,
  lang: string
): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0.00";
  }

  return new Intl.NumberFormat(
    lang === "en" ? "en-US" : "es-US",
    {
      style: "currency",
      currency: "USD",
    }
  ).format(amount);
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

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const { t, lang } = useI18n();

  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<Filters>(INITIAL_FILTERS);

  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  const [stats, setStats] = useState({
    total: 0,
    leads: 0,
    clientes: 0,
    recurrentes: 0,
    marketingOptIn: 0,
  });

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const translate = useCallback(
    (key: string, fallback: string): string => {
      const translated = t(key);
      return translated && translated !== key
        ? translated
        : fallback;
    },
    [t]
  );

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = buildQueryString({
        filters: appliedFilters,
        page,
        limit,
      });

      const response = await fetch(
        `${BACKEND_URL}/api/contactos/crm?${query}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = (await response.json()) as ContactsResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            translate(
              "contacts.errors.load",
              "No se pudieron cargar los contactos."
            )
        );
      }

      setContacts(Array.isArray(data.contacts) ? data.contacts : []);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (err) {
      setContacts([]);
      setError(
        err instanceof Error
          ? err.message
          : translate(
              "contacts.errors.load",
              "No se pudieron cargar los contactos."
            )
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, limit, page, translate]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  function applyFilters() {
    setPage(1);
    setAppliedFilters(filters);
  }

  function clearFilters() {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setPage(1);
  }

  async function exportCsv() {
    setExporting(true);
    setError("");

    try {
      const query = buildQueryString({
        filters: appliedFilters,
      });

      const response = await fetch(
        `${BACKEND_URL}/api/contactos/crm/export?${query}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.error ||
            translate(
              "contacts.errors.export",
              "No se pudo exportar el archivo."
            )
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);

      anchor.href = url;
      anchor.download = `contactos-${date}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : translate(
              "contacts.errors.export",
              "No se pudo exportar el archivo."
            )
      );
    } finally {
      setExporting(false);
    }
  }

  const showingLabel = useMemo(() => {
    if (pagination.total === 0) {
      return translate("contacts.pagination.empty", "0 contactos");
    }

    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(
      pagination.page * pagination.limit,
      pagination.total
    );

    return `${start}-${end} ${translate(
      "contacts.pagination.of",
      "de"
    )} ${pagination.total}`;
  }, [pagination, translate]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {translate("contacts.title", "Contactos")}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {translate(
                "contacts.subtitle",
                "Consulta, filtra y exporta los clientes capturados por Aamy."
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiDownload />

            {exporting
              ? translate("contacts.exporting", "Exportando...")
              : translate("contacts.exportCsv", "Exportar CSV")}
          </button>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title={translate("contacts.stats.total", "Total")}
            value={stats.total}
            icon={<FiUsers />}
          />

          <StatCard
            title={translate("contacts.stats.leads", "Leads")}
            value={stats.leads}
            icon={<FiPhone />}
          />

          <StatCard
            title={translate("contacts.stats.clients", "Clientes")}
            value={stats.clientes}
            icon={<FiUserCheck />}
          />

          <StatCard
            title={translate(
              "contacts.stats.recurring",
              "Recurrentes"
            )}
            value={stats.recurrentes}
            icon={<FiRefreshCw />}
          />

          <StatCard
            title={translate(
              "contacts.stats.marketing",
              "Marketing opt-in"
            )}
            value={stats.marketingOptIn}
            icon={<FiUserCheck />}
          />
        </section>

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {translate("contacts.filters.search", "Buscar")}
              </label>

              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  value={filters.q}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      q: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      applyFilters();
                    }
                  }}
                  placeholder={translate(
                    "contacts.filters.searchPlaceholder",
                    "Nombre, teléfono, email o servicio"
                  )}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-gray-900 outline-none focus:border-gray-900"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {translate("contacts.filters.state", "Estado")}
              </label>

              <select
                value={filters.estado}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    estado: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-gray-900"
              >
                <option value="todos">
                  {translate("contacts.filters.all", "Todos")}
                </option>
                <option value="lead">
                  {translate("contacts.states.lead", "Lead")}
                </option>
                <option value="cliente">
                  {translate("contacts.states.client", "Cliente")}
                </option>
                <option value="recurrente">
                  {translate(
                    "contacts.states.recurring",
                    "Recurrente"
                  )}
                </option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {translate("contacts.filters.source", "Origen")}
              </label>

              <select
                value={filters.origen}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    origen: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-gray-900"
              >
                <option value="todos">
                  {translate("contacts.filters.all", "Todos")}
                </option>
                <option value="voice">Voice</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="csv_upload">CSV</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {translate(
                  "contacts.filters.marketing",
                  "Consentimiento de marketing"
                )}
              </label>

              <select
                value={filters.marketing}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    marketing: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-gray-900"
              >
                <option value="todos">
                  {translate("contacts.filters.all", "Todos")}
                </option>
                <option value="true">
                  {translate("contacts.common.yes", "Sí")}
                </option>
                <option value="false">
                  {translate("contacts.common.no", "No")}
                </option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              {translate(
                "contacts.filters.clear",
                "Limpiar filtros"
              )}
            </button>

            <button
              type="button"
              onClick={applyFilters}
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800"
            >
              {translate(
                "contacts.filters.apply",
                "Aplicar filtros"
              )}
            </button>
          </div>
        </section>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-gray-500">
              {translate("contacts.loading", "Cargando contactos...")}
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-gray-800">
                {translate(
                  "contacts.empty.title",
                  "No se encontraron contactos"
                )}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {translate(
                  "contacts.empty.subtitle",
                  "Prueba cambiando los filtros o realiza una llamada de prueba."
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        translate("contacts.columns.contact", "Contacto"),
                        translate("contacts.columns.state", "Estado"),
                        translate("contacts.columns.source", "Origen"),
                        translate("contacts.columns.activity", "Actividad"),
                        translate("contacts.columns.service", "Servicio"),
                        translate(
                          "contacts.columns.nextAppointment",
                          "Próxima cita"
                        ),
                        translate(
                          "contacts.columns.marketing",
                          "Marketing"
                        ),
                      ].map((label) => (
                        <th
                          key={label}
                          className="whitespace-nowrap px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {contacts.map((contact) => (
                      <tr
                        key={contact.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(`/dashboard/contacts/${contact.id}`);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-purple-50 focus:bg-purple-50 focus:outline-none"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            {contact.nombre ||
                              translate(
                                "contacts.unnamed",
                                "Sin nombre"
                              )}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {contact.telefono || "—"}
                          </p>

                          {contact.email ? (
                            <p className="mt-1 text-xs text-gray-400">
                              {contact.email}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize",
                              getStateClasses(contact.estado_cliente),
                            ].join(" ")}
                          >
                            {contact.estado_cliente}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium capitalize text-gray-800">
                            {contact.origen || "—"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {contact.idioma || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-800">
                            {contact.llamadas}{" "}
                            {translate(
                              "contacts.activity.calls",
                              "llamadas"
                            )}
                          </p>

                          <p className="mt-1 text-sm text-gray-800">
                            {contact.reservas}{" "}
                            {translate(
                              "contacts.activity.bookings",
                              "reservas"
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatMoney(
                              contact.valor_generado,
                              lang
                            )}
                          </p>
                        </td>

                        <td className="max-w-[220px] px-5 py-4">
                          <p className="truncate text-sm text-gray-800">
                            {contact.ultimo_servicio || "—"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatDateTime(
                              contact.ultima_interaccion_at ||
                                contact.ultima_llamada,
                              lang
                            )}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                          {formatDateTime(
                            contact.proxima_cita_at,
                            lang
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                              contact.marketing_opt_in
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-600",
                            ].join(" ")}
                          >
                            {contact.marketing_opt_in
                              ? translate(
                                  "contacts.common.yes",
                                  "Sí"
                                )
                              : translate(
                                  "contacts.common.no",
                                  "No"
                                )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  {showingLabel}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FiChevronLeft />
                    {translate(
                      "contacts.pagination.previous",
                      "Anterior"
                    )}
                  </button>

                  <span className="px-2 text-sm font-medium text-gray-700">
                    {pagination.page} / {pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      pagination.page >= pagination.totalPages
                    }
                    onClick={() =>
                      setPage((current) =>
                        Math.min(
                          pagination.totalPages,
                          current + 1
                        )
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {translate(
                      "contacts.pagination.next",
                      "Siguiente"
                    )}
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}