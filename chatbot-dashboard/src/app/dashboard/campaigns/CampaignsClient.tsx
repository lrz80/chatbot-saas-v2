"use client";

import { useState, useEffect } from "react";
import { SiGmail } from "react-icons/si";
import TrainingHelp from "@/components/TrainingHelp";
import { BACKEND_URL } from "@/utils/api";

const SEGMENTOS = [
  { id: "cliente", label: "Cliente" },
  { id: "nuevos", label: "Nuevos" },
  { id: "leads", label: "Leads" },
  { id: "otros", label: "Otros" },
];

export default function CampaignsClient() {
  const [form, setForm] = useState({
    nombre: "",
    canal: "whatsapp",
    contenido: "",
    fecha_envio: "",
    imagen: null as File | null,
    segmentos: [] as string[],
  });

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [usage, setUsage] = useState<{ [canal: string]: number }>({});
  const [cantidadContactos, setCantidadContactos] = useState(0);
  const [showSegmentos, setShowSegmentos] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/campaigns`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCampaigns(data))
      .catch((err) => console.error("❌ Error al cargar campañas:", err));

    fetch(`${BACKEND_URL}/api/campaigns/usage`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const map = Object.fromEntries(data.map((d: any) => [d.canal, Number(d.total)]));
        setUsage(map);
      })
      .catch((err) => console.error("❌ Error al cargar uso de campañas:", err));

    fetch(`${BACKEND_URL}/api/contactos/count`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCantidadContactos(data.total || 0))
      .catch((err) => console.error("❌ Error al contar contactos:", err));
  }, []);

  const handleChange = (e: any) => {
    const { name, value, files } = e.target;
    if (name === "imagen") {
      setForm((prev) => ({ ...prev, imagen: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleSegmento = (id: string) => {
    setForm((prev) => ({
      ...prev,
      segmentos: prev.segmentos.includes(id)
        ? prev.segmentos.filter((s) => s !== id)
        : [...prev.segmentos, id],
    }));
  };

  const handleUploadContactos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/contactos/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        alert(`✅ Contactos subidos: ${data.nuevos}`);
        setCantidadContactos((prev) => prev + data.nuevos);
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error("❌ Error al subir contactos:", err);
    }
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.contenido || !form.fecha_envio || form.segmentos.length === 0) {
      alert("Por favor completa todos los campos requeridos.");
      return;
    }

    if (new Date(form.fecha_envio) <= new Date()) {
      alert("La fecha de envío debe ser futura.");
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === "segmentos") {
        data.append("segmentos", JSON.stringify(val));
      } else if (key === "imagen" && val) {
        data.append("imagen", val as File);
      } else {
        data.append(key, val as string);
      }
    });

    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/campaigns`, {
        method: "POST",
        body: data,
        credentials: "include",
      });
      setLoading(false);

      if (res.ok) {
        const nueva = await res.json();
        setCampaigns((prev) => [nueva, ...prev]);
        setForm({ nombre: "", canal: "whatsapp", contenido: "", fecha_envio: "", imagen: null, segmentos: [] });
        alert("✅ Campaña guardada");
      } else {
        const error = await res.json();
        alert(`❌ ${error.error || "Error al guardar campaña."}`);
      }
    } catch (err) {
      setLoading(false);
      console.error("❌ Error de red:", err);
      alert("❌ Error al conectar con el servidor.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <SiGmail className="text-[#D14836]" size={28} />
        Crear nueva campaña
      </h2>

      <TrainingHelp context="campaign" />

      {usage && (
        <div className="mb-6 flex flex-wrap gap-4 text-sm text-white/70">
          <div>📲 WhatsApp usados: {usage.whatsapp || 0} / 300</div>
          <div>📩 SMS usados: {usage.sms || 0} / 500</div>
          <div>📧 Emails usados: {usage.email || 0} / 1000</div>
        </div>
      )}

      <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
        <h3 className="font-bold text-white text-lg mb-2">📁 Contactos cargados ({cantidadContactos}/300)</h3>
        <input
          type="file"
          accept=".csv"
          onChange={handleUploadContactos}
          className="block mb-2 text-sm text-white/70"
        />
        <p className="text-sm text-white/50">
          El archivo debe tener columnas: nombre, email, telefono, segmento
        </p>
      </div>
      
      <button
        onClick={async () => {
          const confirmar = confirm("¿Seguro que deseas eliminar todos los contactos?");
          if (!confirmar) return;

          try {
            const res = await fetch(`${BACKEND_URL}/api/contactos`, {
              method: "DELETE",
              credentials: "include",
            });

            const data = await res.json();
            if (res.ok) {
              alert("✅ Contactos eliminados.");
              setCantidadContactos(0);
            } else {
              alert(`❌ ${data.error}`);
            }
          } catch (err) {
            console.error("❌ Error al eliminar contactos:", err);
          }
        }}
        className="text-red-400 hover:text-red-600 text-sm underline mt-2"
      >
        🗑️ Eliminar todos los contactos
      </button>

      <label className="block mb-2 font-medium">📝 Nombre de la campaña</label>
      <input
        name="nombre"
        value={form.nombre}
        onChange={handleChange}
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />
  
      <label className="block mb-2 font-medium">📲 Canal</label>
      <select
        name="canal"
        value={form.canal}
        onChange={handleChange}
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      >
        <option value="whatsapp">WhatsApp</option>
        <option value="sms">SMS</option>
        <option value="email">Correo Electrónico</option>
      </select>
  
      <label className="block mb-2 font-medium">💬 Contenido del mensaje</label>
      <textarea
        name="contenido"
        value={form.contenido}
        onChange={handleChange}
        rows={4}
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />
  
      <label className="block mb-2 font-medium">🖼️ Imagen (opcional)</label>
      <input
        name="imagen"
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="mb-4"
      />
  
      {form.imagen && (
        <img
          src={URL.createObjectURL(form.imagen)}
          alt="Preview"
          className="mb-4 rounded border border-white/20 max-h-48"
        />
      )}
  
      <label className="block mb-2 font-medium">📅 Fecha y hora de envío</label>
      <input
        name="fecha_envio"
        type="datetime-local"
        value={form.fecha_envio}
        onChange={handleChange}
        className="w-full mb-6 p-2 rounded bg-white/10 border border-white/20"
      />
  
      <div className="mb-6">
        <button
          onClick={() => setShowSegmentos((s) => !s)}
          className="mb-2 text-indigo-300 underline hover:text-indigo-400"
        >
          {showSegmentos ? "🔽 Ocultar segmentos" : "▶️ Elegir segmentos"}
        </button>
        {showSegmentos && (
          <div className="grid grid-cols-2 gap-2 border border-white/10 bg-white/5 rounded p-4">
            {SEGMENTOS.map((seg) => (
              <label key={seg.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.segmentos.includes(seg.id)}
                  onChange={() => toggleSegmento(seg.id)}
                />
                {seg.label}
              </label>
            ))}
          </div>
        )}
      </div>
  
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Enviando..." : "Programar campaña"}
      </button>
  
      <hr className="my-10 border-white/20" />
  
      <h2 className="text-xl font-bold mb-4">📊 Estadísticas de campañas enviadas</h2>
  
      {campaigns.length === 0 ? (
        <p className="text-white/70">Aún no se han enviado campañas.</p>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full table-auto bg-white/5 border border-white/10 rounded-lg text-white">
            <thead>
              <tr className="text-left text-white/80 bg-white/10">
                <th className="p-3">📝 Nombre</th>
                <th className="p-3">📲 Canal</th>
                <th className="p-3">📅 Fecha</th>
                <th className="p-3">📤 Estado</th>
                <th className="p-3">👥 Segmentos</th>
                <th className="p-3">💬 Contenido</th>
                <th className="p-3">🗑️</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-white/10 hover:bg-white/10">
                  <td className="p-3">{c.titulo || c.nombre}</td>
                  <td className="p-3 capitalize">{c.canal}</td>
                  <td className="p-3">{new Date(c.programada_para).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="p-3">{new Date(c.programada_para) > new Date() ? "⏳ Programada" : "✅ Enviada"}</td>
                  <td className="p-3">{Array.isArray(c.destinatarios) ? c.destinatarios.join(", ") : JSON.parse(c.destinatarios || "[]").join(", ")}</td>
                  <td className="p-3 truncate max-w-xs">{c.contenido}</td>
                  <td className="p-3">
                    <button
                      onClick={async () => {
                        const confirmar = confirm("¿Seguro que deseas eliminar esta campaña?");
                        if (!confirmar) return;
                        try {
                          const res = await fetch(`${BACKEND_URL}/api/campaigns/${c.id}`, {
                            method: "DELETE",
                            credentials: "include",
                          });
                          if (res.ok) {
                            setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
                            alert("✅ Campaña eliminada.");
                          } else {
                            alert("❌ No se pudo eliminar.");
                          }
                        } catch (err) {
                          console.error("❌ Error eliminando campaña:", err);
                        }
                      }}
                      className="text-red-400 hover:text-red-600 text-sm underline"
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
    </div>
  );
}  