//src/components/ServiceBookingRulesCard.tsx
"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";

type BookingMode = "exclusive" | "shared";

type ServiceBookingRule = {
  serviceName: string;
  durationMin: number;
  bookingMode: BookingMode;
  slotCapacity: number;
};

export default function ServiceBookingRulesCard() {
  const [rows, setRows] = useState<ServiceBookingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRules = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${BACKEND_URL}/api/appointments/service-booking-rules`, {
          credentials: "include",
        });

        if (!res.ok) {
          return;
        }

        const data = await res.json();

        if (Array.isArray(data?.rules)) {
          setRows(
            data.rules.map((rule: any) => ({
              serviceName: String(rule.service_name || ""),
              durationMin: Number(rule.duration_min || 45),
              bookingMode: rule.booking_mode === "shared" ? "shared" : "exclusive",
              slotCapacity: Number(rule.slot_capacity || 1),
            }))
          );
        } else {
          setRows([]);
        }
      } catch (err) {
        console.error("❌ Error cargando reglas por servicio:", err);
        setError("No se pudieron cargar las reglas por servicio.");
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, []);

  const updateRow = <K extends keyof ServiceBookingRule>(
    index: number,
    field: K,
    value: ServiceBookingRule[K]
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        serviceName: "",
        durationMin: 45,
        bookingMode: "exclusive",
        slotCapacity: 1,
      },
    ]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const sanitizedRows = rows
        .map((row) => ({
          service_name: row.serviceName.trim(),
          duration_min: Number(row.durationMin),
          booking_mode: row.bookingMode,
          slot_capacity: Number(row.slotCapacity),
        }))
        .filter((row) => row.service_name);

      const res = await fetch(`${BACKEND_URL}/api/appointments/service-booking-rules`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rules: sanitizedRows,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error("❌ Error guardando reglas por servicio:", err);
      setError(err?.message || "No se pudieron guardar las reglas por servicio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 mt-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xl font-semibold text-white">
            Booking rules by service
          </div>
          <div className="text-sm text-white/60 mt-1">
            Define duración, modo de reserva y capacidad por servicio.
          </div>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="px-4 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-500 text-sm font-semibold"
        >
          Agregar servicio
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-white/60">Cargando reglas...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-white/60 border-b border-white/10">
                <th className="py-3 pr-3">Servicio</th>
                <th className="py-3 pr-3">Duración (min)</th>
                <th className="py-3 pr-3">Modo</th>
                <th className="py-3 pr-3">Capacidad</th>
                <th className="py-3 pr-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.serviceName}-${index}`} className="border-b border-white/5">
                  <td className="py-3 pr-3">
                    <input
                      type="text"
                      value={row.serviceName}
                      onChange={(e) =>
                        updateRow(index, "serviceName", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                      placeholder="Ej. Indoor Cycling"
                    />
                  </td>

                  <td className="py-3 pr-3">
                    <input
                      type="number"
                      min={1}
                      value={row.durationMin}
                      onChange={(e) =>
                        updateRow(index, "durationMin", Number(e.target.value || 0))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                    />
                  </td>

                  <td className="py-3 pr-3">
                    <select
                      value={row.bookingMode}
                      onChange={(e) =>
                        updateRow(
                          index,
                          "bookingMode",
                          e.target.value === "shared" ? "shared" : "exclusive"
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white"
                    >
                      <option value="exclusive">Exclusive</option>
                      <option value="shared">Shared</option>
                    </select>
                  </td>

                  <td className="py-3 pr-3">
                    <input
                      type="number"
                      min={1}
                      value={row.slotCapacity}
                      onChange={(e) =>
                        updateRow(index, "slotCapacity", Number(e.target.value || 1))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                    />
                  </td>

                  <td className="py-3 pr-0 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar reglas"}
        </button>
      </div>
    </div>
  );
}