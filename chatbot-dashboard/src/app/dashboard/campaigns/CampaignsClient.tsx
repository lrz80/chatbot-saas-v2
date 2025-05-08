"use client";

import { useState, useEffect } from "react";
import TrainingHelp from "@/components/TrainingHelp";
import { BACKEND_URL } from "@/utils/api";
import Footer from '@/components/Footer';
import {
  SiGoogleanalytics,
  SiGooglecalendar,
  SiPhotopea,
  SiChatbot,
  SiTwilio,
  SiMinutemailer,
  SiCampaignmonitor,
  SiWhatsapp,
} from "react-icons/si";
import { FaAddressBook } from "react-icons/fa";

const SEGMENTOS = [
  { id: "cliente", label: "Cliente" },
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
  const [modalVisible, setModalVisible] = useState(false);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [contactos, setContactos] = useState<{ nombre: string; telefono: string; segmento: string }[]>([]);


  useEffect(() => {
    fetch(`${BACKEND_URL}/api/campaigns`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const conId = data.map((c: any) => ({
          id: c.id ?? c.campana_id ?? c._id,
          ...c,
        }));
        setCampaigns(conId);
      })
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

  const verEntregas = async (campanaId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/campaigns/${campanaId}/sms-status`, {
        credentials: "include",
      });
      const data = await res.json();
      setEntregas(data);
    } catch (err) {
      console.error("❌ Error al cargar entregas:", err);
      alert("No se pudo cargar el detalle de entregas.");
    }
  };

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
        // luego del alert ✅ Contactos subidos...
        const resContactos = await fetch(`${BACKEND_URL}/api/contactos`, { credentials: "include" });
        const dataContactos = await resContactos.json();
        setContactos(dataContactos || []);
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
  
    // ✅ Filtrar contactos por segmento y extraer teléfonos válidos
    const telefonosFiltrados = contactos
      .filter((c) => form.segmentos.includes(c.segmento) && /^\+?\d{10,15}$/.test(c.telefono))
      .map((c) => c.telefono.trim());
  
    if (telefonosFiltrados.length === 0) {
      alert("❌ No hay números válidos para enviar por WhatsApp.");
      return;
    }
  
    const data = new FormData();
    data.append("nombre", form.nombre);
    data.append("canal", form.canal);
    data.append("contenido", form.contenido);
    data.append("fecha_envio", form.fecha_envio);
    data.append("segmentos", JSON.stringify(telefonosFiltrados));
    if (form.imagen) {
      data.append("imagen", form.imagen);
    }
  
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
      <h1 className="text-3xl md:text-4xl font-extrabold text-center flex justify-center items-center gap-2 mb-8 text-purple-300">
        <SiCampaignmonitor size={36} className="text-sky-400 animate-pulse" /> Crear Nueva Campaña
      </h1>
  
      <TrainingHelp context="campaign" />
  
      {usage && (
        <div className="mb-6 flex flex-wrap gap-4 text-sm text-white/70 items-center">
          <div className="flex items-center gap-2">
            <SiWhatsapp className="text-green-400" /> WhatsApp: {usage.whatsapp || 0} / 300
          </div>
          <div className="flex items-center gap-2">
            <SiTwilio className="text-red-300" /> SMS: {usage.sms || 0} / 500
          </div>
          <div className="flex items-center gap-2">
            <SiMinutemailer className="text-blue-400" /> Email: {usage.email || 0} / 1000
          </div>
        </div>
      )}
  
      <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
        <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
          <FaAddressBook /> Contactos cargados ({cantidadContactos}/1500)
        </h3>
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
  
      <label className="block mb-2 font-medium flex items-center gap-2">
        <SiCampaignmonitor /> Nombre de la campaña
      </label>
      <input
        name="nombre"
        value={form.nombre}
        onChange={handleChange}
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />
  
      <label className="block mb-2 font-medium flex items-center gap-2">
        <SiWhatsapp /> Canal
      </label>
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
  
      <label className="block mb-2 font-medium flex items-center gap-2">
        <SiChatbot /> Contenido del mensaje
      </label>
      <textarea
        name="contenido"
        value={form.contenido}
        onChange={handleChange}
        rows={4}
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />
  
      <label className="block mb-2 font-medium flex items-center gap-2">
        <SiPhotopea /> Imagen (opcional)
      </label>
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
  
      <label className="block mb-2 font-medium flex items-center gap-2">
        <SiGooglecalendar /> Fecha y hora de envío
      </label>
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
  
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <SiGoogleanalytics /> Estadísticas de campañas enviadas
      </h2>
  
      {campaigns.length === 0 ? (
        <p className="text-white/70">Aún no se han enviado campañas.</p>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full table-auto bg-white/5 border border-white/10 rounded-lg text-white">
            <thead>
              <tr className="text-white/80 bg-white/10">
                <th className="p-3">📛 Nombre</th>
                <th className="p-3">📲 Canal</th>
                <th className="p-3">📅 Fecha</th>
                <th className="p-3">📤 Estado</th>
                <th className="p-3">👥 Segmentos</th>
                <th className="p-3">💬 Contenido</th>
                <th className="p-3">⚙️ Acciones</th>
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
                  <td className="p-3 space-y-1">
                    <button
                      onClick={async () => {
                        const confirmar = confirm("¿Seguro que deseas eliminar esta campaña?");
                        if (!confirmar) return;

                        if (!c.id) {
                          alert("❌ Esta campaña no tiene un ID válido.");
                          return;
                        }

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
                      className="text-red-400 hover:text-red-600 text-sm underline block"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => verEntregas(c.id)}
                      className="text-blue-400 hover:text-blue-500 text-sm underline block"
                    >
                      Ver entregas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
  
      {/* Modal de entregas */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1a1a2f] p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4 text-white">📋 Entregas de la campaña</h3>
            {entregas.length === 0 ? (
              <p className="text-white/70">No se encontraron registros.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto text-sm text-white">
                {entregas.map((e, i) => (
                  <li key={i} className="border-b border-white/10 pb-2">
                    <span className="block">📱 {e.telefono}</span>
                    <span className="text-white/50">📤 Estado: {e.estado || 'Enviado'}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 text-right">
              <button
                onClick={() => setModalVisible(false)}
                className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
  
      <Footer />
    </div>
  );
  }
  