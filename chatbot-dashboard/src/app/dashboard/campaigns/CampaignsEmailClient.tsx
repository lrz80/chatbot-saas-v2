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
import { useI18n } from "@/i18n/LanguageProvider";

const BASE_EMAIL_LIMIT = 2000;

export default function CampaignsEmailClient() {
  const { t } = useI18n();
  const locale =
  typeof document !== "undefined"
    ? (document.documentElement.lang || navigator.language || "en-US")
    : "en-US";

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
  const [declaraOptIn, setDeclaraOptIn] = useState<boolean>(false);
  const csvInputRef   = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [cargandoLogsId, setCargandoLogsId] = useState<number | null>(null);
  const [errorLogsCampana, setErrorLogsCampana] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [segmentoCsv, setSegmentoCsv] = useState<"leads" | "cliente" | "otros">("leads");

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

 // Canal habilitado por configuración/plan
 const canEmail = !!channelState?.enabled;

 // Membresía/trial inactivo => bloqueo por membresía
 const membershipInactive = !canEdit;

 // Desactivar toda la UI si canal bloqueado o sin membresía/trial
 const disabledAll = !canEmail || membershipInactive;

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
      console.error(t("emailCampaigns.errors.loadCampaigns"), err);
    }
  };
  
  const cargarContactos = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/contactos`, { credentials: "include" });
      const contData = await res.json();

      const lista = Array.isArray(contData)
        ? contData
        : Array.isArray(contData?.contactos)
          ? contData.contactos
          : Array.isArray(contData?.data)
            ? contData.data
            : [];

      setContactos(lista);
    } catch (err) {
      console.error(t("emailCampaigns.errors.loadContacts"), err);
      setContactos([]);
    }
  };

  const cargarLimite = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/contactos/limite`, { credentials: "include" });
      const data = await res.json();
      setLimiteContactos(data.limite || 500);
      setCantidadContactos(data.total || 0);
    } catch (err) {
      console.error(t("emailCampaigns.errors.loadLimit"), err);
    }
  };
  
  const cargarUso = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/usage`, { credentials: "include" });
      const data = await res.json();
  
      const email = data.usos?.find((u: any) => u.canal === "email");
      setUsoEmail({ usados: email?.usados ?? 0, limite: email?.limite ?? BASE_EMAIL_LIMIT });
  
      const usoContactos = data.usos?.find((u: any) => u.canal === "contactos");
      setLimiteContactos(usoContactos?.limite ?? 500);
    } catch (err) {
      console.error(t("emailCampaigns.errors.loadUsage"), err);
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
      alert(t("email.errors.completeFields"));
      return;
    }

    // validación mínima: que existan contactos en esos segmentos
    const hayContactos = contactos.some(
      (c: any) =>
        form.segmentos.includes(c.segmento) &&
        Boolean(c.email) &&
        c.marketing_opt_in === true
    );

    if (!hayContactos) {
      alert(t("emailCampaigns.form.noValidContacts"));
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
            alert(t("emailCampaigns.errors.maintenance", { msg: st.maintenance_message || t("common.tryLater") }));
          } else if (!st.plan_enabled) {
            alert(t("emailCampaigns.errors.planNoEmail"));
            window.location.href = "/upgrade";
          } else {
            alert(t("emailCampaigns.errors.disabledInSettings"));
          }
        } catch {
          alert("📴 Canal Email no disponible.");
        }
        return;
      }

      if (res.ok) {
        alert(t("emailCampaigns.form.sentOk"));
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
        if (json?.code === "no_opt_in_recipients") {
          alert(t("emailCampaigns.form.noOptInRecipients"));
        } else {
          alert(`❌ ${json.error || "Error desconocido"}`);
        }
      }
    } catch (err) {
      setLoading(false);
      console.error("❌ Error de red:", err);
      alert(t("common.errors.connection"));
    }
  };

  const handleSubirCsv = async () => {
    if (guardEmail()) return;

    if (!archivoCsv) {
      alert(t("emailCampaigns.contacts.csv.selectCsv"));
      return;
    }

    // Validación básica: tamaño 5MB max y .csv
    const nameLower = archivoCsv.name.toLowerCase();
    if (!nameLower.endsWith(".csv")) {
      alert(t("emailCampaigns.contacts.csv.mustBeCsv"));
      return;
    }
    if (archivoCsv.size > 5 * 1024 * 1024) {
      alert(t("emailCampaigns.contacts.csv.maxSize"));
      return;
    }

    // Validar límite
    if (cantidadContactos >= limiteContactos) {
      alert(t("email.contacts.limitReached"));
      return;
    }

    // Requerir opt-in
    if (!declaraOptIn) {
      alert(t("email.contacts.optinRequired"));
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", archivoCsv);
      formData.append("declara_opt_in", "true"); // ya validamos que está en true
      formData.append("segmento_forzado", segmentoCsv);

      const res = await fetch(`${BACKEND_URL}/api/contactos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        const nuevos = Number(json?.nuevos ?? 0);

        alert(t("emailCampaigns.contacts.csv.added", { count: nuevos }));

        // limpiar UI
        if (csvInputRef.current) csvInputRef.current.value = "";
        setArchivoCsv(null);
        setDeclaraOptIn(false);

        // ✅ refrescar fuente real de verdad (para que contactos.length y límite queden correctos)
        await Promise.all([cargarContactos(), cargarLimite(), cargarUso()]);

      } else {
        alert(`❌ ${json?.error || "Error al subir archivo"}`);
      }
    } catch (err) {
      console.error("❌ Error al subir archivo:", err);
      alert(t("common.errors.connection"));
    }
  };
  
  const eliminarCampana = async (id: number) => {
    if (!confirm(t("email.history.deleteConfirm"))) return;
  
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
      alert(t("common.errors.connection"));
    }
  };  

  const handleEliminarContactos = async () => {
    if (guardEmail()) return;
    
    if (!confirm(t("emailCampaigns.contacts.deleteAll.confirm"))) return;
  
    try {
      const res = await fetch(`${BACKEND_URL}/api/contactos`, {
        method: "DELETE",
        credentials: "include",
      });
  
      const json = await res.json();
  
      if (res.ok) {
        alert(t("emailCampaigns.contacts.deleteAll.success"));
        setContactos([]);
        setCantidadContactos(0);
      } else {
        alert(`❌ ${json.error || t("emailCampaigns.contacts.deleteAll.fail")}`);
      }
    } catch (err) {
      console.error("❌ Error al eliminar contactos:", err);
      alert(t("emailCampaigns.contacts.deleteAll.failConnection"));
    }
  };

  const comprarMasContactos = async (cantidad: number) => {
    if (!membresiaActiva) {
      alert(t("emailCampaigns.upgrade.required"));
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
        alert(t("common.errors.paymentInit"));
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert(t("common.errors.request"));
    }
  };  
  
  const comprarMasCampanas = async (cantidad: number) => {
    if (!membresiaActiva) {
      alert(t("emailCampaigns.upgrade.required"));
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
        alert(t("common.errors.paymentInit"));
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert(t("common.errors.request"));
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
      alert(t("common.trial.activated"));
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
      alert(t("common.trial.activateError"));
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
        const nombreNegocio = settings?.nombre || t("common.defaultBusinessName");
  
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
      const confirma = window.confirm(t("common.trial.askActivate"));
      if (confirma) handleClaimTrial();
    } else {
      const confirmar = window.confirm(t("email.membership.askActivate"));
      if (confirmar) window.location.href = "/upgrade";
    }
  } else {
    if (callback) callback();
  }
};
  
   const guardEmail = () => {
      if (channelState?.maintenance) {
        alert(t("emailCampaigns.errors.maintenance", { msg: channelState.maintenance_message || t("common.tryLater") }));
        return true;
      }
      if (!canEmail) {
        if (channelState?.plan_enabled === false) {
          alert(t("emailCampaigns.errors.planNoEmail"));
          window.location.href = "/upgrade";
        } else {
          alert(t("emailCampaigns.errors.disabledInSettings"));
        }
        return true;
      }
      if (!canEdit) {
        // No tiene plan activo ni trial vigente
        if (trialDisponible) {
          const confirma = window.confirm(t("common.trial.askActivate"));
          if (confirma) handleClaimTrial();
        } else {
          const confirmar = window.confirm(t("email.membership.askActivate"));
          if (confirmar) window.location.href = "/upgrade";
        }
        return true;
      }

      return false;
    };

  return (
    <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
        <h1
        className="
          text-2xl
          sm:text-3xl
          md:text-4xl
          font-extrabold
          text-center
          flex flex-col sm:flex-row
          justify-center items-center
          gap-2
          mb-6 md:mb-8
          text-purple-300
        "
      >
        <SiMinutemailer
          size={28}
          className="text-green-400 animate-pulse sm:size-9"
        />
      <span>{t("emailCampaigns.title")}</span>
      </h1>
        <ChannelStatus
          canal="email"
          showBanner
          hideTitle
          membershipInactive={membershipInactive}
        />

        {/* 🎁 Caso 1: Trial disponible (nunca lo usó) → invitar a activar */}
        {trialDisponible && !canEdit && (
          <div className="mb-6 p-4 bg-purple-500/20 border border-purple-400 text-purple-100 rounded text-center font-medium">
            🎁 <strong>{t("emailCampaigns.trial.banner.title")}</strong> {t("emailCampaigns.trial.banner.text")}
            <button
              onClick={() => (window.location.href = '/upgrade')}
              className="ml-3 inline-flex items-center px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              {t("emailCampaigns.trial.banner.cta")}
            </button>
          </div>
        )}

        {/* 🟡 Caso 2: Trial ACTIVO → permitir uso con mensaje informativo */}
        {!membresiaActiva && trialActivo && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-400 text-yellow-200 rounded text-center font-medium">
            {t("emailCampaigns.trial.activeBanner")}
          </div>
        )}

        {/* 🔴 Caso 3: Sin plan y sin trial activo → bloquear con CTA a upgrade */}
        {!canEdit && !trialDisponible && !trialActivo && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400 text-red-200 rounded text-center font-medium">
            {t("emailCampaigns.membershipBlocked")}{` `}
            <a onClick={() => (window.location.href = '/upgrade')} className="underline cursor-pointer">
              {t("emailCampaigns.membershipBlocked.cta")}
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
              <SiMinutemailer /> {t("emailCampaigns.usage.title")}
            </h3>

            <p className="text-white text-sm mb-2">
              {t("emailCampaigns.usage.usedThisMonth", { used: usoEmail.usados, limit: usoEmail.limite })}
              {(usoEmail.limite ?? BASE_EMAIL_LIMIT) > BASE_EMAIL_LIMIT && t("emailCampaigns.usage.includesExtra")}
            </p>

            {(usoEmail.limite ?? BASE_EMAIL_LIMIT) > BASE_EMAIL_LIMIT && (
              <p className="text-green-300 text-sm">
                {t("emailCampaigns.usage.includesExtraCount", { extra: usoEmail.limite - BASE_EMAIL_LIMIT })}
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
              <FaAddressBook /> {t("email.contacts.title")}
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
                {t("email.csv.uploadTitle")}
              </label>
              <label className="flex items-start gap-2 text-white text-sm bg-white/5 border border-white/10 rounded p-3">
                <input
                  type="checkbox"
                  checked={declaraOptIn}
                  onChange={(e) => setDeclaraOptIn(e.target.checked)}
                  disabled={disabledAll}
                  className="mt-1"
                />
                <span className="leading-snug">
                  {t("emailCampaigns.contacts.optin.declare")}
                  <span className="block text-white/60 text-xs mt-1">
                    {t("emailCampaigns.contacts.optin.hint")}
                  </span>
                </span>
              </label>

              <label className="block text-sm font-semibold text-white">
                {t("emailCampaigns.contacts.csv.segmentLabel")}
              </label>

              <select
                value={segmentoCsv}
                onChange={(e) => setSegmentoCsv(e.target.value as any)}
                disabled={disabledAll}
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white mb-2"
              >
                <option value="leads">{t("segments.leads")}</option>
                <option value="cliente">{t("segments.client")}</option>
                <option value="otros">{t("segments.other")}</option>
              </select>

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
                    setDeclaraOptIn(false);
                    return;
                  }
                  if (!file.name.toLowerCase().endsWith(".csv")) {
                    alert(t("emailCampaigns.contacts.csv.mustBeCsv"));
                    if (csvInputRef.current) csvInputRef.current.value = "";
                    setArchivoCsv(null);
                    setDeclaraOptIn(false);
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    alert(t("emailCampaigns.contacts.csv.maxSize"));
                    if (csvInputRef.current) csvInputRef.current.value = "";
                    setArchivoCsv(null);
                    setDeclaraOptIn(false);
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
                      if (disabledAll) { alert(t("emailCampaigns.contacts.csv.removeBlocked")); return; }
                      setArchivoCsv(null);
                      setDeclaraOptIn(false);
                      if (csvInputRef.current) csvInputRef.current.value = "";
                    }}
                    disabled={disabledAll}
                    className={`text-xs font-semibold ml-4 ${
                      disabledAll
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-red-400 hover:text-red-600"
                    }`}
                    aria-disabled={disabledAll}
                    title={t("emailCampaigns.alerts.fileDelete")}
                  >
                    {t("emailCampaigns.contacts.csv.removeFile")}
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <button
                  onClick={() => {
                    if (!canEmail) {
                      alert(t("emailCampaigns.upgrade.blockedByPlan"));
                      window.location.href = "/upgrade";
                      return;
                    }
                    if (!canEdit) return requerirMembresia();
                    handleEliminarContactos();
                  }}
                  disabled={contactos.length === 0}
                  className={`px-4 py-2 rounded font-semibold w-full sm:w-auto ${
                    contactos.length > 0
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  }`}
                  title={contactos.length === 0 ? "No hay contactos para eliminar" : "Eliminar todos los contactos"}
                >
                  {t("email.contacts.deleteAll")}
                </button>

                <button
                  onClick={() => {
                    if (!canEmail) {
                      alert(t("emailCampaigns.upgrade.blockedByPlan"));
                      window.location.href = "/upgrade";
                      return;
                    }
                    if (!canEdit) return requerirMembresia();
                    handleSubirCsv();
                  }}
                  disabled={disabledAll || !archivoCsv}
                  className={`px-4 py-2 rounded font-semibold w-full sm:w-auto ${
                    !disabledAll && archivoCsv
                      ? "bg-green-600 hover:bg-green-500 text-white"
                      : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  }`}
                >
                  {t("emailCampaigns.contacts.csv.uploadButton")}
                </button>
              </div>
            </div>
          </div>
        )}
      <div>
    
      {/* Campos del formulario */}
      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiCampaignmonitor /> {t("emailCampaigns.form.campaignName.label")}
      </label>
      <input
        name="nombre"
        value={form.nombre}
        onChange={handleChange}
        placeholder={t("emailCampaigns.form.campaignName.placeholder")}
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiMinutemailer /> {t("emailCampaigns.form.subject.label")}
      </label>
      <input
        name="asunto"
        value={form.asunto}
        onChange={handleChange}
        placeholder={t("emailCampaigns.form.subject.placeholder")}
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiTarget /> {t("emailCampaigns.form.visualTitle.label")}
      </label>
      <input
        name="titulo_visual"
        value={form.titulo_visual}
        onChange={handleChange}
        placeholder={t("emailCampaigns.form.visualTitle.placeholder")}
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiGoogledocs /> {t("emailCampaigns.form.content.label")}
      </label>
      <textarea
        name="contenido"
        value={form.contenido}
        onChange={handleChange}
        placeholder={t("emailCampaigns.form.content.placeholder")}
        className="w-full p-2 mb-4 bg-white/10 border border-white/20 rounded"
        rows={4}
      />

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiLinktree /> {t("emailCampaigns.form.link.label")}
      </label>
      <input
        type="url"
        name="link_url"
        value={form.link_url}
        onChange={handleChange}
        placeholder={t("emailCampaigns.form.link.placeholder")}
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />
      </div>

      <div className="w-full">
        <label className="block mb-2 font-medium text-white flex items-center gap-2">
          <SiGooglephotos /> {t("emailCampaigns.form.image.label")}
        </label>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <button onClick={() => imageInputRef.current?.click()}
            className="bg-white/10 hover:bg-white/20 text-sm px-4 py-2 rounded text-white border border-white/20 w-full sm:w-auto"
          >
            {t("emailCampaigns.form.image.pick")}
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
                {t("emailCampaigns.form.image.remove")}
              </button>
            </div>
          </div>
        )}
      </div> 

      {form.contenido && (
        <div className="my-10">
          <h3 className="text-white text-lg font-bold mb-2">
            <SiTestinglibrary /> {t("emailCampaigns.form.preview.title")}
          </h3>
          <div className="bg-white rounded shadow p-4 max-h-[600px] overflow-y-auto">
            <iframe
              srcDoc={previewHtml}
              title={t("emailCampaigns.preview.iframeTitle")}
              className="w-full h-[600px] border"
            />
          </div>
        </div>
      )}

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiGooglecalendar /> {t("emailCampaigns.form.schedule.label")}
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
          <SiCampaignmonitor /> {t("emailCampaigns.form.segments.title")}
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
        onClick={handleSubmit}
        disabled={disabledAll || loading}
        className={`px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed
          ${disabledAll ? 'bg-gray-500 text-white/70' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
      >
        {loading ? t("emailCampaigns.form.submit.sending") : t("emailCampaigns.form.submit.idle")}
      </button>

      <hr className="my-10 border-white/20" />

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
        <SiGoogleanalytics /> {t("emailCampaigns.history.title")}
      </h2>

      {campaigns.length === 0 ? (
        <p className="text-white/70">{t("emailCampaigns.history.empty")}</p>
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
                      {c.titulo ?? c.nombre ?? t("emailCampaigns.history.campaignDefaultName")}
                    </div>
                    <div className="text-white/80 mb-1">
                      <SiGooglecalendar className="inline mr-1" />{" "}
                      {new Date(c.programada_para).toLocaleString(locale, {
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
                      <div className="text-white/90 italic mb-1">{t("emailCampaigns.history.emailContentPrefix", { content: c.contenido })}</div>
                    )}
                    {c.link_url && (
                      <div className="mt-1 text-blue-400 underline text-sm">
                        <a
                          href={c.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t("emailCampaigns.history.link.view")}
                        </a>
                      </div>
                    )}
                    {c.imagen_url && (
                      <div className="mt-2">
                        <img
                          src={c.imagen_url}
                          alt={t("emailCampaigns.history.imageAlt")}
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
                        ? t("emailCampaigns.history.expand.loading")
                        : expandedCampaignId === c.id
                        ? t("emailCampaigns.history.expand.hide")
                        : t("emailCampaigns.history.expand.show")}
                    </button>

                    <button
                      onClick={() => {
                        if (disabledAll) {
                          alert(t("emailCampaigns.history.delete.blocked"));
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
                    {t("emailCampaigns.history.details")}{" "}
                    <span className="text-white font-semibold">
                      {new Date(c.programada_para).toLocaleString(locale, {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}
                    </span>
                    .

                    {errorLogsCampana === c.id ? (
                      <p className="text-red-400 mt-2">{t("emailCampaigns.history.unauthorized")}</p>
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
