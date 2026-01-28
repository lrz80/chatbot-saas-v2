'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BACKEND_URL } from '@/utils/api';
import Footer from '@/components/Footer';
import { useI18n } from "../../../i18n/LanguageProvider";


type SettingsPayload = {
  nombre_negocio: string;
  horario_atencion?: string;
  categoria: string;
  idioma: string;
  logo_url?: string;
  direccion?: string;
  email_negocio?: string;
  telefono_negocio?: string;

  // NUEVO: booking & availability
  booking_url?: string;
  reservas_url?: string;
  agenda_url?: string;
  booking?: string;

  availability_api_url?: string;
  booking_api_url?: string;
  availability_headers?: Record<string, any>;

  // Enviamos timezone en silencio
  timezone?: string;
};

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type DayHours = { start: string; end: string } | null;
type HoursByWeekday = Record<DayKey, DayHours>;

const DEFAULT_HOURS: HoursByWeekday = {
  mon: { start: "09:00", end: "17:00" },
  tue: { start: "09:00", end: "17:00" },
  wed: { start: "09:00", end: "17:00" },
  thu: { start: "09:00", end: "17:00" },
  fri: { start: "09:00", end: "17:00" },
  sat: null,
  sun: null,
};

function normalizeHorario(raw: any): HoursByWeekday {
  try {
    if (!raw) return DEFAULT_HOURS;

    // Si viene como string
    if (typeof raw === "string") {
      const s = raw.trim();

      // legacy: "09:00-17:00"
      const m = s.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
      if (m) {
        const start = m[1], end = m[2];
        return {
          mon: { start, end }, tue: { start, end }, wed: { start, end },
          thu: { start, end }, fri: { start, end }, sat: null, sun: null,
        };
      }

      // JSON en string
      raw = JSON.parse(s);
    }

    const out: HoursByWeekday = { ...DEFAULT_HOURS };
    (["mon","tue","wed","thu","fri","sat","sun"] as DayKey[]).forEach((k) => {
      const v = raw?.[k];
      if (!v) out[k] = null;
      else if (typeof v === "object" && v.start && v.end) out[k] = { start: String(v.start), end: String(v.end) };
      else out[k] = null;
    });

    return out;
  } catch {
    return DEFAULT_HOURS;
  }
}

export default function BusinessProfilePage() {
  const { t, lang } = useI18n();
  const locale = lang === "en" ? "en-US" : "es-ES";

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<any>({});
  const [direccion, setDireccion] = useState('');

  // NUEVO: campos UI para booking & availability
  const [bookingUrl, setBookingUrl] = useState('');
  const [availabilityApiUrl, setAvailabilityApiUrl] = useState('');
  const [availabilityHeadersText, setAvailabilityHeadersText] = useState<string>('');

  // ✅ Meta Pixel (por tenant)
  const [metaPixelId, setMetaPixelId] = useState('');
  const [metaPixelEnabled, setMetaPixelEnabled] = useState(false);

  // ✅ NUEVO (Solo CAPI)
  const [metaCapiToken, setMetaCapiToken] = useState('');
  const [metaCapiTokenEverSet, setMetaCapiTokenEverSet] = useState(false);

  const [metaCapiTokenPreview, setMetaCapiTokenPreview] = useState('');

  const [horarioSemana, setHorarioSemana] = useState<HoursByWeekday>(DEFAULT_HOURS);

  const dayLabels = useMemo(() => ({
    mon: t("profile.days.mon"),
    tue: t("profile.days.tue"),
    wed: t("profile.days.wed"),
    thu: t("profile.days.thu"),
    fri: t("profile.days.fri"),
    sat: t("profile.days.sat"),
    sun: t("profile.days.sun"),
  }), [lang]);

  function tf(key: string, vars?: Record<string, string | number>) {
    let s = t(key);
    if (!vars) return s;
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{{${k}}}`, String(v));
    }
    return s;
  }

  function setDay(k: DayKey, patch: Partial<{ start: string; end: string }> | null) {
    setHorarioSemana((prev) => {
      const next = { ...prev };
      if (patch === null) next[k] = null;
      else next[k] = { start: patch.start ?? (prev[k]?.start || "09:00"), end: patch.end ?? (prev[k]?.end || "17:00") };
      return next;
    });
  }

  // 🚀 Mover fetchSettings fuera del useEffect
  const fetchSettings = async () => {
  try {
    const [sRes, tRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/settings`, { credentials: 'include', cache: 'no-store' }),
      fetch(`${BACKEND_URL}/api/tenants/me`, { credentials: 'include', cache: 'no-store' }),
    ]);
    if (!sRes.ok) throw new Error('Error al obtener settings');
    const settingsData = await sRes.json();

    let tenantData: any = {};
    if (tRes.ok) tenantData = await tRes.json();

    setFormData({
      tenant_id: settingsData.tenant_id,
      nombre_negocio: settingsData.name,
      horario_atencion:
        settingsData.horario_atencion ??
        tenantData?.horario_atencion ??
        '',
      categoria: settingsData.categoria,
      idioma: settingsData.idioma,
      logo_url: settingsData.logo_url,
      twilio_number: (settingsData.twilio_number || '').replace(/^whatsapp:/i, ''),
      twilio_sms_number: settingsData.twilio_sms_number,
      twilio_voice_number: settingsData.twilio_voice_number,
      plan: settingsData.plan_name ?? tenantData?.plan ?? '',
      fecha_registro: settingsData.registered_at ?? tenantData?.created_at ?? null,
      owner_name: settingsData.owner_name,
      email: settingsData.email,
      email_negocio: settingsData.email_negocio || '',
      telefono_negocio: settingsData.telefono_negocio || '',
      // ⬇️ NUEVO
      membresia_activa: settingsData.membresia_activa,
      membresia_vigencia: settingsData.membresia_vigencia,
      es_trial: settingsData.es_trial,
      estado_membresia_texto: settingsData.estado_membresia_texto,
      trial_disponible: Boolean(settingsData.trial_disponible),
      trial_activo: Boolean(settingsData.trial_vigente || settingsData.trial_activo),
      can_edit: Boolean(
        settingsData.can_edit ??
        settingsData.membresia_activa ??
        (settingsData.trial_vigente || settingsData.trial_activo)
      ),
    });

    const rawHorario =
      settingsData.horario_atencion ??
      tenantData?.horario_atencion ??
      '';

    setHorarioSemana(normalizeHorario(rawHorario));

    setDireccion(settingsData.direccion || '');

    // ✅ Meta Pixel (viene de /api/settings)
    setMetaPixelId(settingsData.meta_pixel_id || '');
    setMetaPixelEnabled(Boolean(settingsData.meta_pixel_enabled));

    // ✅ CAPI Token (si el backend lo devuelve; si no, déjalo vacío)
    setMetaCapiToken(''); // nunca lo prellenes
    setMetaCapiTokenEverSet(Boolean(settingsData.meta_capi_token_configured));

    setMetaCapiTokenPreview(settingsData.meta_capi_token_preview || '');

    // 👇 toma los nuevos valores del tenant.settings si existen
    const s = tenantData?.settings || {};
    setBookingUrl(s?.booking?.booking_url || '');
    setAvailabilityApiUrl(s?.availability?.api_url || '');
    setAvailabilityHeadersText(
      s?.availability?.headers ? JSON.stringify(s.availability.headers, null, 2) : ''
    );

  } catch (error) {
    console.error('❌ Error al obtener settings:', error);
  } finally {
    setLoading(false);
  }
};

// en el guardar:
const handleSave = async () => {
  if (!formData.can_edit) {
    // si no tiene plan activo ni trial vigente, lo envío a upgrade
    router.push('/upgrade');
    return;
  }

  setSaving(true);

  if (metaPixelEnabled) {
    if (!metaPixelId.trim()) {
      alert(t("profile.capi.needPixelId"));
      setSaving(false);
      return;
    }
    if (!metaCapiTokenEverSet && !metaCapiToken.trim()) {
      alert(t("profile.capi.needToken"));
      setSaving(false);
      return;
    }
  }

  try {
    const horario_atencion_obj = horarioSemana;

    // fallback legacy (por si algún endpoint viejo aún lo espera como string):
    const legacyRange =
      horarioSemana.mon && horarioSemana.mon.start && horarioSemana.mon.end
        ? `${horarioSemana.mon.start}-${horarioSemana.mon.end}`
        : "";

    // 1) Ajustes "clásicos"
    const resS = await fetch(`${BACKEND_URL}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        nombre_negocio: formData.nombre_negocio,
        horario_atencion: horario_atencion_obj,
        horario_atencion_legacy: legacyRange, // opcional, pero útil en transición
        categoria: formData.categoria,
        idioma: formData.idioma,
        logo_url: formData.logo_url || '',
        direccion,
        email_negocio: formData.email_negocio || '',
        telefono_negocio: formData.telefono_negocio || '',
        meta_pixel_id: metaPixelId.trim(),
        meta_pixel_enabled: metaPixelEnabled,
        // ✅ Siempre manda el token si el pixel está activado.
        // Si está vacío, significa "no lo cambies" SOLO si ya existe uno guardado.
        meta_capi_token:
          metaPixelEnabled
            ? (metaCapiToken.trim() || (metaCapiTokenEverSet ? '__KEEP__' : ''))
            : '',
      }),
    });

    if (!resS.ok) {
      const data = await resS.json().catch(() => ({}));
      throw new Error(data?.error || "Error guardando settings");
    }

    // 2) Booking / Availability
    const safeTrim = (s: string) => (s || '').trim();
    const booking_url = safeTrim(bookingUrl);
    const availability_api_url = safeTrim(availabilityApiUrl);

    // parsea headers del textarea
    let availability_headers: Record<string, any> | undefined = undefined;
    const txt = safeTrim(availabilityHeadersText);
    if (txt) {
      try {
        const obj = JSON.parse(txt);
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          availability_headers = obj;
        }
      } catch (e) {
        alert(t("profile.availability.headersInvalid"));
      }
    }

    const payloadTenants: any = {
      name: formData.nombre_negocio,
      categoria: formData.categoria,
      idioma: formData.idioma,
      horario_atencion: horario_atencion_obj,
      // envía solo si hay valor (el backend valida http/https)
      ...(booking_url ? { booking_url } : {}),
      ...(availability_api_url ? { availability_api_url } : {}),
      ...(availability_headers ? { availability_headers } : {}),
      // opcional: envia timezone detectada
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const resT = await fetch(`${BACKEND_URL}/api/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payloadTenants),
    });

    if (!resT.ok) {
      const data = await resT.json().catch(() => ({}));
      throw new Error(data?.error || 'Error guardando booking/availability');
    }

    alert(t("profile.save.success"));
    await fetchSettings();
  } catch (err: any) {
    console.error(err);
    alert(`${t("profile.alert.errorPrefix")} ${err.message || t("profile.alert.connectionError")}`);
  } finally {
    setSaving(false);
  }
};

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCancelarPlan = async () => {
  if (!confirm(t("profile.plan.cancelConfirm"))) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/cancel`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: formData.tenant_id }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(t("profile.plan.cancelSuccess"));
        await fetchSettings();
      } else {
        alert(`${t("profile.alert.errorPrefix")} ${data.error}`);

      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert(t("profile.plan.cancelError"));
    }
  };

  if (loading) return <p className="text-center text-white">{t("profile.loading")}</p>;

  return (
    <div className="max-w-6xl mx-auto bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-black/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8">
      <div className="flex items-center gap-4 mb-6">
        {formData.logo_url ? (
          <div className="h-16 w-16 rounded-full border border-white/30 shadow-md bg-white overflow-hidden">
            <img src={formData.logo_url} alt={t("profile.logoAlt")} className="h-full w-full object-cover" />
          </div>
        ) : null}
        <h1
          className="
            text-2xl
            sm:text-3xl
            md:text-4xl
            font-extrabold
            text-center
            mb-6 md:mb-8
            text-purple-300
          "
        >
          {t("profile.title")}
        </h1>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
        <div>
          <label className="text-sm text-indigo-200 font-semibold">{t("profile.fields.businessName")}</label>
          <input
            name="nombre_negocio"
            type="text"
            value={formData.nombre_negocio || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-indigo-200 font-semibold">{t("profile.fields.hours")}</label>

          <div className="mt-2 space-y-2">
            {(["mon","tue","wed","thu","fri","sat","sun"] as DayKey[]).map((k) => {
              const v = horarioSemana[k];
              const abierto = v !== null;

              return (
                <div key={k} className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 rounded-md px-3 py-2">
                  <div className="w-24 text-white/90 font-medium">{dayLabels[k]}</div>

                  <label className="flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={abierto}
                      onChange={(e) => {
                        if (!e.target.checked) setDay(k, null);
                        else setDay(k, { start: "09:00", end: "17:00" });
                      }}
                      disabled={!formData?.can_edit}
                      className="h-4 w-4"
                    />
                    {t("profile.hours.open")}
                  </label>

                  <input
                    type="time"
                    value={v?.start || "09:00"}
                    disabled={!abierto || !formData?.can_edit}
                    onChange={(e) => setDay(k, { start: e.target.value })}
                    className="bg-white/10 border border-white/20 px-2 py-1 rounded-md"
                  />

                  <span className="text-white/60">-</span>

                  <input
                    type="time"
                    value={v?.end || "17:00"}
                    disabled={!abierto || !formData?.can_edit}
                    onChange={(e) => setDay(k, { end: e.target.value })}
                    className="bg-white/10 border border-white/20 px-2 py-1 rounded-md"
                  />
                </div>
              );
            })}
          </div>

          <p className="text-xs text-white/60 mt-2">
            {t("profile.hours.help")}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full">
            <label className="text-sm text-indigo-200 font-semibold">{t("profile.fields.address")}</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder={t("profile.placeholders.address")}
              className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-indigo-200 font-semibold">{t("profile.fields.category")}</label>
          <select
            name="categoria"
            value={formData.categoria || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="">{t("profile.category.placeholder")}</option>
            <option value="spa">Spa</option>
            <option value="barberia">Barbería</option>
            <option value="clinica">Clínica estética</option>
            <option value="restaurante">Restaurante</option>
            <option value="fitness">Fitness</option>
            <option value="petgrooming">Pet Grooming</option>
            <option value="otra">Otra</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-indigo-200 font-semibold">{t("profile.fields.logo")}</label>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("logo", file);
              try {
                const res = await fetch(`${BACKEND_URL}/api/upload-logo`, {
                  method: "POST",
                  credentials: "include",
                  body: fd,
                });
                const data = await res.json();
                if (data.logo_url) {
                  setFormData((prev: any) => ({ ...prev, logo_url: data.logo_url }));
                  alert(t("profile.logo.uploadSuccess"));
                } else {
                  alert(t("profile.logo.uploadFail"));
                }
              } catch (err) {
                console.error("❌ Error al subir logo:", err);
                alert(t("profile.logo.uploadFailGeneric"));
              }
            }}
            className="w-full text-white/70 bg-white/10 border border-white/20 px-3 py-2 rounded-md file:mr-3 file:py-1 file:px-2 file:border-0 file:rounded file:bg-indigo-600 file:text-white"
          />
        </div>

        <div>
          <label className="text-sm text-indigo-200 font-semibold">{t("profile.fields.adminEmail")}</label>
          <input value={formData.email} disabled className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md text-gray-400" />
        </div>

        <div>
          <label className="text-sm text-indigo-200 font-semibold">{t("profile.fields.businessEmail")}</label>
          <input
            name="email_negocio"
            type="email"
            value={formData.email_negocio || ''}
            onChange={handleChange}
            placeholder={t("profile.placeholders.businessEmail")}
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div>
          <label className="text-sm text-indigo-200 font-semibold">{t("profile.fields.businessPhone")}</label>
          <input
            name="telefono_negocio"
            type="text"
            value={formData.telefono_negocio || ''}
            onChange={handleChange}
            placeholder={t("profile.placeholders.businessPhone")}
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {[
          { label: t("profile.fields.waNumber"), value: formData.twilio_number },
          { label: t("profile.fields.smsNumber"), value: formData.twilio_sms_number },
          { label: t("profile.fields.voiceNumber"), value: formData.twilio_voice_number },
        ].map(({ label, value }, i) => (
          <div key={i}>
            <label className="text-sm text-indigo-200 font-semibold">{label}</label>
            <input
              value={value || t("profile.values.notAssigned")}
              readOnly
              className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md text-gray-400"
            />
          </div>
        ))}

        <div>
          <label className="text-sm text-indigo-200 font-semibold">{t("profile.fields.assistantLanguage")}</label>
          <select
            name="idioma"
            value={formData.idioma || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md text-white"
          >
            <option value="es-ES">{t("common.spanish")}</option>
            <option value="en-US">{t("common.english")}</option>
          </select>
        </div>

        <div>
          <p className="text-sm text-indigo-200 font-semibold">{t("profile.plan.active")}</p>
          <p className="text-lg text-white">{formData.plan}</p>
        </div>
        <div className="mt-2">
          <button
            onClick={handleCancelarPlan}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
          >
            {t("profile.plan.cancel")}
          </button>
        </div>

        <div>
          <p className="text-sm text-indigo-200 font-semibold">{t("profile.registeredAt")}</p>
          <p className="text-lg text-white">
            {formData.fecha_registro
              ? new Date(formData.fecha_registro).toLocaleDateString(locale, {
              year: 'numeric', month: 'long', day: '2-digit'
            })
          : t("profile.values.dateUnavailable")}
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="text-sm text-indigo-200 font-semibold">
            {t("profile.membership.statusTitle")}
          </p>

          {(() => {
            const untilRaw = formData.membresia_vigencia;
            const until = untilRaw ? new Date(untilRaw) : null;
            const dateStr = until
              ? new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "2-digit" }).format(until)
              : null;

            if (formData.membresia_activa) {
              return (
                <p className="text-green-400 font-semibold">
                  ✅ {dateStr ? t("profile.membership.activeUntil", { date: dateStr }) : t("profile.membership.active")}
                </p>
              );
            }

            if (formData.trial_activo) {
              return (
                <p className="text-yellow-400 font-semibold">
                  🟡 {dateStr ? t("profile.membership.trialUntil", { date: dateStr }) : t("profile.membership.trial")}
                </p>
              );
            }

            return (
              <p className="text-red-400 font-semibold">
                🚫 {t("profile.membership.inactiveShort")}
              </p>
            );
          })()}
        </div>
      </div>

      {/* =======================
      ✅ Meta Pixel (por tenant) - FULL WIDTH
      ======================= */}
      <div className="mt-8 p-6 rounded-2xl border border-white/20 bg-white/5 text-white md:col-span-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-purple-300">{t("profile.capi.title")}</h2>
            <p className="text-sm text-white/70">
              {t("profile.capi.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="metaPixelEnabled"
              type="checkbox"
              checked={metaPixelEnabled}
              onChange={(e) => setMetaPixelEnabled(e.target.checked)}
              disabled={!formData?.can_edit}
              className="h-5 w-5"
            />
            <label htmlFor="metaPixelEnabled" className="text-sm text-indigo-200 font-semibold">
              {t("profile.capi.enablePixel")}
            </label>
          </div>
        </div>

        {/* layout interno responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-indigo-200 font-semibold">{t("profile.capi.pixelId")}</label>
            <input
              type="text"
              value={metaPixelId}
              onChange={(e) => setMetaPixelId(e.target.value)}
              placeholder={t("profile.capi.pixelPlaceholder")}
              className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              disabled={!formData?.can_edit}
            />
            <p className="text-xs text-white/60 mt-1">
              {t("profile.capi.pixelHelp")}
            </p>
          </div>

          <div>
            <label className="text-sm text-indigo-200 font-semibold">{t("profile.capi.token")}</label>
            <input
              type="password"
              value={metaCapiToken}
              onChange={(e) => setMetaCapiToken(e.target.value)}
              placeholder={t("profile.capi.tokenPlaceholder")}
              className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              disabled={!formData?.can_edit}
            />
            <p className="text-xs text-white/60 mt-1">
              {t("profile.capi.tokenHelp")}
            </p>

            {metaCapiTokenEverSet && (
              <p className="text-xs text-green-200 mt-2">
                {t("profile.capi.tokenSaved")} <span className="font-mono">{metaCapiTokenPreview}</span>
              </p>
            )}
          </div>
        </div>

        {!formData?.can_edit && (
          <div className="mt-4 text-sm text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
            {t("profile.capi.locked")}
          </div>
        )}

        {metaPixelEnabled && !String(metaPixelId || '').trim() && (
          <div className="mt-4 text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded p-3">
            {t("profile.capi.pixelRequired")}
          </div>
        )}
      </div>

      {/* 🎁 Caso 1: Nunca ha usado el trial → invitar a activar prueba */}
      {formData?.trial_disponible && !formData?.can_edit && (
        <div className="mt-4 mb-2 p-4 bg-purple-500/20 border border-purple-400 text-purple-100 rounded text-center font-medium">
          {t("profile.trial.invite")}
          <button
            onClick={() => router.push('/upgrade')}
            className="ml-3 inline-flex items-center px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm"
          >
            {t("profile.trial.activate")}
          </button>
        </div>
      )}

      {/* 🟡 Caso 2: Trial activo pero sin plan pago (permitir editar) → mensaje informativo */}
      {!formData?.membresia_activa && formData?.trial_activo && (
        <div className="mt-4 mb-2 p-4 bg-yellow-500/20 border border-yellow-400 text-yellow-200 rounded text-center font-medium">
          {t("profile.trial.activeInfo")}
        </div>
      )}

      {/* 🔴 Caso 3: Sin plan y sin trial activo → banner de inactiva con CTA a upgrade */}
      {!formData?.can_edit && !formData?.trial_disponible && !formData?.trial_activo && (
        <div className="mt-4 mb-2 p-4 bg-red-500/20 border border-red-400 text-red-200 rounded text-center font-medium">
          {t("profile.membership.inactive")}
          <a onClick={() => router.push('/upgrade')} className="underline cursor-pointer">
            {t("profile.membership.upgradeCta")}
          </a>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={handleSave}
          className={`px-6 py-2 rounded-md shadow-lg transition text-white ${
            saving || !formData.can_edit
              ? 'bg-gray-600 hover:bg-yellow-600 cursor-pointer'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
          }`}
        >
          {saving
            ? t("profile.save.saving")
            : formData.can_edit
            ? t("profile.save.cta")
            : t("profile.save.upgrade")}
        </button>
      </div>
      <Footer />
    </div>
  );
}
