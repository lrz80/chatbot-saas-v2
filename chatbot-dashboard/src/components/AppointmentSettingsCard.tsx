"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "../i18n/LanguageProvider";

type Settings = {
  default_duration_min: number;
  buffer_min: number;
  min_lead_minutes: number;
  timezone: string;
  enabled: boolean;

  field_service_area_enabled: boolean;
  field_service_base_address: string;
  field_service_radius_miles: number | "";
};

export default function AppointmentSettingsCard() {
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [form, setForm] = useState<Settings>({
    default_duration_min: 30,
    buffer_min: 10,
    min_lead_minutes: 60,
    timezone: "America/New_York",
    enabled: true,

    field_service_area_enabled: false,
    field_service_base_address: "",
    field_service_radius_miles: "",
  });

  const leadDays = Math.floor(Number(form.min_lead_minutes || 0) / 1440);
  const leadExtraMinutes = Number(form.min_lead_minutes || 0) % 1440;

  const updateLeadDays = (rawValue: string) => {
    const nextDays = Math.max(0, Number(rawValue) || 0);
    const currentExtraMinutes = Number(form.min_lead_minutes || 0) % 1440;

    setForm((prev) => ({
      ...prev,
      min_lead_minutes: nextDays * 1440 + currentExtraMinutes,
    }));
  };

  const updateLeadExtraMinutes = (rawValue: string) => {
    const parsed = Number(rawValue) || 0;
    const nextMinutes = Math.max(0, Math.min(1439, parsed));
    const currentDays = Math.floor(Number(form.min_lead_minutes || 0) / 1440);

    setForm((prev) => ({
      ...prev,
      min_lead_minutes: currentDays * 1440 + nextMinutes,
    }));
  };

  const load = async () => {
    setError("");
    setOkMsg("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/appointment-settings`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error || `Error HTTP: ${res.status}`);
        return;
      }

      if (data?.settings) {
        setForm({
          default_duration_min:
            Number(data.settings.default_duration_min ?? 30),

          buffer_min:
            Number(data.settings.buffer_min ?? 10),

          min_lead_minutes:
            Number(data.settings.min_lead_minutes ?? 60),

          timezone:
            String(
              data.settings.timezone ||
                "America/New_York"
            ),

          enabled:
            data.settings.enabled !== false,

          field_service_area_enabled:
            data.settings.field_service_area_enabled === true,

          field_service_base_address:
            String(
              data.settings.field_service_base_address || ""
            ),

          field_service_radius_miles:
            data.settings.field_service_radius_miles === null ||
            data.settings.field_service_radius_miles === undefined
              ? ""
              : Number(
                  data.settings.field_service_radius_miles
                ),
        });
      }
    } catch (e: any) {
      setError(e?.message || "Error cargando configuración");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setError("");
    setOkMsg("");
    setSaving(true);

    try {
      if (form.field_service_area_enabled) {
        const baseAddress =
          form.field_service_base_address.trim();

        const radiusMiles =
          Number(form.field_service_radius_miles);

        if (!baseAddress) {
          throw new Error(
            "Debes ingresar una dirección base para la zona de servicio."
          );
        }

        if (
          !Number.isFinite(radiusMiles) ||
          radiusMiles <= 0
        ) {
          throw new Error(
            "El radio de trabajo debe ser mayor que 0."
          );
        }
      }

      const res = await fetch(
        `${BACKEND_URL}/api/appointment-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            default_duration_min:
              Number(form.default_duration_min),

            buffer_min:
              Number(form.buffer_min),

            min_lead_minutes:
              Number(form.min_lead_minutes),

            timezone:
              form.timezone,

            enabled:
              Boolean(form.enabled),

            field_service_area_enabled:
              Boolean(
                form.field_service_area_enabled
              ),

            field_service_base_address:
              form.field_service_base_address.trim(),

            field_service_radius_miles:
              form.field_service_area_enabled
                ? Number(
                    form.field_service_radius_miles
                  )
                : null,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setError(
          data?.error ||
            `Error HTTP: ${res.status}`
        );

        return;
      }

      setForm({
        default_duration_min:
          Number(
            data.settings.default_duration_min
          ),

        buffer_min:
          Number(data.settings.buffer_min),

        min_lead_minutes:
          Number(
            data.settings.min_lead_minutes
          ),

        timezone:
          String(data.settings.timezone),

        enabled:
          data.settings.enabled !== false,

        field_service_area_enabled:
          data.settings
            .field_service_area_enabled === true,

        field_service_base_address:
          String(
            data.settings
              .field_service_base_address || ""
          ),

        field_service_radius_miles:
          data.settings
            .field_service_radius_miles === null ||
          data.settings
            .field_service_radius_miles === undefined
            ? ""
            : Number(
                data.settings
                  .field_service_radius_miles
              ),
      });

      setOkMsg(t("apptSettings.savedOk"));
    } catch (e: any) {
      setError(
        e?.message ||
          "Error guardando configuración"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{t("apptSettings.title")}</h2>

          <button
            onClick={load}
            disabled={loading || saving}
            className="text-sm text-purple-300 hover:underline disabled:opacity-50"
          >
            {t("apptSettings.reload")}
          </button>
      </div>

      {loading ? (
        <p className="text-white/60 text-sm">{t("apptSettings.loading")}</p>
      ) : (
        <>
          {error && (
            <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center">
              {error}
            </p>
          )}
          {okMsg && (
            <p className="bg-green-100 text-green-700 p-2 rounded mb-4 text-sm text-center">
              {okMsg}
            </p>
          )}

          <div className="grid gap-4">
            <div>
              <label className="block text-sm text-white/80 mb-1">
                {t("apptSettings.defaultDuration")}
              </label>
              <input
                type="number"
                min={5}
                max={480}
                value={form.default_duration_min}
                onChange={(e) =>
                  setForm((p) => ({ ...p, default_duration_min: Number(e.target.value) }))
                }
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-1">
                {t("apptSettings.buffer")}
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={form.buffer_min}
                onChange={(e) => setForm((p) => ({ ...p, buffer_min: Number(e.target.value) }))}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">
                {t("apptSettings.minLeadLabel")}
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/60 mb-1">
                    Days
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={leadDays}
                    onChange={(e) => updateLeadDays(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">
                    Extra minutes
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1439}
                    step={1}
                    value={leadExtraMinutes}
                    onChange={(e) => updateLeadExtraMinutes(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <p className="text-xs text-white/50 mt-1">
                {t("apptSettings.minLeadHelp")}
              </p>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-1">
                {t("apptSettings.timezone")}
              </label>
              <select
                value={form.timezone}
                onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="America/New_York">America/New_York</option>
                <option value="America/Chicago">America/Chicago</option>
                <option value="America/Denver">America/Denver</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="America/Puerto_Rico">America/Puerto_Rico</option>
                <option value="America/Santo_Domingo">America/Santo_Domingo</option>
                <option value="America/Bogota">America/Bogota</option>
                <option value="America/Mexico_City">America/Mexico_City</option>
              </select>
              <p className="text-xs text-white/50 mt-1">
                {t("apptSettings.timezoneHelp")}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Zona de servicio para citas con ruta
                  </h3>

                  <p className="mt-1 text-xs text-white/50">
                    Esta configuración solo se aplica a citas que requieren desplazamiento.
                    Las citas normales no se verán afectadas.
                  </p>
                </div>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.field_service_area_enabled}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        field_service_area_enabled:
                          e.target.checked,
                      }))
                    }
                    className="peer sr-only"
                  />

                  <div className="h-6 w-11 rounded-full bg-white/20 transition peer-checked:bg-purple-600 peer-focus:ring-2 peer-focus:ring-purple-400">
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>

              {form.field_service_area_enabled && (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-white/80">
                      Dirección base
                    </label>

                    <input
                      type="text"
                      value={form.field_service_base_address}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          field_service_base_address:
                            e.target.value,
                        }))
                      }
                      placeholder="260 Hampton Loop, Davenport, FL 33837"
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />

                    <p className="mt-1 text-xs text-white/50">
                      Esta dirección será el centro del radio de trabajo.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-white/80">
                      Radio de trabajo
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={form.field_service_radius_miles}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            field_service_radius_miles:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          }))
                        }
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />

                      <span className="text-sm text-white/60">
                        millas
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-white/50">
                      Solo se incluirán en las rutas las citas ubicadas dentro de este radio.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={save}
              disabled={saving || loading}
              className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition text-white font-semibold shadow-lg disabled:opacity-60"
            >
              {saving ? t("apptSettings.saving") : t("apptSettings.save")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
