//src/app/dashboard/services/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/utils/api";

/** ===== Types ===== */
type ServiceVariant = {
  id: string;
  service_id: string;
  variant_name: string;
  description: string | null;
  price_base: number | null;      // ajusta si tu DB usa price_from
  duration_min: number | null;
  variant_url: string | null;
  active: boolean;
  sort_order?: number | null;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_min: number | null;
  price_base: number | null;
  active: boolean;
  service_url: string | null;

  variants?: ServiceVariant[]; // ✅ viene del backend
};

type VariantDraft = {
  id?: string; // si existe, es variante en DB
  variant_name: string;
  description: string;
  price_base: string;      // input text -> number
  duration_min: string;    // input text -> number
  variant_url: string;
  active: boolean;
  sort_order: string;      // input text -> number
  _delete?: boolean;       // marcar para borrar
};

type ServiceDraft = {
  id?: string;
  name: string;
  description: string;
  category: string;
  duration_min: string; // input text -> number
  price_base: string;   // input text -> number
  service_url: string;
  active: boolean;

  variants: VariantDraft[]; // ✅ NEW
};

function toVariantDraft(v?: ServiceVariant | null): VariantDraft {
  return {
    id: v?.id,
    variant_name: v?.variant_name || "",
    description: v?.description || "",
    price_base: v?.price_base != null ? String(v.price_base) : "",
    duration_min: v?.duration_min != null ? String(v.duration_min) : "",
    variant_url: v?.variant_url || "",
    active: v?.active ?? true,
    sort_order: v?.sort_order != null ? String(v.sort_order) : "0",
  };
}

function toDraft(s?: Service | null): ServiceDraft {
  return {
    id: s?.id,
    name: s?.name || "",
    description: s?.description || "",
    category: s?.category || "",
    duration_min: s?.duration_min != null ? String(s.duration_min) : "",
    price_base: s?.price_base != null ? String(s.price_base) : "",
    service_url: s?.service_url || "",
    active: s?.active ?? true,

    variants: Array.isArray(s?.variants)
      ? s!.variants!.map((v) => toVariantDraft(v))
      : [],
  };
}

function numOrNull(v: string): number | null {
  const t = String(v || "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function intOrNull(v: string): number | null {
  const t = String(v || "").trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function cleanUrl(v: string): string | null {
  const t = String(v || "").trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return t;
  } catch {
    return null;
  }
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* panel */}
      <div
        className={[
          "relative w-[92vw] max-w-3xl",
          "rounded-2xl bg-white text-black shadow-xl",
          // ✅ altura máxima y layout flex para scroll interno
          "max-h-[92dvh] flex flex-col",
        ].join(" ")}
      >
        {/* header sticky */}
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between border-b px-5 py-4 rounded-t-2xl">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="px-3 py-1 rounded-md border text-sm">
            Cerrar
          </button>
        </div>

        {/* body scroll */}
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  // filtros UI
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState(true);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ServiceDraft>(toDraft(null));

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/services`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`GET /api/services failed: ${res.status} ${t}`);
      }

      const data = await res.json();
      const list = Array.isArray(data?.services) ? data.services : [];
      setServices(list);
    } catch (e: any) {
      setError(e?.message || "Error cargando servicios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) {
      const c = (s.category || "").trim();
      if (c) set.add(c);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [services]);

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();

    return services.filter((s) => {
      if (activeOnly && !s.active) return false;
      if (category !== "all" && (s.category || "").trim() !== category) return false;

      if (!qn) return true;
      const hay = `${s.name} ${s.description || ""} ${s.category || ""}`.toLowerCase();
      return hay.includes(qn);
    });
  }, [services, q, category, activeOnly]);

  function openCreate() {
    setDraft(toDraft(null));
    setModalOpen(true);
  }

  function openEdit(s: Service) {
    setDraft(toDraft(s));
    setModalOpen(true);
  }

  function addVariantRow() {
    setDraft((d) => ({
      ...d,
      variants: [
        ...d.variants,
        {
          variant_name: "",
          description: "",
          price_base: "",
          duration_min: "",
          variant_url: "",
          active: true,
          sort_order: "0",
        },
      ],
    }));
  }

  function markVariantDelete(idx: number) {
    setDraft((d) => {
      const copy = [...d.variants];
      const v = copy[idx];

      // si es nueva y no existe en DB, la removemos del array
      if (!v?.id) {
        copy.splice(idx, 1);
        return { ...d, variants: copy };
      }

      copy[idx] = { ...v, _delete: true };
      return { ...d, variants: copy };
    });
  }

  function undoVariantDelete(idx: number) {
    setDraft((d) => {
      const copy = [...d.variants];
      const v = copy[idx];
      if (!v) return d;
      copy[idx] = { ...v, _delete: false };
      return { ...d, variants: copy };
    });
  }

  async function saveDraft() {
    setError(null);

    const name = draft.name.trim();
    if (!name) return setError("El nombre es requerido.");

    const serviceUrl = cleanUrl(draft.service_url);
    if (draft.service_url.trim() && !serviceUrl) {
      return setError("El link del servicio debe ser una URL válida (http/https).");
    }

    // Validación de variantes (solo las NO borradas)
    const aliveVariants = draft.variants.filter((v) => !v._delete);
    for (const [i, v] of aliveVariants.entries()) {
      const vn = v.variant_name.trim();
      if (!vn) continue; // permitimos filas vacías, se ignoran
      const vurl = cleanUrl(v.variant_url);
      if (v.variant_url.trim() && !vurl) {
        return setError(`Variante #${i + 1}: el link debe ser URL válida (http/https).`);
      }
    }

    const payloadService = {
      name,
      description: draft.description.trim() || null,
      category: draft.category.trim() || null,
      duration_min: numOrNull(draft.duration_min),
      price_base: numOrNull(draft.price_base),
      active: !!draft.active,
      service_url: serviceUrl,
    };

    setSaving(true);
    try {
      const isEdit = !!draft.id;

      // 1) Guardar servicio
      let serviceId = draft.id;

      if (!isEdit) {
        const res = await fetch(`${BACKEND_URL}/api/services`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadService),
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`POST services failed: ${res.status} ${t}`);
        }

        const data = await res.json();
        serviceId = data?.service?.id;
        if (!serviceId) throw new Error("No se recibió service.id del backend");
      } else {
        const res = await fetch(`${BACKEND_URL}/api/services/${serviceId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadService),
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`PUT services failed: ${res.status} ${t}`);
        }
      }

      // 2) Aplicar cambios de variantes (si existen)
      // Borrados (solo si existían)
      for (const v of draft.variants) {
        if (v._delete && v.id) {
          const del = await fetch(
            `${BACKEND_URL}/api/services/${serviceId}/variants/${v.id}`,
            { method: "DELETE", credentials: "include" }
          );
          if (!del.ok) {
            const t = await del.text();
            throw new Error(`DELETE variant failed: ${del.status} ${t}`);
          }
        }
      }

      // Upserts (crear o actualizar)
      for (const v of draft.variants) {
        if (v._delete) continue;

        const vn = v.variant_name.trim();
        if (!vn) continue; // ignorar filas vacías

        const vurl = cleanUrl(v.variant_url);
        if (v.variant_url.trim() && !vurl) {
          throw new Error(`Variante "${vn}": URL inválida (http/https).`);
        }

        const payloadVariant = {
          variant_name: vn,
          description: v.description.trim() || null,
          price_base: numOrNull(v.price_base),      // ajusta si tu backend espera price_from
          duration_min: numOrNull(v.duration_min),
          variant_url: vurl,
          active: !!v.active,
          sort_order: intOrNull(v.sort_order) ?? 0,
        };

        if (v.id) {
          const up = await fetch(
            `${BACKEND_URL}/api/services/${serviceId}/variants/${v.id}`,
            {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payloadVariant),
            }
          );
          if (!up.ok) {
            const t = await up.text();
            throw new Error(`PUT variant failed: ${up.status} ${t}`);
          }
        } else {
          const cr = await fetch(`${BACKEND_URL}/api/services/${serviceId}/variants`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadVariant),
          });
          if (!cr.ok) {
            const t = await cr.text();
            throw new Error(`POST variant failed: ${cr.status} ${t}`);
          }
        }
      }

      setModalOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error guardando servicio/variantes");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: Service) {
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/services/${s.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !s.active }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`PATCH active failed: ${res.status} ${t}`);
      }
      await load();
    } catch (e: any) {
      setError(e?.message || "Error actualizando estado");
    }
  }

  async function deleteService(s: Service) {
    const ok = confirm(`¿Eliminar "${s.name}"? (Recomendado: desactivar)`);
    if (!ok) return;

    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/services/${s.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`DELETE failed: ${res.status} ${t}`);
      }
      await load();
    } catch (e: any) {
      setError(e?.message || "Error eliminando servicio");
    }
  }

  function renderPriceCell(s: Service) {
    const vcount = Array.isArray(s.variants) ? s.variants.length : 0;
    if (typeof s.price_base === "number") return `$${s.price_base}`;
    if (vcount > 0) return "Por variante";
    return "-";
  }

  function renderDurationCell(s: Service) {
    const vcount = Array.isArray(s.variants) ? s.variants.length : 0;
    if (typeof s.duration_min === "number") return `${s.duration_min} min`;
    if (vcount > 0) return "Por variante";
    return "-";
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Servicios</h1>
          <p className="text-sm opacity-70">
            Agrega/edita servicios aquí. Puedes definir variantes (ej: Long Hair / Short Hair) con precios distintos.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={openCreate} className="px-4 py-2 rounded-md bg-black text-white">
            + Nuevo servicio
          </button>

          <button
            onClick={() => alert("CSV: lo activamos después")}
            className="px-4 py-2 rounded-md border"
          >
            Importar CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, categoría o descripción…"
          className="border rounded-md px-3 py-2 w-full sm:w-[420px]"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "Todas las categorías" : c}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Solo activos
        </label>

        <button
          onClick={load}
          className="px-3 py-2 rounded-md border text-sm"
          disabled={loading}
        >
          {loading ? "Cargando…" : "Refrescar"}
        </button>
      </div>

      {error && (
        <div className="border border-red-300 bg-red-50 text-red-700 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-[1020px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-3">Nombre</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Duración</th>
                <th className="p-3">Variantes</th>
                <th className="p-3">Activo</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td className="p-3" colSpan={7}>Cargando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="p-3" colSpan={7}>No hay servicios.</td></tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{s.name}</div>
                      {s.service_url ? (
                        <a
                          href={s.service_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs underline opacity-80"
                        >
                          Ver link
                        </a>
                      ) : (
                        <div className="text-xs opacity-60">Sin link</div>
                      )}
                    </td>
                    <td className="p-3">{s.category || "-"}</td>
                    <td className="p-3">{renderPriceCell(s)}</td>
                    <td className="p-3">{renderDurationCell(s)}</td>
                    <td className="p-3">{Array.isArray(s.variants) ? s.variants.length : 0}</td>
                    <td className="p-3">{s.active ? "Sí" : "No"}</td>
                    <td className="p-3 flex gap-3">
                      <button className="underline" onClick={() => openEdit(s)}>
                        Editar
                      </button>
                      <button className="underline" onClick={() => toggleActive(s)}>
                        {s.active ? "Desactivar" : "Activar"}
                      </button>
                      <button className="underline text-red-700" onClick={() => deleteService(s)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={draft.id ? "Editar servicio" : "Nuevo servicio"}
        onClose={() => (saving ? null : setModalOpen(false))}
      >
        <div className="space-y-5">
          {/* ===== Servicio base ===== */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Nombre *</label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="Ej: Dogs - Large (41+ lbs)"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Categoría</label>
                <input
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="Ej: Grooming"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Precio base</label>
                <input
                  value={draft.price_base}
                  onChange={(e) => setDraft({ ...draft, price_base: e.target.value })}
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="Opcional (si depende de variante, déjalo vacío)"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Duración base (min)</label>
                <input
                  value={draft.duration_min}
                  onChange={(e) => setDraft({ ...draft, duration_min: e.target.value })}
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="Opcional (si depende de variante, déjalo vacío)"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">Descripción</label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="border rounded-md px-3 py-2 w-full min-h-[90px]"
                placeholder="Detalles del servicio… (qué incluye, condiciones, etc.)"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Link base del servicio</label>
              <input
                value={draft.service_url}
                onChange={(e) => setDraft({ ...draft, service_url: e.target.value })}
                className="border rounded-md px-3 py-2 w-full"
                placeholder="https://... (opcional si el link cambia por variante)"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              Activo
            </label>
          </div>

          {/* ===== Variantes ===== */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold">Variantes (opcional)</div>
                <div className="text-xs opacity-70">
                  Úsalo para precios/links distintos por opción (ej: Long Hair / Short Hair).
                </div>
              </div>
              <button
                onClick={addVariantRow}
                className="px-3 py-2 rounded-md border text-sm"
                type="button"
              >
                + Agregar variante
              </button>
            </div>

            {draft.variants.length === 0 ? (
              <div className="text-sm opacity-70 mt-3">
                Sin variantes. (El servicio usará su precio/link base.)
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {draft.variants.map((v, idx) => {
                  const disabled = !!v._delete;
                  return (
                    <div
                      key={v.id || `new-${idx}`}
                      className={[
                        "rounded-lg border p-3",
                        disabled ? "opacity-50 bg-gray-50" : "bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">
                          Variante #{idx + 1} {v.id ? "" : "(nueva)"}
                        </div>

                        <div className="flex gap-2">
                          {v._delete ? (
                            <button
                              type="button"
                              onClick={() => undoVariantDelete(idx)}
                              className="px-3 py-1 rounded-md border text-xs"
                            >
                              Deshacer
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => markVariantDelete(idx)}
                              className="px-3 py-1 rounded-md border text-xs text-red-700"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-xs font-medium">Nombre variante *</label>
                          <input
                            value={v.variant_name}
                            disabled={disabled}
                            onChange={(e) => {
                              const value = e.target.value;
                              setDraft((d) => {
                                const copy = [...d.variants];
                                copy[idx] = { ...copy[idx], variant_name: value };
                                return { ...d, variants: copy };
                              });
                            }}
                            className="border rounded-md px-3 py-2 w-full"
                            placeholder="Ej: Long Hair"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium">Orden (opcional)</label>
                          <input
                            value={v.sort_order}
                            disabled={disabled}
                            onChange={(e) => {
                              const value = e.target.value;
                              setDraft((d) => {
                                const copy = [...d.variants];
                                copy[idx] = { ...copy[idx], sort_order: value };
                                return { ...d, variants: copy };
                              });
                            }}
                            className="border rounded-md px-3 py-2 w-full"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium">Precio</label>
                          <input
                            value={v.price_base}
                            disabled={disabled}
                            onChange={(e) => {
                              const value = e.target.value;
                              setDraft((d) => {
                                const copy = [...d.variants];
                                copy[idx] = { ...copy[idx], price_base: value };
                                return { ...d, variants: copy };
                              });
                            }}
                            className="border rounded-md px-3 py-2 w-full"
                            placeholder="Ej: 75"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium">Duración (min)</label>
                          <input
                            value={v.duration_min}
                            disabled={disabled}
                            onChange={(e) => {
                              const value = e.target.value;
                              setDraft((d) => {
                                const copy = [...d.variants];
                                copy[idx] = { ...copy[idx], duration_min: value };
                                return { ...d, variants: copy };
                              });
                            }}
                            className="border rounded-md px-3 py-2 w-full"
                            placeholder="Ej: 60"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="text-xs font-medium">Descripción (opcional)</label>
                        <textarea
                          value={v.description}
                          disabled={disabled}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDraft((d) => {
                              const copy = [...d.variants];
                              copy[idx] = { ...copy[idx], description: value };
                              return { ...d, variants: copy };
                            });
                          }}
                          className="border rounded-md px-3 py-2 w-full min-h-[70px]"
                          placeholder="Detalles específicos de esta variante…"
                        />
                      </div>

                      <div className="mt-3">
                        <label className="text-xs font-medium">Link de la variante (opcional)</label>
                        <input
                          value={v.variant_url}
                          disabled={disabled}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDraft((d) => {
                              const copy = [...d.variants];
                              copy[idx] = { ...copy[idx], variant_url: value };
                              return { ...d, variants: copy };
                            });
                          }}
                          className="border rounded-md px-3 py-2 w-full"
                          placeholder="https://... (si el botón Book cambia por variante)"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-sm mt-3">
                        <input
                          type="checkbox"
                          checked={v.active}
                          disabled={disabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setDraft((d) => {
                              const copy = [...d.variants];
                              copy[idx] = { ...copy[idx], active: checked };
                              return { ...d, variants: copy };
                            });
                          }}
                        />
                        Activa
                      </label>

                      {v._delete && (
                        <div className="text-xs text-red-700 mt-2">
                          Esta variante se eliminará al guardar.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ===== Actions ===== */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-md border"
              disabled={saving}
              type="button"
            >
              Cancelar
            </button>
            <button
              onClick={saveDraft}
              className="px-4 py-2 rounded-md bg-black text-white"
              disabled={saving}
              type="button"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

