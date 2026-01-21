'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BACKEND_URL } from '@/utils/api';
import Footer from '@/components/Footer';

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

export default function BusinessProfilePage() {
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
      twilio_number: settingsData.twilio_number,
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

    setDireccion(settingsData.direccion || '');

    // ✅ Meta Pixel (viene de /api/settings)
    setMetaPixelId(settingsData.meta_pixel_id || '');
    setMetaPixelEnabled(Boolean(settingsData.meta_pixel_enabled));

    // ✅ CAPI Token (si el backend lo devuelve; si no, déjalo vacío)
    setMetaCapiToken(''); // nunca lo prellenes
    setMetaCapiTokenEverSet(Boolean(settingsData.meta_capi_token_configured));

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
      alert("⚠️ Para activar CAPI necesitas ingresar el Pixel/Dataset ID.");
      setSaving(false);
      return;
    }
    if (!metaCapiTokenEverSet && !metaCapiToken.trim()) {
      alert("⚠️ Para activar CAPI necesitas ingresar el CAPI Token.");
      setSaving(false);
      return;
    }
  }

  try {
    // 1) Ajustes "clásicos"
    const resS = await fetch(`${BACKEND_URL}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        nombre_negocio: formData.nombre_negocio,
        horario_atencion: formData.horario_atencion,
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
        alert('⚠️ Los headers no son JSON válido. Revisa el formato.');
      }
    }

    const payloadTenants: any = {
      name: formData.nombre_negocio,
      categoria: formData.categoria,
      idioma: formData.idioma,
      horario_atencion: formData.horario_atencion,
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

    alert('✅ Cambios guardados correctamente');
    await fetchSettings();
  } catch (err: any) {
    console.error(err);
    alert(`❌ ${err.message || 'Error en la conexión'}`);
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
    if (!confirm("¿Estás seguro de que deseas cancelar tu plan?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/cancel`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: formData.tenant_id }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Plan cancelado correctamente.");
        await fetchSettings();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert("❌ Hubo un problema al cancelar el plan.");
    }
  };

  if (loading) return <p className="text-center text-white">Cargando información del negocio...</p>;

  return (
    <div className="max-w-6xl mx-auto bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-black/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8">
      <div className="flex items-center gap-4 mb-6">
        {formData.logo_url ? (
          <div className="h-16 w-16 rounded-full border border-white/30 shadow-md bg-white overflow-hidden">
            <img src={formData.logo_url} alt="Logo del negocio" className="h-full w-full object-cover" />
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
          Perfil del Negocio
        </h1>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
        <div>
          <label className="text-sm text-indigo-200 font-semibold">Nombre del Negocio</label>
          <input
            name="nombre_negocio"
            type="text"
            value={formData.nombre_negocio || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* =======================
        ✅ Meta Pixel (por tenant)
        ======================= */}
        <div className="mt-8 p-5 rounded-xl border border-white/20 bg-white/5 text-white">
          <h2 className="text-lg font-bold text-purple-300 mb-1">Meta Conversions API (CAPI)</h2>
          <p className="text-sm text-white/70 mb-4">
            Activa tracking server-side para medir conversiones desde anuncios (no requiere instalar Pixel en tu web).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-sm text-indigo-200 font-semibold">Pixel ID</label>
              <input
                type="text"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                placeholder="Ej: 123456789012345"
                className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                disabled={!formData?.can_edit}
              />
              <p className="text-xs text-white/60 mt-1">
                Solo números. Si no lo tienes, búscalo en Events Manager.
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
                Activar Pixel
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm text-indigo-200 font-semibold">CAPI Token</label>
            <input
              type="password"
              value={metaCapiToken}
              onChange={(e) => setMetaCapiToken(e.target.value)}
              placeholder="Pegue aquí su token de Conversions API"
              className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              disabled={!formData?.can_edit}
            />
            <p className="text-xs text-white/60 mt-1">
              Se usa para enviar eventos server-side (no se instala nada en tu web).
            </p>
          </div>

          {!formData?.can_edit && (
            <div className="mt-3 text-sm text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
              Activa un plan o tu prueba gratis para guardar cambios de tracking.
            </div>
          )}

          {metaPixelEnabled && !String(metaPixelId || '').trim() && (
            <div className="mt-3 text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded p-3">
              Para activar el Pixel necesitas ingresar el Pixel ID.
            </div>
          )}
        </div>

        <div>
          <label className="text-sm text-indigo-200 font-semibold">Horario de Atención</label>
          <input
            name="horario_atencion"
            type="text"
            value={formData.horario_atencion || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full">
            <label className="text-sm text-indigo-200 font-semibold">Dirección del Negocio</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="123 Calle Principal, Ciudad, Estado"
              className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-indigo-200 font-semibold">Categoría del Negocio</label>
          <select
            name="categoria"
            value={formData.categoria || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="">Selecciona una categoría</option>
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
          <label className="text-sm text-indigo-200 font-semibold">Logo del Negocio</label>
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
                  alert("✅ Logo actualizado con éxito");
                } else {
                  alert("❌ Error al subir el logo");
                }
              } catch (err) {
                console.error("❌ Error al subir logo:", err);
                alert("Error al cargar el logo");
              }
            }}
            className="w-full text-white/70 bg-white/10 border border-white/20 px-3 py-2 rounded-md file:mr-3 file:py-1 file:px-2 file:border-0 file:rounded file:bg-indigo-600 file:text-white"
          />
        </div>

        <div>
          <label className="text-sm text-indigo-200 font-semibold">Correo del Administrador</label>
          <input value={formData.email} disabled className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md text-gray-400" />
        </div>

        <div>
          <label className="text-sm text-indigo-200 font-semibold">Email del Negocio</label>
          <input
            name="email_negocio"
            type="email"
            value={formData.email_negocio || ''}
            onChange={handleChange}
            placeholder="negocio@ejemplo.com"
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div>
          <label className="text-sm text-indigo-200 font-semibold">Teléfono del Negocio</label>
          <input
            name="telefono_negocio"
            type="text"
            value={formData.telefono_negocio || ''}
            onChange={handleChange}
            placeholder="1234567890"
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {[{
          label: 'Número del Asistente (SMS)',
          value: formData.twilio_sms_number
        }, {
          label: 'Número del Asistente (Voz)',
          value: formData.twilio_voice_number
        }].map(({ label, value }, i) => (
          <div key={i}>
            <label className="text-sm text-indigo-200 font-semibold">{label}</label>
            <input
              value={value || 'No asignado'}
              readOnly
              className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md text-gray-400"
            />
          </div>
        ))}

        <div>
          <label className="text-sm text-indigo-200 font-semibold">Idioma del Asistente</label>
          <select
            name="idioma"
            value={formData.idioma || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md text-white"
          >
            <option value="es-ES">Español</option>
            <option value="en-US">Inglés</option>
          </select>
        </div>

        <div>
          <p className="text-sm text-indigo-200 font-semibold">Plan Activo</p>
          <p className="text-lg text-white">{formData.plan}</p>
        </div>
        <div className="mt-2">
          <button
            onClick={handleCancelarPlan}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
          >
            Cancelar Plan
          </button>
        </div>

        <div>
          <p className="text-sm text-indigo-200 font-semibold">Fecha de Registro</p>
          <p className="text-lg text-white">
            {formData.fecha_registro
              ? new Date(formData.fecha_registro).toLocaleDateString('es-ES', {
              year: 'numeric', month: 'long', day: '2-digit'
            })
          : 'Fecha no disponible'}
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="text-sm text-indigo-2 00 font-semibold">Estado de la Membresía</p>
          {formData.estado_membresia_texto ? (
            <p
              className={
                formData.estado_membresia_texto.includes('🟡')
                  ? 'text-yellow-400 font-semibold'
                  : formData.estado_membresia_texto.includes('✅')
                  ? 'text-green-400 font-semibold'
                  : 'text-red-400 font-semibold'
              }
            >
              {formData.estado_membresia_texto}
            </p>
          ) : (
            <p className="text-red-400 font-semibold">❌ Sin información</p>
          )}
        </div>
      </div>

      {/* 🎁 Caso 1: Nunca ha usado el trial → invitar a activar prueba */}
      {formData?.trial_disponible && !formData?.can_edit && (
        <div className="mt-4 mb-2 p-4 bg-purple-500/20 border border-purple-400 text-purple-100 rounded text-center font-medium">
          🎁 <strong>Activa tu prueba gratis</strong> y comienza a entrenar tu asistente ahora.
          <button
            onClick={() => router.push('/upgrade')}
            className="ml-3 inline-flex items-center px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm"
          >
            Activar prueba gratis
          </button>
        </div>
      )}

      {/* 🟡 Caso 2: Trial activo pero sin plan pago (permitir editar) → mensaje informativo */}
      {!formData?.membresia_activa && formData?.trial_activo && (
        <div className="mt-4 mb-2 p-4 bg-yellow-500/20 border border-yellow-400 text-yellow-200 rounded text-center font-medium">
          🟡 Estás usando la <strong>prueba gratis</strong>. ¡Aprovecha para configurar tu asistente!
        </div>
      )}

      {/* 🔴 Caso 3: Sin plan y sin trial activo → banner de inactiva con CTA a upgrade */}
      {!formData?.can_edit && !formData?.trial_disponible && !formData?.trial_activo && (
        <div className="mt-4 mb-2 p-4 bg-red-500/20 border border-red-400 text-red-200 rounded text-center font-medium">
          🚫 Tu membresía está inactiva. No puedes guardar cambios ni entrenar el asistente.{` `}
          <a onClick={() => router.push('/upgrade')} className="underline cursor-pointer">
            Activa un plan para continuar.
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
          {saving ? 'Guardando...' : formData.can_edit ? 'Guardar Cambios' : 'Actualizar Membresía'}
        </button>
      </div>
      <Footer />
    </div>
  );
}
