"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import Footer from "@/components/Footer";
import {
  SiCampaignmonitor,
  SiMinutemailer,
  SiGooglecalendar,
  SiGoogleanalytics,
  SiLinktree,
} from "react-icons/si";
import { FaAddressBook, FaPaperclip } from "react-icons/fa";
import TrainingHelp from "@/components/TrainingHelp";

export default function CampaignsEmailClient() {
  const [form, setForm] = useState({
    nombre: "",
    contenido: "",
    fecha_envio: "",
    segmentos: [] as string[],
    link_url: "",
    imagen: null as File | null,
    archivo_adjunto: null as File | null,
  });

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contactos, setContactos] = useState<any[]>([]);
  const [cantidadContactos, setCantidadContactos] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/campaigns`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const emailOnly = (data || []).filter((c: any) => c.canal === "email");
        setCampaigns(emailOnly);
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
    const { name, value, files } = e.target;
    if (name === "imagen") {
      setForm((prev) => ({ ...prev, imagen: files[0] }));
    } else if (name === "archivo_adjunto") {
      setForm((prev) => ({ ...prev, archivo_adjunto: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.fecha_envio || form.segmentos.length === 0) {
      alert("Completa todos los campos.");
      return;
    }

    const destinatarios = contactos
      .filter((c: any) => form.segmentos.includes(c.segmento))
      .map((c: any) => c.email)
      .filter((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (destinatarios.length === 0) {
      alert("❌ No hay correos válidos.");
      return;
    }

    const data = new FormData();
    data.append("nombre", form.nombre);
    data.append("canal", "email");
    data.append("contenido", form.contenido);
    data.append("fecha_envio", form.fecha_envio);
    data.append("segmentos", JSON.stringify(destinatarios));
    data.append("link_url", form.link_url);
    if (form.imagen) data.append("imagen", form.imagen);
    if (form.archivo_adjunto) data.append("archivo_adjunto", form.archivo_adjunto);

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
        setForm({
          nombre: "",
          contenido: "",
          fecha_envio: "",
          segmentos: [],
          link_url: "",
          imagen: null,
          archivo_adjunto: null,
        });
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
        <SiMinutemailer className="text-blue-400 animate-pulse" /> Campañas por Email
      </h1>

      <TrainingHelp context="campaign-email" />

      <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
        <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
          <FaAddressBook /> Contactos cargados ({cantidadContactos}/1500)
        </h3>
      </div>

      {/* Campos del formulario */}
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
        <SiLinktree /> Link del Email (opcional)
      </label>
      <input
        type="url"
        name="link_url"
        value={form.link_url}
        onChange={handleChange}
        placeholder="https://tusitio.com/oferta"
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiMinutemailer /> Contenido del Email
      </label>
      <textarea
        name="contenido"
        value={form.contenido}
        onChange={handleChange}
        placeholder="Contenido del Email"
        className="w-full p-2 mb-4 bg-white/10 border border-white/20 rounded"
        rows={4}
      />

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiMinutemailer /> Imagen del Email
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

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <FaPaperclip /> Archivo adjunto (PDF, DOCX, ZIP...)
      </label>
      <input
        name="archivo_adjunto"
        type="file"
        accept=".pdf,.doc,.docx,.zip,.xls,.xlsx,.ppt,.pptx"
        onChange={handleChange}
        className="mb-4"
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
        {["cliente", "leads", "otros"].map((seg) => (
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
        {loading ? "Enviando..." : "Programar campaña Email"}
      </button>

      <hr className="my-10 border-white/20" />

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
        <SiGoogleanalytics /> Campañas programadas/enviadas
      </h2>

      {campaigns.length === 0 ? (
        <p className="text-white/70">No hay campañas Email registradas aún.</p>
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

              {c.link_url && (
                <div className="mt-2 text-blue-400 underline text-sm">
                  <a href={c.link_url} target="_blank" rel="noopener noreferrer">
                    Ver enlace
                  </a>
                </div>
              )}

              {c.imagen_url && (
                <div className="mt-2">
                  <img
                    src={c.imagen_url}
                    alt="Imagen campaña"
                    className="max-h-32 border border-white/10 rounded"
                  />
                </div>
              )}

              {c.archivo_adjunto_url && (
                <div className="mt-2 text-blue-300 underline text-sm">
                  <a
                    href={c.archivo_adjunto_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📎 Ver archivo adjunto
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Footer />
    </div>
  );
}
