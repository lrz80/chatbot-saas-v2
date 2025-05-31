"use client";

import { useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import Footer from "@/components/Footer";
import {
  SiTwilio,
  SiGoogleanalytics,
  SiCampaignmonitor,
  SiMinutemailer,
  SiGooglecalendar,
  SiCheckmarx,
  SiProbot,
  SiStatuspal,
} from "react-icons/si";
import { MdSms } from "react-icons/md";
import { FaAddressBook } from "react-icons/fa";
import TrainingHelp from "@/components/TrainingHelp";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { DateTime } from "luxon";
import { useSearchParams } from "next/navigation";

export default function CampaignsSmsClient() {
  const [form, setForm] = useState({
    nombre: "",
    contenido: "",
    fecha_envio: "",
    segmentos: [] as string[],
  });

  const searchParams = useSearchParams();
  const creditoOk = searchParams.get("credito") === "ok";
  const contactosOk = searchParams.get("contactos") === "ok";

  const [limiteContactos, setLimiteContactos] = useState(500);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contactos, setContactos] = useState<any[]>([]);
  const [cantidadContactos, setCantidadContactos] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null);
  const [membresiaActiva, setMembresiaActiva] = useState<boolean>(false);
  const [usoSms, setUsoSms] = useState<{ usados: number; limite: number } | null>(null);
  const [archivoCsv, setArchivoCsv] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    fetch(`${BACKEND_URL}/api/campaigns`, { credentials: "include" })
      .then((res) => res.json())
      .then(async (data) => {
        const smsOnly = (data || []).filter((c: any) => c.canal === "sms");

        const enriched = await Promise.all(
          smsOnly.map(async (c: any) => {
            try {
              const res = await fetch(`${BACKEND_URL}/api/campaigns/${c.id}/sms-status`, {
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
      });

    fetch(`${BACKEND_URL}/api/contactos/limite`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setLimiteContactos(data.limite || 500);
        setCantidadContactos(data.total || 0);
      })
      .catch((err) => console.error("❌ Error cargando límite de contactos:", err));

    fetch(`${BACKEND_URL}/api/contactos`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setContactos(data || []));

    fetch(`${BACKEND_URL}/api/settings`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setMembresiaActiva(data?.membresia_activa === true);
      })
      .catch(err => console.error("❌ Error obteniendo membresía:", err));

    fetch(`${BACKEND_URL}/api/usage`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const sms = (data.usos || []).find((u: any) => u.canal === "sms");
        setUsoSms({ usados: sms?.usados ?? 0, limite: sms?.limite ?? 500 });
      })
      .catch((err) => console.error("❌ Error cargando uso SMS:", err));
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

    const fechaUTC = new Date(form.fecha_envio).toISOString();
    data.append("fecha_envio", fechaUTC);
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
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        alert("✅ Campaña eliminada");
      } else {
        alert("❌ Error al eliminar campaña");
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
  
  const comprarMasSms = async (cantidad: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout-credit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: "sms",
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
    fetch(`${BACKEND_URL}/api/usage`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const usoContactos = (data.usos || []).find((u: any) => u.canal === "contactos");
        setLimiteContactos(usoContactos?.limite || 500);
      })
      .catch((err) => console.error("❌ Error cargando uso de contactos:", err));
  }, []);
  
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

  const porcentajeSms = usoSms && usoSms.limite > 0
  ? (usoSms.usados / usoSms.limite) * 100
  : 0;

  let colorBarraSms = "bg-green-500";
  if (porcentajeSms >= 90) {
    colorBarraSms = "bg-red-500";
  } else if (porcentajeSms >= 70) {
    colorBarraSms = "bg-yellow-400";
  }

  return (
    <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-center flex items-center gap-2 mb-8 text-purple-300">
        <SiTwilio className="text-red-300 animate-pulse" /> Campañas por SMS
      </h1>

      {contactosOk && (
        <div className="bg-green-600/20 border border-green-500 text-green-300 p-4 rounded mb-6 text-sm">
          ✅ Límite de contactos ampliado exitosamente. Ya puedes cargar más contactos.
        </div>
      )}

      {creditoOk && (
        <div className="bg-green-600/20 border border-green-500 text-green-300 p-4 rounded mb-6 text-sm">
          ✅ Créditos agregados exitosamente. Ya puedes usarlos en tus campañas SMS.
        </div>
      )}

      <TrainingHelp context="campaign-sms" />

      {usoSms && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <MdSms /> Uso mensual de SMS
          </h3>
          <p className="text-white text-sm mb-2">
            {usoSms.usados ?? 0} de {usoSms.limite} mensajes enviados (incluye créditos extra)
          </p>
          {usoSms.limite > 500 && (
            <p className="text-green-300 text-sm">
              Incluye {usoSms.limite - 500} mensajes extra comprados.
            </p>
          )}
          <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
            <div
              className={`h-full ${colorBarraSms} transition-all duration-500`}
              style={{ width: `${porcentajeSms}%` }}
            />
          </div>
          <div className="flex gap-2">
            {[500, 1000, 2000].map((extra) => (
              <button
                key={extra}
                onClick={() => comprarMasSms(extra)}
                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
              >
                +{extra}
              </button>
            ))}
          </div>
        </div>
      )}

      {usoContactos && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
          <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
            <FaAddressBook /> Contactos
          </h3>
          <p className="text-white text-sm mb-2">
            {usoContactos.usados} de {usoContactos.limite} contactos usados (incluye créditos extra)
          </p>
          {usoContactos.limite > 500 && (
            <p className="text-green-300 text-sm">
              Incluye {usoContactos.limite - 500} contactos extra comprados.
            </p>
          )}
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
                +{extra}
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

            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
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
                onClick={() => {
                  if (!membresiaActiva) {
                    window.location.href = "/dashboard/upgrade";
                    return;
                  }
                  handleEliminarContactos();
                }}
                className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-semibold text-white w-full md:w-auto"
              >
                Eliminar contactos
              </button>

              {archivoCsv && (
                <button
                  onClick={() => {
                    if (!membresiaActiva) {
                      window.location.href = "/dashboard/upgrade";
                      return;
                    }
                    handleSubirCsv();
                  }}
                  className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-semibold text-white w-full md:w-auto"
                >
                  Subir contactos
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
        placeholder="🎉 ¡Hola! Aún tienes tu clase GRATIS disponible. Reserva ahora 👉 [link]. ¡Te esperamos!"
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
            alert("❌ Tu membresía no está activa. Actívala para usar campañas SMS.");
            return;
          }
          handleSubmit();
        }}
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
        <ul className="space-y-6 text-white text-sm">
          {campaigns.map((c) => (
            <li key={c.id} className="border border-white/10 rounded p-4 bg-white/5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="text-lg font-bold text-white mb-1">{c.nombre}</div>
                  <div className="text-white/80 mb-1">
                    <SiGooglecalendar className="inline mr-1" />{" "}
                    {DateTime.fromISO(c.programada_para)
                      .setZone("America/New_York")
                      .toLocaleString(DateTime.DATETIME_MED)}
                  </div>
                  <span className="flex items-center gap-1">
                    <SiMinutemailer /> Enviados: {c.entregas?.length ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <SiCheckmarx className="text-green-400" /> Entregados:{" "}
                    {c.entregas?.filter((e: any) => e.status === "delivered").length ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <SiProbot className="text-red-400" /> Fallidos:{" "}
                    {c.entregas?.filter((e: any) => e.status === "failed").length ?? 0}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-1 bg-white/10 border border-white/20 rounded hover:bg-white/20"
                    onClick={() =>
                      setExpandedCampaignId(c.id === expandedCampaignId ? null : c.id)
                    }
                  >
                    {expandedCampaignId === c.id ? "Ocultar" : "Ver más"}
                  </button>
                  <button
                    className="px-4 py-1 bg-red-500/80 hover:bg-red-600 border border-white/20 rounded text-white"
                    onClick={() => eliminarCampana(c.id)}
                  >
                    <SiProbot className="inline mr-1" /> Eliminar
                  </button>
                </div>
              </div>

              {expandedCampaignId === c.id && (
                <ul className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs">
                  {(c.entregas || []).map((e: any, i: number) => {
                    console.log("📦 Entrega completa:", e);
                    const normalizar = (num: string | undefined | null) =>
                      typeof num === "string" ? num.replace(/\D/g, "").replace(/^1/, "") : "";
                    
                    const limpiarTwilio = (num: string | undefined | null) =>
                      typeof num === "string" ? num.replace(/^tel:/, "") : "";

                    const telefonoLimpio = limpiarTwilio(e.telefono || "");                    

                    console.log("📤 Número limpio:", telefonoLimpio);
                    console.log("📒 Contactos disponibles:", contactos.map(c => c.telefono));

                    const contacto = contactos.find(
                      (con: any) => normalizar(con.telefono) === normalizar(telefonoLimpio)
                    );
                    
                    if (!contacto) {
                      console.warn("❌ No se encontró segmento para:", telefonoLimpio);
                    } else {
                      console.log("✅ Match encontrado:", contacto.telefono, contacto.segmento);
                    }
                    
                    const segmento = contacto?.segmento || "Desconocido";

                    return (
                      <li key={i} className="border-b border-white/10 pb-2">
                        <div className="flex items-center gap-1 text-white/90">
                        <MdSms />
                          <span className="font-mono text-sm">{telefonoLimpio}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <SiStatuspal />
                          Estado:{" "}
                          <span
                            className={`font-semibold ${
                              e.status === "delivered"
                                ? "text-green-400"
                                : e.status === "failed"
                                ? "text-red-400"
                                : "text-yellow-400"
                            }`}
                          >
                            {e.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          🏷️ Segmento:{" "}
                          <span className="italic text-white/80">{segmento}</span>
                        </div>
                        {e.error_message && (
                          <div className="flex items-center gap-1 text-red-400">
                            <HiOutlineExclamationTriangle /> {e.error_message}
                          </div>
                        )}
                        <div className="text-white/40">
                          {DateTime.fromISO(e.timestamp)
                            .setZone("America/New_York")
                            .toLocaleString(DateTime.DATETIME_MED)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      <Footer />
    </div>
  );
}
