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
  });

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

      if (data?.settings) setForm(data.settings);
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
      const res = await fetch(`${BACKEND_URL}/api/appointment-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          default_duration_min: Number(form.default_duration_min),
          buffer_min: Number(form.buffer_min),
          min_lead_minutes: Number(form.min_lead_minutes),
          timezone: form.timezone,
          enabled: Boolean(form.enabled),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error || `Error HTTP: ${res.status}`);
        return;
      }

      setForm(data.settings);
      setOkMsg(t("apptSettings.savedOk"));
    } catch (e: any) {
      setError(e?.message || "Error guardando configuración");
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
              <label className="block text-sm text-white/80 mb-1">
                {t("apptSettings.minLeadLabel")}
              </label>
              <input
                type="number"
                min={0}
                max={1440}
                value={form.min_lead_minutes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, min_lead_minutes: Number(e.target.value) }))
                }
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
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
