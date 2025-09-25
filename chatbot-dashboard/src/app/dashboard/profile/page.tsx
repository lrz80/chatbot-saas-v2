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
  const [availabilityHeadersText, setAvailabilityHeadersText] = useState<string>(
    '{\n  "Authorization": "Bearer ..."\n}'
  );

  // Helpers para leer anidados de settings (soporta distintos alias)
  const pickBookingUrl = (settings: any): string => {
    const s = settings || {};
    const b = s.booking || {};
    return (
      b.booking_url ||
      s.booking_url ||
      s.reservas_url ||
      s.agenda_url ||
      s.booking ||
      ''
    );
  };
  const pickAvailabilityUrl = (settings: any): string => {
    const s = settings || {};
    const b = s.booking || {};
    return b.api_url || s.availability_api_url || s.booking_api_url || '';
  };
  const pickAvailabilityHeaders = (settings: any): Record<string, any> | null => {
    const s = settings || {};
    const b = s.booking || {};
    return b.headers || s.availability_headers || null;
  };

  // 🚀 Mover fetchSettings fuera del useEffect
  const fetchSettings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Error al obtener settings');
      const data = await res.json();

      // base
      setFormData({
        tenant_id: data.tenant_id,
        nombre_negocio: data.name,
        horario_atencion: data.horario_atencion,
        categoria: data.categoria,
        idioma: data.idioma,
        logo_url: data.logo_url,
        twilio_number: data.twilio_number,
        twilio_sms_number: data.twilio_sms_number,
        twilio_voice_number: data.twilio_voice_number,
        plan: data.plan,
        fecha_registro: data.fecha_registro,
        owner_name: data.owner_name,
        email: data.email,
        email_negocio: data.email_negocio || '',
        telefono_negocio: data.telefono_negocio || '',
        membresia_activa: data.membresia_activa,
        membresia_vigencia: data.membresia_vigencia,
        es_trial: data.es_trial,
        estado_membresia_texto: data.estado_membresia_texto,
      });
      setDireccion(data.direccion || '');

      // nuevos campos desde settings
      const settings = data.settings || {};
      setBookingUrl(pickBookingUrl(settings));
      setAvailabilityApiUrl(pickAvailabilityUrl(settings));
      const hdrs = pickAvailabilityHeaders(settings);
      if (hdrs && typeof hdrs === 'object') {
        try {
          setAvailabilityHeadersText(JSON.stringify(hdrs, null, 2));
        } catch {
          // si falla, lo dejamos como estaba
        }
      }
    } catch (error) {
      console.error('❌ Error al obtener settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.membresia_activa) {
      router.push('/upgrade');
      return;
    }

    // Validar headers JSON (si el usuario lo modificó)
    let headersObj: Record<string, any> | undefined = undefined;
    if (availabilityHeadersText && availabilityHeadersText.trim().length) {
      try {
        headersObj = JSON.parse(availabilityHeadersText);
        if (typeof headersObj !== 'object' || Array.isArray(headersObj)) {
          throw new Error('Headers debe ser un objeto JSON');
        }
      } catch (e: any) {
        alert(`❌ Headers inválidos: ${e?.message || e}`);
        return;
      }
    }

    setSaving(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const payload: SettingsPayload = {
        nombre_negocio: formData.nombre_negocio,
        horario_atencion: formData.horario_atencion,
        categoria: formData.categoria,
        idioma: formData.idioma,
        logo_url: formData.logo_url || '',
        direccion,
        email_negocio: formData.email_negocio || '',
        telefono_negocio: formData.telefono_negocio || '',

        // NUEVO: booking & availability
        booking_url: bookingUrl || undefined,
        // (opcional: puedes usar los alias si quieres rellenarlos todos)
        reservas_url: undefined,
        agenda_url: undefined,
        booking: undefined,

        availability_api_url: availabilityApiUrl || undefined,
        booking_api_url: undefined,
        availability_headers: headersObj,

        // Enviamos timezone en silencio
        timezone: tz,
      };

      const res = await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'PATCH', // te mantengo PATCH como ya tenías
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('✅ Cambios guardados correctamente');
        await fetchSettings(); // refresca con lo almacenado en DB
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`❌ Error al guardar cambios${data?.error ? `: ${data.error}` : ''}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error en la conexión');
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-3xl md:text-4xl font-extrabold text-center flex justify-center items-center gap-2 mb-8 text-purple-300">
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
          label: 'Número del Asistente (WhatsApp)',
          value: formData.twilio_number
        }, {
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

        {/* ===== NUEVOS CAMPOS ===== */}
        <div className="md:col-span-2 border-t border-white/10 pt-4 mt-2">
          <h2 className="text-lg font-semibold text-purple-300 mb-3">Reservas & Disponibilidad</h2>

          {/* Booking URL */}
          <div className="mb-4">
            <label className="text-sm text-indigo-200 font-semibold">URL de Reservas (Booking URL)</label>
            <input
              type="url"
              placeholder="https://miagenda.com/tu-negocio"
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
              className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <p className="text-xs text-white/60 mt-1">
              Puedes usar servicios como Calendly, Booksy, etc. El backend guarda el primer alias disponible.
            </p>
          </div>

          {/* Availability API URL */}
          <div className="mb-4">
            <label className="text-sm text-indigo-200 font-semibold">Availability API URL</label>
            <input
              type="url"
              placeholder="https://api.miagenda.com/v1/availability"
              value={availabilityApiUrl}
              onChange={(e) => setAvailabilityApiUrl(e.target.value)}
              className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <p className="text-xs text-white/60 mt-1">Alias opcional: booking_api_url.</p>
          </div>

          {/* Headers JSON */}
          <div className="mb-2">
            <label className="text-sm text-indigo-200 font-semibold">Headers para Availability (JSON)</label>
            <textarea
              rows={6}
              value={availabilityHeadersText}
              onChange={(e) => setAvailabilityHeadersText(e.target.value)}
              className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md font-mono text-sm"
            />
            <p className="text-xs text-white/60 mt-1">
              Ejemplo: {'{ "Authorization": "Bearer XYZ", "X-Tenant": "abc" }'}
            </p>
          </div>
        </div>
        {/* ===== FIN NUEVOS CAMPOS ===== */}

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
              ? new Date(formData.fecha_registro).toLocaleDateString()
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

      {!formData.membresia_activa && (
        <div className="mt-4 mb-2 p-4 bg-yellow-500/20 border border-yellow-400 text-yellow-200 rounded text-center font-medium">
          🚫 Tu membresía está inactiva.{' '}
          <a onClick={() => router.push('/upgrade')} className="underline cursor-pointer">
            Actívala para editar tus datos.
          </a>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={handleSave}
          className={`px-6 py-2 rounded-md shadow-lg transition text-white ${
            saving || !formData.membresia_activa
              ? 'bg-gray-600 hover:bg-yellow-600 cursor-pointer'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
          }`}
        >
          {saving ? 'Guardando...' : formData.membresia_activa ? 'Guardar Cambios' : 'Actualizar Membresía'}
        </button>
      </div>
      <Footer />
    </div>
  );
}
