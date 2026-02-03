"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api"; // usa tu helper actual (ya lo usas en dashboard/page.tsx)

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_min: number | null;
  price_base: number | null;
  active: boolean;
  service_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function ServicesPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  // filtros UI
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      // ✅ usa el endpoint que YA creaste (si tu path es diferente, lo cambias aquí)
      const res = await fetch(`${BACKEND_URL}/api/services`, {
        method: "GET",
        credentials: "include",
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

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Servicios</h1>
          <p className="text-sm opacity-70">
            Administra el catálogo para que Amy pueda enviar links específicos por servicio.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/services/new"
            className="px-4 py-2 rounded-md bg-black text-white"
          >
            + Nuevo servicio
          </Link>

          <Link
            href="/dashboard/services/import"
            className="px-4 py-2 rounded-md border"
          >
            Importar CSV
          </Link>
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
          <table className="min-w-[900px] w-full text-sm">
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
                <tr>
                  <td className="p-3" colSpan={6}>
                    Cargando…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="p-3" colSpan={6}>
                    No hay servicios.
                  </td>
                </tr>
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
                    <td className="p-3">
                      {typeof s.price_base === "number" ? `$${s.price_base}` : "-"}
                    </td>
                    <td className="p-3">
                      {typeof s.duration_min === "number" ? `${s.duration_min} min` : "-"}
                    </td>
                    <td className="p-3">{s.active ? "Sí" : "No"}</td>
                    <td className="p-3">
                      <Link
                        href={`/dashboard/services/${s.id}/edit`}
                        className="underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
