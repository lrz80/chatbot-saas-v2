"use client";

import { useEffect, useRef, useState } from "react";
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
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { DateTime } from "luxon";
import { useSearchParams } from "next/navigation";
import EmailLogViewer from "@/components/EmailLogViewer";

export default function CampaignsEmailClient() {
  const [form, setForm] = useState({
    nombre: "",
    contenido: "",
    fecha_envio: "",
    segmentos: [] as string[],
    link_url: "",
    imagen: null as File | null,
    archivo_adjunto: null as File | null,
    asunto: "",
  });

  const searchParams = useSearchParams();
  const creditoOk = searchParams.get("credito") === "ok";
  const contactosOk = searchParams.get("contactos") === "ok";
  const [emailLogs, setEmailLogs] = useState<Record<number, any[]>>({});

  const [limiteContactos, setLimiteContactos] = useState(500);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contactos, setContactos] = useState<any[]>([]);
  const [cantidadContactos, setCantidadContactos] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null);
  const [membresiaActiva, setMembresiaActiva] = useState<boolean>(false);
  const [usoEmail, setUsoEmail] = useState<{ usados: number; limite: number } | null>(null);
  const [archivoCsv, setArchivoCsv] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [cargandoLogsId, setCargandoLogsId] = useState<number | null>(null);
  const [errorLogsCampana, setErrorLogsCampana] = useState<number | null>(null);


  const cargarCampañas = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/campaigns`, { credentials: "include" });
      const data = await res.json();
      const emailCampaigns = Array.isArray(data) ? data.filter((c: any) => c.canal === "email") : [];
  
      const enriched = await Promise.all(
        emailCampaigns.map(async (c: any) => {
          try {
            const res = await fetch(`${BACKEND_URL}/api/email-status?campaign_id=${c.id}`, {
              credentials: "include",
            });
            const entregas = res.ok ? await res.json() : [];
            return { ...c, entregas };
          } catch {
            return { ...c, entregas: [] };
          }
        })
      );
  
      setCampaigns(enriched);
    } catch (err) {
      console.error("❌ Error cargando campañas:", err);
    }
  };
  
  const cargarContactos = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/contactos`, { credentials: "include" });
      const data = await res.json();
      setContactos(data || []);
    } catch (err) {
      console.error("❌ Error cargando contactos:", err);
    }
  };
  
  const cargarLimite = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/contactos/limite`, { credentials: "include" });
      const data = await res.json();
      setLimiteContactos(data.limite || 500);
      setCantidadContactos(data.total || 0);
    } catch (err) {
      console.error("❌ Error cargando límite de contactos:", err);
    }
  };
  
  const cargarUso = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/usage`, { credentials: "include" });
      const data = await res.json();
  
      const email = data.usos?.find((u: any) => u.canal === "email");
      setUsoEmail({ usados: email?.usados ?? 0, limite: email?.limite ?? 500 });
  
      const usoContactos = data.usos?.find((u: any) => u.canal === "contactos");
      setLimiteContactos(usoContactos?.limite || 500);
    } catch (err) {
      console.error("❌ Error cargando uso de email/contactos:", err);
    }
  };  

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        // ✅ 1. Validar sesión y membresía
        const res = await fetch(`${BACKEND_URL}/api/settings`, { credentials: "include" });
        if (!res.ok) throw new Error("No autorizado");
  
        const data = await res.json();
        setMembresiaActiva(data?.membresia_activa === true);
  
        // ✅ 2. Solo si pasa la validación, cargar todo lo demás
        await Promise.all([
          cargarCampañas(),
          cargarContactos(),
          cargarLimite(),
          cargarUso()
        ]);
      } catch (err) {
        console.error("❌ Error validando sesión:", err);
      }
    };
  
    cargarTodo();
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
          asunto: "",
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

  const handleSubirCsv = async () => {
    if (!archivoCsv) return;
  
    // Validación básica: ejemplo, tamaño 5MB max y .csv
    if (archivoCsv.size > 5 * 1024 * 1024 || !archivoCsv.name.endsWith(".csv")) {
      alert("❌ El archivo debe ser .csv y pesar menos de 5MB");
      return;
    }
  
    // Validar límite
    if (cantidadContactos >= limiteContactos) {
      alert("❌ Has alcanzado el límite de contactos. Compra más para subir tu lista.");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("file", archivoCsv);
  
      const res = await fetch(`${BACKEND_URL}/api/contactos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
  
      const json = await res.json();
  
      if (res.ok) {
        alert(`✅ ${json.nuevos} contactos agregados`);
        inputRef.current?.value && (inputRef.current.value = "");
        setArchivoCsv(null);
        setCantidadContactos((prev) => prev + json.nuevos);
      } else {
        alert(`❌ ${json.error || "Error al subir archivo"}`);
      }
    } catch (err) {
      console.error("❌ Error al subir archivo:", err);
      alert("❌ Falló la conexión con el servidor");
    }
  };
  
  const eliminarCampana = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta campaña?")) return;
  
    try {
      const res = await fetch(`${BACKEND_URL}/api/campaigns/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
  
      const data = await res.json();
  
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== data.id));
        alert(data.message || "✅ Campaña eliminada");
      } else if (res.status === 404) {
        alert("❌ La campaña ya fue eliminada o no te pertenece.");
      } else {
        alert(`❌ ${data.error || "Error al eliminar campaña"}`);
      }
    } catch (err) {
      console.error("❌ Error al eliminar:", err);
      alert("❌ Error al conectar con el servidor.");
    }
  };  

  const handleEliminarContactos = async () => {
    if (!confirm("¿Estás seguro? Esta acción eliminará todos tus contactos.")) return;
  
    try {
      const res = await fetch(`${BACKEND_URL}/api/contactos`, {
        method: "DELETE",
        credentials: "include",
      });
  
      const json = await res.json();
  
      if (res.ok) {
        alert("✅ Contactos eliminados correctamente");
        setContactos([]);
        setCantidadContactos(0);
      } else {
        alert(`❌ ${json.error || "No se pudo eliminar"}`);
      }
    } catch (err) {
      console.error("❌ Error al eliminar contactos:", err);
      alert("❌ Error al conectar con el servidor");
    }
  };

  const comprarMasContactos = async (cantidad: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout-credit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: "contactos",
          cantidad,
          redirectPath: "/dashboard/campaigns/sms",
        }),
      });
  
      const json = await res.json();
  
      if (res.ok && json.url) {
        window.location.href = json.url;
      } else {
        alert("❌ No se pudo iniciar el pago");
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert("❌ Falló la solicitud");
    }
  };  
  
  useEffect(() => {
    const url = new URL(window.location.href);
    let updated = false;
  
    if (creditoOk) {
      url.searchParams.delete("credito");
      updated = true;
    }
  
    if (contactosOk) {
      url.searchParams.delete("contactos");
      updated = true;
    }
  
    if (updated) {
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [creditoOk, contactosOk]);  

  const usoContactos = {
    usados: contactos.length || 0,
    limite: limiteContactos || 500,
  };
  
  const porcentajeContactos = usoContactos.limite > 0
  ? (usoContactos.usados / usoContactos.limite) * 100
  : 0;

  let colorBarra = "bg-green-500";
  if (porcentajeContactos >= 90) {
    colorBarra = "bg-red-500";
  } else if (porcentajeContactos >= 70) {
    colorBarra = "bg-yellow-400";
  }

  const cargarLogsPorCampaña = async (campaignId: number) => {
    try {
      let res = await fetch(`${BACKEND_URL}/api/email-status/?campaign_id=${campaignId}`, {
        credentials: "include",
      });
  
      // ⏳ Reintento si da error 401
      if (res.status === 401) {
        console.warn("⚠️ Token posiblemente expirado. Revalidando...");
        const resCheck = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: "include",
        });
        if (!resCheck.ok) throw new Error("Sesión expirada");
  
        // Segundo intento tras validar sesión
        res = await fetch(`${BACKEND_URL}/api/email-status/?campaign_id=${campaignId}`, {
          credentials: "include",
        });
      }
  
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const logs = Array.isArray(data) ? data : [];
  
      setEmailLogs((prev) => ({ ...prev, [campaignId]: logs }));
      setErrorLogsCampana(null); // ✅ limpia error si se resolvió
    } catch (err) {
      console.error("❌ Error cargando logs:", err);
      setErrorLogsCampana(campaignId);
      setEmailLogs((prev) => ({ ...prev, [campaignId]: [] }));
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-center flex items-center gap-2 mb-8 text-purple-300">
        <SiMinutemailer className="text-blue-400 animate-pulse" /> Campañas por Email
      </h1>
      {contactosOk && (
        <div className="bg-green-600/20 border border-green-500 text-green-300 p-4 rounded mb-6 text-sm">
          ✅ Límite de contactos ampliado exitosamente. Ya puedes cargar más contactos.
        </div>
      )}

      <TrainingHelp context="campaign-email" />

      {usoEmail && (
        <div className="mb-4 text-sm text-white/80">
          📧 Has enviado {usoEmail.usados} de {usoEmail.limite} campañas por email este mes.
        </div>
      )}

      <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
        <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
          <FaAddressBook /> Contactos
        </h3>
        <p className="text-white text-sm mb-2">
          {usoContactos.usados} de {usoContactos.limite} contactos usados
        </p>
        <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
          <div
            className={`h-full ${colorBarra} transition-all duration-500`}
            style={{ width: `${porcentajeContactos}%` }}
          />
        </div>

        <div className="flex gap-2 mb-4">
          {[500, 1000, 2000].map((extra) => (
            <button
              key={extra}
              onClick={() => comprarMasContactos(extra)}
              className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-white text-sm"
            >
              +{extra} contactos
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded font-semibold text-white w-full md:w-auto"
          >
            Seleccionar archivo
          </button>

          <input
            type="file"
            accept=".csv"
            ref={inputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setArchivoCsv(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <button
            onClick={handleEliminarContactos}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-semibold text-white w-full md:w-auto"
          >
            Eliminar contactos
          </button>

          {archivoCsv && (
            <button
              onClick={handleSubirCsv}
              className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-semibold text-white w-full md:w-auto"
            >
              Subir contactos
            </button>
          )}
        </div>
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
        <SiMinutemailer /> Asunto del email
      </label>
      <input
        name="asunto"
        value={form.asunto}
        onChange={handleChange}
        placeholder="Asunto del correo"
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
      onClick={() => {
        if (!membresiaActiva) {
          alert("❌ Tu membresía no está activa. Actívala para usar campañas Email.");
          return;
        }
        handleSubmit();
      }}
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
        <ul className="space-y-6 text-white text-sm">
          {campaigns.map((c) => {
            const logs = emailLogs[c.id] || [];
            const enviados = logs.length;
            const fallidos = Array.isArray(logs)
              ? logs.filter((l) => l.status === "failed").length
              : 0;
            const exitosos = enviados - fallidos;

            return (
              <li key={c.id} className="border border-white/10 rounded p-4 bg-white/5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold text-white mb-1">{c.nombre}</div>
                    <div className="text-white/80 mb-1">
                      <SiGooglecalendar className="inline mr-1" />{" "}
                      {new Date(c.programada_para).toLocaleString("es-ES", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>

                    {logs.length > 0 && (
                      <div className="text-white/70 text-xs mt-1 space-y-1">
                        <div>
                          📤 Enviados:{" "}
                          <span className="font-semibold">{enviados}</span>
                        </div>
                        <div>
                          ✅ Entregados:{" "}
                          <span className="text-green-400 font-semibold">{exitosos}</span>
                        </div>
                        <div>
                          ❌ Fallidos:{" "}
                          <span className="text-red-400 font-semibold">{fallidos}</span>
                        </div>
                      </div>
                    )}

                    {c.contenido && (
                      <div className="text-white/90 italic mb-1">📧 {c.contenido}</div>
                    )}
                    {c.link_url && (
                      <div className="mt-1 text-blue-400 underline text-sm">
                        <a
                          href={c.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          🔗 Ver enlace
                        </a>
                      </div>
                    )}
                    {c.imagen_url && (
                      <div className="mt-2">
                        <img
                          src={c.imagen_url}
                          alt="Imagen campaña"
                          className="max-h-32 border border-white/10 rounded"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      </div>
                    )}

                    {c.archivo_adjunto_url && (
                      <div className="mt-2 text-blue-300 underline text-sm">
                        <a
                          href={c.archivo_adjunto_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          📎 Descargar archivo adjunto
                        </a>
                      </div>
                    )}

                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                      className={`px-4 py-1 border rounded ${
                        expandedCampaignId === c.id ? "bg-red-500/10 hover:bg-red-500/20" : "bg-white/10 hover:bg-white/20"
                      } border-white/20`}
                      disabled={cargandoLogsId === c.id}
                      onClick={async () => {
                        const isSame = c.id === expandedCampaignId;
                        if (isSame) {
                          setExpandedCampaignId(null);
                          return;
                        }

                        if (!emailLogs[c.id]) {
                          setCargandoLogsId(c.id);
                          setErrorLogsCampana(null);

                          try {
                            await cargarLogsPorCampaña(c.id);
                            setExpandedCampaignId(c.id);
                          } catch (err) {
                            setErrorLogsCampana(c.id);
                            console.error("❌ Error al cargar logs:", err);
                          } finally {
                            setCargandoLogsId(null);
                          }
                        } else {
                          setExpandedCampaignId(c.id);
                        }
                      }}
                    >
                      {cargandoLogsId === c.id
                        ? "Cargando..."
                        : expandedCampaignId === c.id
                        ? "Ocultar"
                        : "Ver más"}
                    </button>

                    <button
                      className="px-4 py-1 bg-red-500/80 hover:bg-red-600 border border-white/20 rounded text-white"
                      onClick={() => eliminarCampana(c.id)}
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                </div>

                {expandedCampaignId === c.id && (
                  <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/80">
                    Esta campaña fue enviada por el canal <strong>Email</strong> y está programada para:{" "}
                    <span className="text-white font-semibold">
                      {new Date(c.programada_para).toLocaleString("es-ES", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}
                    </span>
                    .

                    {errorLogsCampana === c.id ? (
                      <p className="text-red-400 mt-2">⚠️ No estás autorizado para ver esta información.</p>
                    ) : (
                      <div className="mt-4">
                        <EmailLogViewer campaignId={c.id} />
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Footer />
    </div>
  );
}
