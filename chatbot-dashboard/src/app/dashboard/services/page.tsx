"use client";

import { useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/utils/api";

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_min: number | null;
  price_base: number | null;
  active: boolean;
  service_url: string | null;
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
};

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
  };
}

function numOrNull(v: string): number | null {
  const t = String(v || "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
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
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-0 top-10 mx-auto w-[92vw] max-w-2xl rounded-2xl bg-white text-black shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="px-3 py-1 rounded-md border text-sm">
            Cerrar
          </button>
        </div>
        <div className="p-5">{children}</div>
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

  async function saveDraft() {
    setError(null);

    const name = draft.name.trim();
    if (!name) return setError("El nombre es requerido.");

    const url = cleanUrl(draft.service_url);
    if (draft.service_url.trim() && !url) return setError("El link debe ser una URL válida (http/https).");

    const payload = {
      name,
      description: draft.description.trim() || null,
      category: draft.category.trim() || null,
      duration_min: numOrNull(draft.duration_min),
      price_base: numOrNull(draft.price_base),
      active: !!draft.active,
      service_url: url,
    };

    setSaving(true);
    try {
      // ✅ Opción A: REST
      const isEdit = !!draft.id;
      const endpoint = isEdit
        ? `${BACKEND_URL}/api/services/${draft.id}`
        : `${BACKEND_URL}/api/services`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${method} services failed: ${res.status} ${t}`);
      }

      setModalOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error guardando servicio");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: Service) {
    setError(null);
    try {
      // ✅ PATCH activo (si no lo tienes, lo hacemos en backend en el próximo paso)
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

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Servicios</h1>
          <p className="text-sm opacity-70">
            Agrega/edita servicios aquí. El bot puede enviar links específicos por servicio.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-md bg-black text-white"
          >
            + Nuevo servicio
          </button>

          {/* Import CSV lo hacemos después; por ahora no redirige */}
          <button
            onClick={() => alert("CSV: lo activamos en el siguiente paso")}
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
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-3">Nombre</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Duración</th>
                <th className="p-3">Activo</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td className="p-3" colSpan={6}>Cargando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="p-3" colSpan={6}>No hay servicios.</td></tr>
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
                    <td className="p-3">{typeof s.price_base === "number" ? `$${s.price_base}` : "-"}</td>
                    <td className="p-3">{typeof s.duration_min === "number" ? `${s.duration_min} min` : "-"}</td>
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Nombre *</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Ej: Deluxe Bath"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Categoría</label>
              <input
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Ej: Bath"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Precio</label>
              <input
                value={draft.price_base}
                onChange={(e) => setDraft({ ...draft, price_base: e.target.value })}
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Ej: 55"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Duración (min)</label>
              <input
                value={draft.duration_min}
                onChange={(e) => setDraft({ ...draft, duration_min: e.target.value })}
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Ej: 60"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Descripción</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="border rounded-md px-3 py-2 w-full min-h-[90px]"
              placeholder="Detalles del servicio…"
            />
          </div>

          <div>
            <label className="text-xs font-medium">Link del servicio</label>
            <input
              value={draft.service_url}
              onChange={(e) => setDraft({ ...draft, service_url: e.target.value })}
              className="border rounded-md px-3 py-2 w-full"
              placeholder="https://..."
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-md border"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={saveDraft}
              className="px-4 py-2 rounded-md bg-black text-white"
              disabled={saving}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
