"use client";

import { useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import Footer from "@/components/Footer";
import {
  SiCampaignmonitor,
  SiMinutemailer,
  SiTarget,
  SiGoogledocs,
  SiGooglephotos,
  SiTestinglibrary,
  SiGooglecalendar,
  SiGoogleanalytics,
  SiLinktree,
} from "react-icons/si";
import { FaAddressBook, FaPaperclip } from "react-icons/fa";
import TrainingHelp from "@/components/TrainingHelp";
import { useSearchParams } from "next/navigation";
import EmailLogViewer from "@/components/EmailLogViewer";
import { useFeatures } from '@/hooks/usePlan';
import ChannelStatus from "@/components/ChannelStatus";

const BASE_EMAIL_LIMIT = 2000;

export default function CampaignsEmailClient() {
  const [form, setForm] = useState({
    nombre: "",
    contenido: "",
    fecha_envio: "",
    segmentos: [] as string[],
    link_url: "",
    imagen: null as File | null,
    asunto: "",
    titulo_visual: "",
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
  const csvInputRef   = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [cargandoLogsId, setCargandoLogsId] = useState<number | null>(null);
  const [errorLogsCampana, setErrorLogsCampana] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");

  type ChannelState = {
   enabled: boolean;
   maintenance: boolean;
   plan_enabled: boolean;
   settings_enabled: boolean;
   maintenance_message?: string | null;
 };
 const [channelState, setChannelState] = useState<ChannelState | null>(null);

 // Flags de membresía/trial venidos del backend (/api/settings)
  const [canEdit, setCanEdit] = useState(false);
  const [trialDisponible, setTrialDisponible] = useState(false);
  const [trialActivo, setTrialActivo] = useState(false);
  const [estadoMembresiaTexto, setEstadoMembresiaTexto] = useState<string>('');

 const { esTrial } = useFeatures(); // opcional, solo para textos
 const canEmail = !!channelState?.enabled;           // si el canal está habilitado
 const disabledAll = !canEmail || !canEdit;          // ← ahora usa canEdit (plan activo o trial activo)

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
      setUsoEmail({ usados: email?.usados ?? 0, limite: email?.limite ?? BASE_EMAIL_LIMIT });
  
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
        // Flags de membresía/trial provenientes del backend
        setMembresiaActiva(data?.membresia_activa === true);
        setCanEdit(Boolean(data?.can_edit));
        setTrialDisponible(Boolean(data?.trial_disponible));
        setTrialActivo(Boolean(data?.trial_vigente || data?.trial_activo));
        setEstadoMembresiaTexto(String(data?.estado_membresia_texto || ''));

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
    }else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (guardEmail()) return;

    console.log("🧪 Asunto que se envía:", form.asunto);
    if (!form.nombre || !form.fecha_envio || form.segmentos.length === 0) {
      alert("Completa todos los campos.");
      return;
    }

    // validación mínima: que existan contactos en esos segmentos
    const hayContactos = contactos.some((c: any) => form.segmentos.includes(c.segmento) && c.email);
    if (!hayContactos) {
      alert("❌ No hay contactos válidos en los segmentos seleccionados.");
      return;
    }

    const data = new FormData();
    const fechaEnvioISO = new Date(form.fecha_envio).toISOString();
    data.append("nombre", form.nombre);
    data.append("canal", "email");
    data.append("contenido", form.contenido);
    data.append("asunto", form.asunto);
    data.append("titulo_visual", form.titulo_visual);
    data.append("fecha_envio", fechaEnvioISO);
    data.append("segmentos", JSON.stringify(form.segmentos));
    data.append("link_url", form.link_url);
    if (form.imagen) data.append("imagen", form.imagen);

    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/campaigns`, {
        method: "POST",
        body: data,
        credentials: "include",
      });

      const json = await res.json();
      setLoading(false);

      if (res.status === 403 && json?.error === "channel_blocked") {
        try {
          const stRes = await fetch(`${BACKEND_URL}/api/channel-settings?canal=email`, { credentials: "include" });
          const st = await stRes.json();
          setChannelState({
            enabled: !!st.enabled,
            maintenance: !!st.maintenance,
            plan_enabled: !!st.plan_enabled,
            settings_enabled: !!st.settings_enabled,
            maintenance_message: st.maintenance_message || null,
          });
          if (st.maintenance) {
            alert(`🛠️ Canal Email en mantenimiento. ${st.maintenance_message || "Inténtalo más tarde."}`);
          } else if (!st.plan_enabled) {
            alert("❌ Tu plan no incluye Email. Actualiza para habilitarlo.");
            window.location.href = "/upgrade";
          } else {
            alert("📴 Canal Email deshabilitado en tu configuración.");
          }
        } catch {
          alert("📴 Canal Email no disponible.");
        }
        return;
      }

      if (res.ok) {
        alert("✅ Campaña enviada");
        setForm({
          nombre: "",
          contenido: "",
          fecha_envio: "",
          segmentos: [],
          link_url: "",
          imagen: null,
          asunto: "",
          titulo_visual: "",
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
    if (guardEmail()) return;
    
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
        if (csvInputRef.current) csvInputRef.current.value = "";
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
    if (guardEmail()) return;
    
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
    if (!membresiaActiva) {
      alert("❌ Activa tu membresía para ampliar contactos o campañas.");
      window.location.href = "/upgrade";
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout-credit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: "contactos",
          cantidad,
          redirectPath: "/dashboard/campaigns/email",
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
  
  const comprarMasCampanas = async (cantidad: number) => {
    if (!membresiaActiva) {
      alert("❌ Activa tu membresía para ampliar contactos o campañas.");
      window.location.href = "/upgrade";
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout-credit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: "email", // 👈 asegúrate de que el backend lo reconoce
          cantidad,
          redirectPath: "/dashboard/campaigns/email", // 👈 ruta después del pago
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

  const handleClaimTrial = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/billing/claim-trial`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`❌ ${data?.error || 'No se pudo activar la prueba'}`);
        return;
      }
      alert('✅ ¡Prueba gratis activada!');
      // refrescamos settings/flags
      const s = await fetch(`${BACKEND_URL}/api/settings`, { credentials: 'include' });
      const j = await s.json();
      setMembresiaActiva(j?.membresia_activa === true);
      setCanEdit(Boolean(j?.can_edit));
      setTrialDisponible(Boolean(j?.trial_disponible));
      setTrialActivo(Boolean(j?.trial_vigente || j?.trial_activo));
      setEstadoMembresiaTexto(String(j?.estado_membresia_texto || ''));
    } catch (e) {
      console.error(e);
      alert('❌ Error activando la prueba');
    }
  };

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
  
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/channel-settings?canal=email`, { credentials: "include" });
          const d = await res.json();
          setChannelState({
            enabled: !!d.enabled,
            maintenance: !!d.maintenance,
            plan_enabled: !!d.plan_enabled,
            settings_enabled: !!d.settings_enabled,
            maintenance_message: d.maintenance_message || null,
          });
      } catch (err) {
        console.error("❌ Error obteniendo channel settings (email):", err);
        setChannelState({
          enabled: false, maintenance: false, plan_enabled: false, settings_enabled: false, maintenance_message: null,
        });
      }
    })();
  }, []);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!form.contenido) return;
  
      try {
        // ✅ Obtener logo real y nombre del negocio desde /api/settings
        const settingsRes = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: "include",
        });
        const settings = await settingsRes.json();
  
        const logoUrl = settings?.logo_url || undefined;
        const nombreNegocio = settings?.nombre || "Tu Negocio";
  
        const res = await fetch(`${BACKEND_URL}/api/preview-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contenido: form.contenido,
            nombreNegocio,
            imagenUrl: form.imagen ? URL.createObjectURL(form.imagen) : undefined,
            linkUrl: form.link_url,
            logoUrl,
            email: "test@email.com",
            tenantId: "preview",
            nombreContacto: "Nombre del cliente",
            asunto: form.asunto,
            tituloVisual: form.titulo_visual,
          }),
        });
  
        const html = await res.text();
        setPreviewHtml(html);
      } catch (err) {
        console.error("❌ Error generando vista previa:", err);
      }
    };
  
    fetchPreview();
  }, [
    form.contenido,
    form.asunto,
    form.link_url,
    form.titulo_visual,
    form.imagen,
  ]);  
  
  const requerirMembresia = (callback?: () => void) => {
  if (!canEdit) {
    if (trialDisponible) {
      const confirma = window.confirm("Puedes activar tu prueba gratis ahora. ¿Deseas activarla?");
      if (confirma) handleClaimTrial();
    } else {
      const confirmar = window.confirm("Tu membresía no está activa. ¿Quieres activarla ahora?");
      if (confirmar) window.location.href = "/upgrade";
    }
  } else {
    if (callback) callback();
  }
};
  
   const guardEmail = () => {
      if (channelState?.maintenance) {
        alert(`🛠️ Canal Email en mantenimiento. ${channelState.maintenance_message || "Inténtalo más tarde."}`);
        return true;
      }
      if (!canEmail) {
        if (channelState?.plan_enabled === false) {
          alert("❌ Tu plan no incluye Email. Actualiza para habilitar campañas por Email.");
          window.location.href = "/upgrade";
        } else {
          alert("📴 Canal de Email deshabilitado en tu configuración.");
        }
        return true;
      }
      if (!canEdit) {
        // No tiene plan activo ni trial vigente
        if (trialDisponible) {
          const confirma = window.confirm("Puedes activar tu prueba gratis ahora. ¿Deseas activarla?");
          if (confirma) handleClaimTrial();
        } else {
          const confirmar = window.confirm("Tu membresía no está activa. ¿Quieres activarla ahora?");
          if (confirmar) window.location.href = "/upgrade";
        }
        return true;
      }

      return false;
    };

  return (
    <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center flex items-center gap-2 mb-8 text-purple-300">
          <SiMinutemailer className="text-blue-400 animate-pulse" /> Campañas por Email
        </h1>

        <ChannelStatus canal="email" showBanner hideTitle />

        {/* 🎁 Caso 1: Trial disponible (nunca lo usó) → invitar a activar */}
        {trialDisponible && !canEdit && (
          <div className="mb-6 p-4 bg-purple-500/20 border border-purple-400 text-purple-100 rounded text-center font-medium">
            🎁 <strong>Activa tu prueba gratis</strong> y lanza tu primera campaña por Email.
            <button
              onClick={() => (window.location.href = '/upgrade')}
              className="ml-3 inline-flex items-center px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              Activar prueba gratis
            </button>
          </div>
        )}

        {/* 🟡 Caso 2: Trial ACTIVO → permitir uso con mensaje informativo */}
        {!membresiaActiva && trialActivo && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-400 text-yellow-200 rounded text-center font-medium">
            🟡 Estás usando la <strong>prueba gratis</strong>. ¡Aprovecha para enviar tus primeras campañas!
          </div>
        )}

        {/* 🔴 Caso 3: Sin plan y sin trial activo → bloquear con CTA a upgrade */}
        {!canEdit && !trialDisponible && !trialActivo && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400 text-red-200 rounded text-center font-medium">
            🚫 Tu membresía está inactiva. No puedes crear campañas.{` `}
            <a onClick={() => (window.location.href = '/upgrade')} className="underline cursor-pointer">
              Activa un plan para continuar.
            </a>
          </div>
        )}

        <TrainingHelp context="campaign-email" />

        {contactosOk && (
          <div className="bg-green-600/20 border border-green-500 text-green-300 p-4 rounded mb-6 text-sm">
            ✅ Límite de contactos ampliado exitosamente. Ya puedes cargar más contactos.
          </div>
        )}

        {usoEmail && (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
            <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
              <SiMinutemailer /> Campañas por Email
            </h3>

            <p className="text-white text-sm mb-2">
              {usoEmail.usados} de {usoEmail.limite} campañas usadas este mes
              {(usoEmail.limite ?? BASE_EMAIL_LIMIT) > BASE_EMAIL_LIMIT && " (incluye créditos extra)"}
            </p>

            {(usoEmail.limite ?? BASE_EMAIL_LIMIT) > BASE_EMAIL_LIMIT && (
              <p className="text-green-300 text-sm">
                Incluye {usoEmail.limite - BASE_EMAIL_LIMIT} campañas extra compradas.
              </p>
            )}

            <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
              <div
                className={`h-full ${
                  usoEmail.usados / usoEmail.limite >= 0.9
                    ? "bg-red-500"
                    : usoEmail.usados / usoEmail.limite >= 0.7
                    ? "bg-yellow-400"
                    : "bg-green-500"
                } transition-all duration-500`}
                style={{ width: `${(usoEmail.usados / usoEmail.limite) * 100}%` }}
              />
            </div>

            <div className="flex gap-2 mb-2">
              {[500, 1000, 2000].map((extra) => (
                <button
                  key={extra}
                  onClick={() => comprarMasCampanas(extra)}
                  className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-white text-sm"
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
              {usoContactos.usados} de {usoContactos.limite} contactos usados
              {(usoContactos.limite ?? 500) > 500 && " (incluye créditos extra)"}
            </p>

            {(usoContactos.limite ?? 500) > 500 && (
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

            <div className="w-full space-y-2">
              <label className="block text-sm font-semibold text-white">
                Subir archivo CSV de contactos
              </label>

              <input
                type="file"
                accept=".csv"
                multiple={false}
                disabled={disabledAll}
                ref={csvInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) {
                    setArchivoCsv(null);
                    return;
                  }
                  if (!file.name.toLowerCase().endsWith(".csv")) {
                    alert("❌ El archivo debe ser .csv");
                    if (csvInputRef.current) csvInputRef.current.value = "";
                    setArchivoCsv(null);
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    alert("❌ El CSV no puede pesar más de 5MB");
                    if (csvInputRef.current) csvInputRef.current.value = "";
                    setArchivoCsv(null);
                    return;
                  }
                  setArchivoCsv(file);
                }}
              />

              {archivoCsv && (
                <div className="flex items-center justify-between bg-white/10 border border-white/20 rounded px-4 py-2 text-sm text-white">
                  <span className="truncate">{archivoCsv.name}</span>

                  <button
                    onClick={() => {
                      if (disabledAll) { alert("❌ No puedes eliminar…"); return; }
                      setArchivoCsv(null);
                      if (csvInputRef.current) csvInputRef.current.value = "";
                    }}
                    disabled={disabledAll}
                    className={`text-xs font-semibold ml-4 ${
                      disabledAll
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-red-400 hover:text-red-600"
                    }`}
                    aria-disabled={disabledAll}
                    title={disabledAll ? "Bloqueado" : "Eliminar archivo"}
                  >
                    Eliminar archivo
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  if (!canEmail) { alert('Bloqueado por tu plan'); window.location.href='/upgrade'; return; }
                  if (!canEdit) return requerirMembresia();
                  handleEliminarContactos();
                }}
                disabled={disabledAll}
                className={`px-4 py-2 rounded font-semibold w-full sm:w-auto
                  ${disabledAll ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'}`}
              >
                Eliminar contactos
              </button>

              {archivoCsv && (
                <button
                  onClick={() => {
                    if (!canEmail) { alert('Bloqueado por tu plan'); window.location.href='/upgrade'; return; }
                    if (!canEdit) return requerirMembresia();
                    handleSubirCsv();
                  }}
                  disabled={disabledAll}
                  className={`px-4 py-2 rounded font-semibold w-full sm:w-auto
                    ${disabledAll ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                >
                  Subir contactos
                </button>
              )}

              </div>
            </div>
          </div>
        )}
      <div>
    
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
        placeholder="Ej: Bienvenido!"
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiTarget /> Título visual del Email
      </label>
      <input
        name="titulo_visual"
        value={form.titulo_visual}
        onChange={handleChange}
        placeholder="Ej: ¡Te tenemos una sorpresa exclusiva!"
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiGoogledocs /> Contenido del Email
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
      </div>

      <div className="w-full">
        <label className="block mb-2 font-medium text-white flex items-center gap-2">
          <SiGooglephotos /> Imagen del Email
        </label>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <button onClick={() => imageInputRef.current?.click()}
            className="bg-white/10 hover:bg-white/20 text-sm px-4 py-2 rounded text-white border border-white/20 w-full sm:w-auto"
          >
            Seleccionar imagen
          </button>

          {form.imagen && (
            <p className="text-white/60 text-sm truncate">{form.imagen.name}</p>
          )}
        </div>

        <input
          name="imagen"
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={handleChange}
          disabled={disabledAll}
          className="hidden"
        />

        {form.imagen && (
          <div className="mb-4">
            <img
              src={URL.createObjectURL(form.imagen)}
              alt="Preview"
              className="rounded border border-white/20 max-h-48 mb-2 mx-auto"
            />
            <div className="text-center">
              <button
                onClick={() => setForm((prev) => ({ ...prev, imagen: null }))}
                className="text-red-400 text-xs underline"
              >
                ❌ Eliminar imagen
              </button>
            </div>
          </div>
        )}
      </div> 

      {form.contenido && (
        <div className="my-10">
          <h3 className="text-white text-lg font-bold mb-2">
            <SiTestinglibrary /> Vista previa del Email
          </h3>
          <div className="bg-white rounded shadow p-4 max-h-[600px] overflow-y-auto">
            <iframe
              srcDoc={previewHtml}
              title="Email Preview"
              className="w-full h-[600px] border"
            />
          </div>
        </div>
      )}

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
            disabled={disabledAll}
            className="mr-2"
          />
            {seg}
          </label>
        ))}
      </div>

      <button
        onClick={() => {
          if (guardEmail()) return;
          handleSubmit();
        }}
        disabled={disabledAll || loading}
        className={`px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed
          ${disabledAll ? 'bg-gray-500 text-white/70' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
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
                    <div className="text-lg font-bold text-white mb-1">
                      {c.titulo ?? c.nombre ?? "Sin nombre"}
                    </div>
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
                      onClick={() => {
                        if (disabledAll) {
                          alert("❌ No puedes eliminar campañas: el canal de Email está bloqueado o la membresía inactiva.");
                          return;
                        }
                        eliminarCampana(c.id);
                      }}
                      disabled={disabledAll}
                      className={`px-4 py-1 rounded border border-white/20 ${
                        disabledAll
                          ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                          : "bg-red-500/80 hover:bg-red-600 text-white"
                      }`}
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
