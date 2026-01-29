"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { toast } from "react-toastify";
import { Brain, User, Bot, Link } from "lucide-react";
import TrainingHelp from "@/components/TrainingHelp";
import { BACKEND_URL } from "@/utils/api";
import VoicePromptGenerator from "@/components/VoicePromptGenerator";
import Footer from "@/components/Footer";
import { SiAudioboom } from "react-icons/si";
import VoicePlayer from "@/components/VoicePlayer";
import VoiceMinutesCard from '@/components/VoiceMinutesCard';
import { useFeatures } from '@/hooks/usePlan';
import ChannelStatus from "@/components/ChannelStatus";
import { useI18n } from "@/i18n/LanguageProvider";


export default function VoiceConfigPage() {
  const { t, lang } = useI18n();

  const [idioma, setIdioma] = useState("es-ES");
  const tenant = useTenant();
  const tenantId = tenant?.id;
  const tieneMembresia = tenant?.membresia_activa;
  const router = useRouter();
  type ChannelState = {
  enabled: boolean;              // gate final result (plan + settings + sin pausa)
  maintenance: boolean;          // proviene de channel_maintenance
  plan_enabled: boolean;         // tu plan permite este canal
  settings_enabled: boolean;     // toggle global/tenant en channel_settings
  maintenance_message?: string | null;
};
  const { loading: loadingPlan } = useFeatures(); // si no usas features/esTrial, no los destructures

  // 1) Estado base primero
  const [channelState, setChannelState] = useState<ChannelState | null>(null);

  // ✅ Trial / edición
  const [trialDisponible, setTrialDisponible] = useState(false);
  const [trialActivo, setTrialActivo] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const membershipInactive = !Boolean(tieneMembresia || trialActivo);

  // 2) Derivados seguros (después del estado). Puedes usar useMemo o booleanos simples:
  const planVoice      = useMemo(() => Boolean(channelState?.plan_enabled),   [channelState]);
  const settingsOn     = useMemo(() => Boolean(channelState?.settings_enabled),[channelState]);
  const inMaintenance  = useMemo(() => Boolean(channelState?.maintenance),    [channelState]);

  // ✅ usa canEdit (plan activo O trial activo)
  const canVoice = Boolean(
    canEdit &&            // <- clave
    planVoice &&
    settingsOn &&
    !inMaintenance
  );

  const disabledAll = !canVoice;

  // ✨ Estado controlado
  const [funcionesVoz, setFuncionesVoz] = useState("");
  const [infoClaveVoz, setInfoClaveVoz] = useState("");
  const [promptVoz, setPromptVoz] = useState("");
  const [bienvenidaVoz, setBienvenidaVoz] = useState("");
  const [voiceName, setVoiceName] = useState("alice");
  const [voiceHints, setVoiceHints] = useState("");    // NEW

  const idiomasDisponibles = [
    { label: t("common.lang.es"), value: "es-ES" },
    { label: t("common.lang.en"), value: "en-US" },
  ];

  const [voiceOptions, setVoiceOptions] = useState<{ label: string; value: string }[]>([]);
  const [voiceMessages, setVoiceMessages] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [linksUtiles, setLinksUtiles] = useState<any[]>([]);
  const [nuevoLink, setNuevoLink] = useState({ tipo: "", nombre: "", url: "" });
  const [audioDemoUrl, setAudioDemoUrl] = useState<string>("");
  const [usoVoz, setUsoVoz] = useState<any>(null);
  // E.164: + y 10–15 dígitos
  const E164_REGEX = /^\+\d{10,15}$/;

  const [representanteNumber, setRepresentanteNumber] = useState<string>("");
  const [repTouched, setRepTouched] = useState(false);

  // Normaliza: deja solo + y dígitos; colapsa múltiples '+'
  function normalizeTelInput(v: string) {
    let s = v.replace(/[^\d+]/g, '');
    if ((s.match(/\+/g) || []).length > 1) s = '+' + s.replace(/\+/g, '');
    if (s.length > 1) s = s[0] + s.slice(1).replace(/\+/g, '');
    return s;
  }

  // Válido si está vacío (sin transferencia) o cumple E.164
  const e164Ok = representanteNumber === "" || E164_REGEX.test(representanteNumber);

  const verificarPermiso = (e?: Event | React.SyntheticEvent) => {
    if (inMaintenance) {
      e?.preventDefault();
      toast.warning(`🛠️ Canal Voz en mantenimiento. ${channelState?.maintenance_message || ""}`);
      return false;
    }
    if (!planVoice) {
      e?.preventDefault();
      toast.warning("⚠️ Tu plan no incluye Voz. Actualiza para habilitarlo.");
      router.push("/upgrade");
      return false;
    }
    if (!settingsOn) {
      e?.preventDefault();
      toast.warning("📴 El canal de Voz está deshabilitado por el administrador.");
      return false;
    }
    // ✅ ahora decide por canEdit + trialDisponible
    if (!canEdit) {
      e?.preventDefault();
      if (trialDisponible) {
        toast.warning("🎁 Activa tu prueba gratis para configurar Voz.");
      } else {
        toast.warning("⚠️ Activa un plan para usar esta función.");
        router.push("/upgrade");
      }
      return false;
    }

    return true;
  };

  // Cargar configuración de voz por idioma
  useEffect(() => {
    const fetchVoiceConfig = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/voice-config?idioma=${idioma}&canal=voz`, {
          credentials: "include",
        });
        const data = await res.json();

        // Sincroniza inputs controlados con la config
        setPromptVoz(data?.system_prompt || "");
        setBienvenidaVoz(data?.welcome_message || "");
        setVoiceHints(data?.voice_hints || "");
        setFuncionesVoz(data?.funciones_asistente || "");
        setInfoClaveVoz(data?.info_clave || "");
        setVoiceName(data?.voice_name || "alice");
        setRepresentanteNumber(data?.representante_number || "");

        setAudioDemoUrl(data?.audio_demo_url || "");
      } catch (err) {
        console.error("Error al cargar configuración de voz:", err);
        // No interrumpimos la UI
      }
    };

    fetchVoiceConfig();
  }, [idioma]);

  // ✅ Lee flags de trial/can_edit del backend
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const s = await res.json();
        // el backend debe devolver: trial_disponible, trial_vigente (o trial_activo), can_edit
        const tDisponible = Boolean(s.trial_disponible);
        const tActivo = Boolean(s.trial_vigente || s.trial_activo);
        const editable = Boolean(s.can_edit ?? s.membresia_activa ?? tActivo);

        setTrialDisponible(tDisponible);
        setTrialActivo(tActivo);
        setCanEdit(editable);
      } catch (e) {
        console.error("❌ No se pudo leer /api/settings", e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/channel-settings?canal=voice`, {
          credentials: "include",
        });
        const d = await res.json();
        setChannelState({
          enabled: !!d.enabled,
          maintenance: !!d.maintenance,
          plan_enabled: !!d.plan_enabled,
          settings_enabled: !!d.settings_enabled,
          maintenance_message: d.maintenance_message || null,
        });
      } catch (err) {
        console.error("❌ Error obteniendo channel settings (voice):", err);
        setChannelState({
          enabled: false,
          maintenance: false,
          plan_enabled: false,
          settings_enabled: false,
          maintenance_message: null,
        });
      }
    })();
  }, []);

  // Historial (usar canal = 'voz' para coincidir con backend)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/messages?canal=voz`, {
          credentials: "include",
        });
        const data = await res.json();
        setVoiceMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar historial de voz:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchMessages();
  }, []);

  // Links útiles
  useEffect(() => {
    const fetchLinksUtiles = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/voice-links`, {
          credentials: "include",
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("GET /api/voice-links failed:", res.status, err);
          if (res.status === 401 || res.status === 403) {
            toast.warn("No autorizado para ver links. Inicia sesión nuevamente.");
          } else {
            toast.error("No se pudieron cargar los links útiles.");
          }
          setLinksUtiles([]);
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setLinksUtiles(data);
        } else {
          console.warn("GET /api/voice-links no devolvió array:", data);
          setLinksUtiles([]);
        }
      } catch (err) {
        console.error("Error cargando links útiles:", err);
        setLinksUtiles([]);
      }
    };

    fetchLinksUtiles();
  }, []); // <- sin tenantId en dependencias

  const agregarLink = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/voice-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(nuevoLink),
      });

      // 👇 Manejo del 403 por canal bloqueado
      if (res.status === 403) {
        let data: any = {};
        try { data = await res.json(); } catch {}
        if (data?.error === "channel_blocked") {
          const st = await refreshChannelVoice();
          if (st?.maintenance) {
            toast.warning(`🛠️ Voz en mantenimiento. ${st.maintenance_message || ""}`);
          } else if (!st?.plan_enabled) {
            toast.warning("❌ Tu plan no incluye Voz.");
          } else {
            toast.warning("📴 Voz deshabilitado en tu configuración.");
          }
          return;
        }
      }

      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success(t("voice.links.added"));
        setNuevoLink({ tipo: "", nombre: "", url: "" });
        if (data && Array.isArray(data)) {
          setLinksUtiles(data);
        } else {
          const res2 = await fetch(`${BACKEND_URL}/api/voice-links`, { credentials: "include" });
          const data2 = await res2.json().catch(() => []);
          setLinksUtiles(Array.isArray(data2) ? data2 : []);
        }
      } else {
        console.error("POST /api/voice-links error:", res.status, data);
        toast.error(t("voice.links.addError"));
      }
    } catch (err) {
      console.error("Error al agregar link:", err);
    }
  };
 
  const eliminarLink = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/voice-links/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.info(t("voice.links.deleted"));
        setLinksUtiles((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error("Error al eliminar link:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!e164Ok) {
      setRepTouched(true); // muestra el error si aún no tocó el input
      toast.error(t("voice.form.rep.e164Error"));
      return;
    }

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    // Asegura que los controlados también viajen
    formData.set("system_prompt", promptVoz);
    formData.set("welcome_message", bienvenidaVoz);
    formData.set("voice_hints", voiceHints);
    formData.set("funciones_asistente", funcionesVoz);
    formData.set("info_clave", infoClaveVoz);
    formData.set("voice_name", voiceName || "alice");
    formData.set("representante_number", representanteNumber.trim());

    try {
      const res = await fetch(`${BACKEND_URL}/api/voice-config`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      // 👇 Manejo del 403 por canal bloqueado
      if (res.status === 403) {
        let json: any = {};
        try { json = await res.json(); } catch {}
        if (json?.error === "channel_blocked") {
          const st = await refreshChannelVoice();
          if (st?.maintenance) {
            toast.warning(`🛠️ Voz en mantenimiento. ${st.maintenance_message || ""}`);
          } else if (!st?.plan_enabled) {
            toast.warning("❌ Tu plan no incluye Voz.");
          } else {
            toast.warning("📴 Voz deshabilitado en tu configuración.");
          }
          return;
        }
      }

      if (res.ok) {
        toast.success(t("voice.saved"));
      } else {
        toast.error(t("common.somethingWentWrong"));
      }
    } catch (err) {
      console.error("Error al guardar:", err);
      alert(t("common.unexpectedError"));
    }
  };

  // Uso / créditos
  useEffect(() => {
    const fetchUsos = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/usage`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUsoVoz(data.usos.find((u: any) => u.canal === "voz"));
        }
      } catch (error) {
        console.error("Error obteniendo uso:", error);
      }
    };
    fetchUsos();
  }, []);

  const comprarMas = async (canal: string, cantidad: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout-credit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal,
          cantidad,
          redirectPath: "/dashboard/voice-config",
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("❌ Error al iniciar la compra.");
      }
    } catch (error) {
      console.error("❌ Error al procesar la compra:", error);
      alert("❌ Error al procesar la compra.");
    }
  };

  const calcularPorcentaje = (usados: number, limite: number) => (usados / limite) * 100;
  const colorBarra = (porcentaje: number) => {
    if (porcentaje > 80) return "bg-red-500";
    if (porcentaje > 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const refreshChannelVoice = async () => {
    try {
      const stRes = await fetch(`${BACKEND_URL}/api/channel-settings?canal=voice`, { credentials: "include" });
      const st = await stRes.json();
      setChannelState({
        enabled: !!st.enabled,
        maintenance: !!st.maintenance,
        plan_enabled: !!st.plan_enabled,
        settings_enabled: !!st.settings_enabled,
        maintenance_message: st.maintenance_message || null,
      });
      return st;
    } catch (e) {
      console.error("❌ Error refrescando channel-state voice:", e);
      return null;
    }
  };

  const handleClaimTrial = async () => {
  try {
    const r = await fetch(`${BACKEND_URL}/api/billing/claim-trial`, {
      method: "POST",
      credentials: "include",
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      toast.error(`❌ ${j?.error || "No se pudo activar la prueba"}`);
      return;
    }
    toast.success("✅ ¡Prueba gratis activada!");
    // refresca settings para que canEdit cambie a true
    const sRes = await fetch(`${BACKEND_URL}/api/settings`, { credentials: "include", cache: "no-store" });
    const s = await sRes.json();
    setTrialDisponible(Boolean(s.trial_disponible));
    const tActivo = Boolean(s.trial_vigente || s.trial_activo);
    setTrialActivo(tActivo);
    setCanEdit(Boolean(s.can_edit ?? s.membresia_activa ?? tActivo));
  } catch (e) {
    console.error(e);
    toast.error("❌ Error activando la prueba");
  }
};

  return (
    <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
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
        <SiAudioboom
          size={28}
          className="text-green-400 animate-pulse sm:size-9"
        />
        <span>
          {t("voice.title")}
          <br className="sm:hidden" />
          {t("voice.titleSuffix")}
        </span>
      </h1>

      <ChannelStatus
        canal="voice"
        showBanner
        hideTitle
        membershipInactive={membershipInactive}
      />

      {/* 🎁 Caso 1: nunca usó trial → invitar a activar */}
      {trialDisponible && !canEdit && (
        <div className="mb-6 p-4 bg-purple-500/20 border border-purple-400 text-purple-100 rounded text-sm text-center">
          🎁 <strong>{t("voice.trial.ctaTitle")}</strong> {t("voice.trial.ctaBody")}
          <button
            onClick={() => router.push('/upgrade')}
            className="ml-3 inline-flex items-center px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white"
          >
            {t("voice.trial.activate")}
          </button>
        </div>
      )}

      {/* 🟡 Caso 2: trial activo sin plan pago → permitir edición */}
      {!tieneMembresia && trialActivo && (
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-400 text-yellow-100 rounded text-sm text-center">
          🟡 {t("voice.trial.active")}
        </div>
      )}

      {/* 🔴 Caso 3: sin plan ni trial → bloqueado */}
      {!canEdit && !trialDisponible && !trialActivo && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-400 text-red-100 rounded text-sm text-center">
          🚫 {t("voice.membership.inactive")}
          <button
            onClick={() => router.push("/upgrade")}
            className="ml-3 inline-flex items-center px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white"
          >
            {t("voice.membership.activate")}
          </button>
        </div>
      )}

      <TrainingHelp context="voice" />

      <VoiceMinutesCard />

      <div className="flex space-x-4 mb-6">
      {idiomasDisponibles.map((lang) => (
        <button
          key={lang.value}
          type="button"
          onClick={() => setIdioma(lang.value)}
          disabled={disabledAll}
          className={`px-4 py-2 rounded ${
            idioma === lang.value
              ? "bg-purple-600 text-white"
              : "bg-gray-200 text-gray-900 hover:bg-gray-300"
          }`}
          title={disabledAll ? t("common.blockedByPlan") : ""}
          aria-pressed={idioma === lang.value}
        >
          {lang.label}
        </button>
      ))}
    </div>

      {!tieneMembresia && !trialActivo && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded mb-6 text-sm border border-yellow-400">
          ⚠️ {t("voice.membership.viewOnly")}
        </div>
      )}

      <form
        onSubmit={(e) => {
          if (verificarPermiso(e)) {
            handleSubmit(e);
          }
        }}
        className="mb-10"
      >
        <input type="hidden" name="idioma" value={idioma} />
        <input type="hidden" name="canal" value="voz" />
        <input type="hidden" name="tenant_id" value={tenantId || ""} />

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div>
            <label className="block text-white font-semibold mb-1">{t("voice.form.funciones.label")}</label>
            <textarea
              name="funciones_asistente"
              value={funcionesVoz}
              onChange={(e) => setFuncionesVoz(e.target.value)}
              rows={3}
              placeholder={t("voice.form.funciones.placeholder")}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-1">{t("voice.form.infoClave.label")}</label>
            <textarea
              name="info_clave"
              value={infoClaveVoz}
              onChange={(e) => setInfoClaveVoz(e.target.value)}
              rows={3}
              placeholder={t("voice.form.infoClave.placeholder")}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />
          </div>
        </div>

        <VoicePromptGenerator
          idioma={idioma}
          categoria="voz"
          funciones={funcionesVoz}
          infoClave={infoClaveVoz}
          disabled={disabledAll || !tieneMembresia}
          onGenerate={(nuevoPrompt, nuevaBienvenida) => {
            setPromptVoz(nuevoPrompt);
            setBienvenidaVoz(nuevaBienvenida);
          }}
        />

        <div className="grid grid-cols-1 gap-6 mt-6">
          <div>
            <label className="block text-white font-semibold mb-1">{t("voice.form.prompt.label")}</label>
            <textarea
              name="system_prompt"
              value={promptVoz}
              onChange={(e) => setPromptVoz(e.target.value)}
              rows={6}
              placeholder={t("voice.form.prompt.placeholder")}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-1">{t("voice.form.welcome.label")}</label>
            <input
              type="text"
              name="welcome_message"
              value={bienvenidaVoz}
              onChange={(e) => setBienvenidaVoz(e.target.value)}
              placeholder={t("voice.form.welcome.placeholder")}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />

            <input type="hidden" name="voice_name" value={voiceName || "alice"} 
            />

            <label className="block text-white font-semibold mt-4 mb-1">{t("voice.form.hints.label")}</label>
            <input
              type="text"
              name="voice_hints"
              value={voiceHints}
              onChange={(e) => setVoiceHints(e.target.value)}
              placeholder={t("voice.form.hints.placeholder")}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />
          </div>
            <div className="mt-6">
              <label className="block text-white font-semibold mb-1">
                {t("voice.form.rep.label")}
              </label>
              <input
                type="tel"
                name="representante_number"
                value={representanteNumber}
                onChange={(e) => setRepresentanteNumber(normalizeTelInput(e.target.value))}
                onBlur={() => setRepTouched(true)}
                placeholder="+15551234567"
                inputMode="tel"
                maxLength={16}                 // + y hasta 15 dígitos
                pattern="^\+\d{10,15}$"        // hint para el navegador
                title="Formato E.164: + y 10–15 dígitos (ej: +15551234567)"
                aria-invalid={!e164Ok && repTouched}
                className={`w-full px-3 py-2 rounded bg-white/10 border text-white
                  ${!e164Ok && repTouched ? 'border-red-500' : 'border-white/20'}`}
              />
              {!e164Ok && repTouched && (
                <p className="text-red-400 text-sm mt-1">
                  {t("voice.form.rep.e164Hint")}
                </p>
              )}
              <p className="text-xs text-white/70 mt-1">
                {t("voice.form.rep.optionalHint")}
              </p>
            </div>
        </div>

        {audioDemoUrl && (
          <div className="mt-6">
            <label className="block mb-2 font-semibold text-white">{t("voice.audio.preview")}</label>
            <VoicePlayer url={audioDemoUrl} />
          </div>
        )}

        <div className="mt-10 mb-8">
          <label className="block mb-2 font-semibold text-white flex items-center gap-2">
            <Link className="text-blue-400" /> {t("voice.links.title")}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder={t("voiceConfig.placeholder.type")}
              value={nuevoLink.tipo}
              onChange={(e) => setNuevoLink({ ...nuevoLink, tipo: e.target.value })}
              className="border px-3 py-2 rounded"
            />
            <input
              type="text"
              placeholder={t("voiceConfig.placeholder.name")}
              value={nuevoLink.nombre}
              onChange={(e) => setNuevoLink({ ...nuevoLink, nombre: e.target.value })}
              className="border px-3 py-2 rounded"
            />
            <input
              type="text"
              placeholder={t("voiceConfig.placeholder.url")}
              value={nuevoLink.url}
              onChange={(e) => setNuevoLink({ ...nuevoLink, url: e.target.value })}
              className="border px-3 py-2 rounded"
            />
          </div>
          <button
            type="button"
            className={`px-4 py-2 rounded mb-4 ${
              (!canEdit || disabledAll) ? "bg-gray-400 text-white/80" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            onClick={(e) => {
              if (verificarPermiso(e)) agregarLink();
            }}
            disabled={!canEdit || disabledAll}
            title={
              disabledAll
                ? "Bloqueado por tu plan"
                : (!canEdit ? (trialDisponible ? "Activa tu prueba gratis" : "Requiere membresía") : "")
            }
          >
            {t("voice.links.add")}
          </button>

          <ul className="text-white space-y-2">
            {linksUtiles.map((link) => (
              <li key={link.id} className="flex justify-between items-center bg-white/5 p-3 rounded-md">
                <span className="text-sm">
                  <strong>{link.tipo}</strong>: {link.nombre} —{" "}
                  <a href={link.url} target="_blank" rel="noreferrer" className="underline">
                    {link.url}
                  </a>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    // Bloquea por plan o membresía
                    if (disabledAll || !tieneMembresia) return;
                    // (Opcional) si usas verificarPermiso:
                    // if (!verificarPermiso(e)) return;
                    eliminarLink(link.id);
                  }}
                  disabled={disabledAll || !tieneMembresia}
                  aria-disabled={disabledAll || !tieneMembresia}
                  tabIndex={(disabledAll || !tieneMembresia) ? -1 : 0}
                  className={`text-lg font-bold ml-4 ${
                    (disabledAll || !tieneMembresia)
                      ? "text-white/40 cursor-not-allowed"
                      : "text-red-500 hover:text-red-700"
                  }`}
                  title={
                    disabledAll
                      ? "Bloqueado por tu plan"
                      : (!tieneMembresia ? "Requiere membresía" : t("common.delete"))
                  }
                >
                  ✖
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <button
              type="submit"
              className={`px-6 py-2 rounded shadow text-white ${
                (!canEdit || !e164Ok || disabledAll)
                  ? 'bg-gray-400'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={!canEdit || !e164Ok || disabledAll}
              aria-disabled={!canEdit || !e164Ok || disabledAll}
              title={
                disabledAll
                  ? "Bloqueado por tu plan"
                  : (!canEdit ? (trialDisponible ? "Activa tu prueba gratis" : "Requiere membresía") : (!e164Ok ? "Teléfono inválido" : ""))
              }
            >
              {t("common.save")}
            </button>
          </div>
        </div>
      </form>

      <hr className="my-8 border-white/20" />
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
        <Brain className="text-purple-300" />
        {t("voice.history.title")}
      </h2>

      {loadingHistory ? (
        <div className="text-gray-400 animate-pulse">{t("common.loading")}</div>
      ) : !Array.isArray(voiceMessages) || voiceMessages.length === 0 ? (
        <div className="text-gray-400">{t("voice.history.empty")}</div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {voiceMessages
            .slice()
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((msg, idx) => (
              <div key={idx} className="bg-white/10 border border-white/20 p-4 rounded-xl backdrop-blur-sm mb-4">
                <div className="text-sm text-white/70 mb-1">
                  {new Date(msg.timestamp).toLocaleString()} — {msg.from_number || t("common.anonymous")}
                </div>
                <div className="font-semibold text-white">
                  {msg.role === "user" ? (
                    <>
                      <User className="inline-block w-4 h-4 mr-1 text-white/70" /> {t("voice.history.customer")}: {msg.content}
                    </>
                  ) : (
                    <>
                      <Bot className="inline-block w-4 h-4 mr-1 text-white/70" /> {t("voice.history.bot")}: {msg.content}
                    </>
                  )}
                </div>
                {msg.role === "user" && msg.emotion && (
                  <div className="text-sm mt-1 text-purple-300">
                    {t("voice.history.emotionDetected")}: <span className="font-medium">{msg.emotion}</span>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
      <Footer />
    </div>
  );
}
