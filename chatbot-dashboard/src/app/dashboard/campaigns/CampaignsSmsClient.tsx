"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import Footer from "@/components/Footer";
import {
  SiTwilio,
  SiGoogleanalytics,
  SiCampaignmonitor,
  SiMinutemailer,
  SiGooglecalendar,
} from "react-icons/si";
import { FaAddressBook } from "react-icons/fa";
import TrainingHelp from "@/components/TrainingHelp";

export default function CampaignsSmsClient() {
  const [form, setForm] = useState({
    nombre: "",
    contenido: "",
    fecha_envio: "",
    segmentos: [] as string[],
  });

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contactos, setContactos] = useState<any[]>([]);
  const [cantidadContactos, setCantidadContactos] = useState(0);
  const [loading, setLoading] = useState(false);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/campaigns`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const smsOnly = (data || []).filter((c: any) => c.canal === "sms");
        setCampaigns(smsOnly);
      });

    fetch(`${BACKEND_URL}/api/contactos`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setContactos(data || []));

    fetch(`${BACKEND_URL}/api/contactos/count`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCantidadContactos(data.total || 0));
  }, []);

  const toggleSegmento = (id: string) => {
    setForm((prev) => ({
      ...prev,
      segmentos: prev.segmentos.includes(id)
        ? prev.segmentos.filter((s) => s !== id)
        : [...prev.segmentos, id],
    }));
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const verEntregas = async (campanaId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/campaigns/${campanaId}/sms-status`, {
        credentials: "include",
      });
      const data = await res.json();
      setEntregas(data);
      setModalVisible(true);
    } catch (err) {
      alert("No se pudo cargar el detalle de entregas.");
    }
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.fecha_envio || form.segmentos.length === 0) {
      alert("Completa todos los campos.");
      return;
    }

    const destinatarios = contactos
      .filter((c: any) => form.segmentos.includes(c.segmento))
      .map((c: any) => c.telefono)
      .filter((t: string) => /^\+?\d{10,15}$/.test(t));

    if (destinatarios.length === 0) {
      alert("❌ No hay números válidos para enviar SMS.");
      return;
    }

    const data = new FormData();
    data.append("nombre", form.nombre);
    data.append("canal", "sms");
    data.append("contenido", form.contenido);
    data.append("fecha_envio", form.fecha_envio);
    data.append("segmentos", JSON.stringify(destinatarios));

    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/campaigns`, {
        method: "POST",
        body: data,
        credentials: "include",
      });

      const json = await res.json();
      setLoading(false);

      if (res.ok) {
        alert("✅ Campaña enviada");
        setForm({ nombre: "", contenido: "", fecha_envio: "", segmentos: [] });
        setCampaigns((prev) => [json, ...prev]);
      } else {
        alert(`❌ ${json.error || "Error desconocido"}`);
      }
    } catch (err) {
      setLoading(false);
      console.error("❌ Error de red:", err);
      alert("❌ Error al conectar con el servidor.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-center flex items-center gap-2 mb-8 text-purple-300">
        <SiTwilio className="text-red-300 animate-pulse" /> Campañas por SMS
      </h1>

      <TrainingHelp context="campaign" />

      <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
        <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
          <FaAddressBook /> Contactos cargados ({cantidadContactos}/1500)
        </h3>
        <p className="text-sm text-white/50">
          Puedes subir contactos desde la sección de campañas o segmentarlos por nombre.
        </p>
      </div>

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiCampaignmonitor /> Nombre de la campaña
      </label>
      <input
        name="nombre"
        value={form.nombre}
        onChange={handleChange}
        placeholder="Nombre de la campaña"
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiMinutemailer /> Contenido del SMS
      </label>
      <textarea
        name="contenido"
        value={form.contenido}
        onChange={handleChange}
        placeholder="Ej: 🎉 ¡Hola! Aún tienes tu clase GRATIS disponible. Reserva ahora  👉 [link]. ¡Te esperamos!"
        className="w-full p-2 mb-4 bg-white/10 border border-white/20 rounded"
        rows={3}
      />

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiGooglecalendar /> Fecha y hora de envío
      </label>
      <input
        type="datetime-local"
        name="fecha_envio"
        value={form.fecha_envio}
        onChange={handleChange}
        className="w-full mb-6 p-2 rounded bg-white/10 border border-white/20"
      />

      <div className="mb-6">
        <h3 className="text-white mb-2 flex items-center gap-2">
          <SiCampaignmonitor /> Segmentos
        </h3>
        {"cliente,leads,otros".split(",").map((seg) => (
          <label key={seg} className="block text-white text-sm mb-1">
            <input
              type="checkbox"
              checked={form.segmentos.includes(seg)}
              onChange={() => toggleSegmento(seg)}
              className="mr-2"
            />
            {seg}
          </label>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Enviando..." : "Programar campaña SMS"}
      </button>

      <hr className="my-10 border-white/20" />

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
        <SiGoogleanalytics /> Campañas programadas/enviadas
      </h2>

      {campaigns.length === 0 ? (
        <p className="text-white/70">No hay campañas SMS registradas aún.</p>
      ) : (
        <ul className="space-y-4 text-white text-sm">
          {campaigns.map((c) => (
            <li key={c.id} className="border border-white/10 rounded p-4 bg-white/5">
              <div className="flex items-center gap-2 mb-1 text-white/80">
                <SiGooglecalendar /> {new Date(c.programada_para).toLocaleString()}
              </div>
              <div className="mb-1">
                <strong className="text-white">{c.nombre}</strong>
              </div>
              <div className="text-white/90">{c.contenido}</div>
              <div className="mt-2">
                <button
                  onClick={() => verEntregas(c.id)}
                  className="text-sm text-blue-400 underline"
                >
                  Ver entregas
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

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
                    <div>📱 {e.telefono}</div>
                    <div>📤 Estado: {e.status}</div>
                    {e.error_message && (
                      <div className="text-red-400 text-xs">⚠️ {e.error_message}</div>
                    )}
                    <div className="text-xs text-white/40">
                      {new Date(e.timestamp).toLocaleString()}
                    </div>
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
