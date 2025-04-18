'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BriefcaseIcon } from '@heroicons/react/24/outline';
import { BACKEND_URL } from '@/utils/api';

export default function BusinessProfilePage() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Error al obtener settings');
        const data = await res.json();
        setFormData({
          nombre_negocio: data.name,
          horario_atencion: data.horario_atencion,
          categoria: data.categoria,
          idioma: data.idioma,
          twilio_number: data.twilio_number,
          twilio_sms_number: data.twilio_sms_number,
          twilio_voice_number: data.twilio_voice_number,
          plan: data.plan,
          fecha_registro: data.fecha_registro,
          owner_name: data.owner_name,
          email: data.email,
          membresia_activa: data.membresia_activa,
          membresia_vigencia: data.membresia_vigencia,
        });

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
      router.push('/dashboard/profile?upgrade=1');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
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

  if (loading) return <p className="text-center text-white">Cargando información del negocio...</p>;

  return (
    <div className="max-w-6xl mx-auto bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-black/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <BriefcaseIcon className="h-8 w-8 text-indigo-300" />
        <h2 className="text-2xl font-bold text-indigo-300">Perfil del Negocio</h2>
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

        <div>
          <label className="text-sm text-indigo-200 font-semibold">Categoría del Negocio</label>
          <select
            name="categoria"
            value={formData.categoria || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md text-white"
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
          <label className="text-sm text-indigo-200 font-semibold">Correo del Administrador</label>
          <input
            value={formData.email}
            disabled
            className="w-full bg-white/10 border border-white/20 px-3 py-2 rounded-md text-gray-400"
          />
        </div>

        {[
          { label: 'Número de Twilio (WhatsApp)', value: formData.twilio_number },
          { label: 'Número de Twilio (SMS)', value: formData.twilio_sms_number },
          { label: 'Número de Twilio (Voz)', value: formData.twilio_voice_number }
        ].map(({ label, value }, i) => (
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
          <a href="/dashboard/profile?upgrade=1" className="underline">
            Actívala para editar tus datos.
          </a>
        </div>
      )}

      <div className="mt-6 text-right">
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
    </div>
  );
}
