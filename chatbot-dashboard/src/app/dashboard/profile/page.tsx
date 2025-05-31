'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BACKEND_URL } from '@/utils/api';
import Footer from '@/components/Footer';

export default function BusinessProfilePage() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const [direccion, setDireccion] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Error al obtener settings');
        const data = await res.json();
        setFormData({
          tenant_id: data.tenant_id,  // 👈 Guardar el tenant_id
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
          email: data.email, // ✅ Correo del ADMIN
          email_negocio: data.email_negocio || '', // ✅ Correo del negocio
          telefono_negocio: data.telefono_negocio || '', // ✅ Teléfono del negocio
          membresia_activa: data.membresia_activa,
          membresia_vigencia: data.membresia_vigencia,
        });
        setDireccion(data.direccion || '');
      } catch (error) {
        console.error('❌ Error al obtener settings:', error);
      } finally {
        setLoading(false);
      }
    };
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
  
    setSaving(true);
    try {
      const payload = {
        nombre_negocio: formData.nombre_negocio,
        horario_atencion: formData.horario_atencion,
        categoria: formData.categoria,
        idioma: formData.idioma,
        logo_url: formData.logo_url || '', // 👈 Nunca dejar undefined o null
        direccion, // 👈 Dirección también se incluye siempre
        email_negocio: formData.email_negocio || '', // ✅ Incluido
        telefono_negocio: formData.telefono_negocio || '', // ✅ Incluido
      };
  
      const res = await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
  
      if (res.ok) alert('✅ Cambios guardados correctamente');
      else alert('❌ Error al guardar cambios');
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
        body: JSON.stringify({
          tenantId: formData.tenant_id,  // 👈 Ahora usamos el ID correcto
        }),
      });
      if (res.ok) {
        alert("✅ Plan cancelado correctamente.");
        window.location.reload();
      } else {
        const data = await res.json();
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
            <img
              src={formData.logo_url}
              alt="Logo del negocio"
              className="h-full w-full object-cover"
            />
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

              const formData = new FormData();
              formData.append("logo", file);

              try {
                const res = await fetch(`${BACKEND_URL}/api/upload-logo`, {
                  method: "POST",
                  credentials: "include",
                  body: formData,
                });

                const data = await res.json();
                if (data.logo_url) {
                  setFormData((prev: any) => ({
                    ...prev,
                    logo_url: data.logo_url,
                  }));
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
          <input
            value={formData.email}
            disabled
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md text-gray-400"
          />
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
          <p className="text-sm text-indigo-200 font-semibold">Estado de la Membresía</p>
          {formData.membresia_activa ? (
            <p className="text-green-400 font-semibold">
              ✅ Activa hasta {new Date(formData.membresia_vigencia).toLocaleDateString()}
            </p>
          ) : (
            <p className="text-red-400 font-semibold">❌ Vencida</p>
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
