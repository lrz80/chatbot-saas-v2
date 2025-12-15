"use client";

import Footer from '@/components/Footer';
import { useEffect, useRef, useState } from "react";
import TrainingHelp from "@/components/TrainingHelp";
import PromptGenerator from "@/components/PromptGenerator";
import { useRouter } from "next/navigation";
import { Save, } from "lucide-react";
import { BACKEND_URL } from "@/utils/api";
import { SiMeta, SiMinutemailer, } from 'react-icons/si';
import FaqSection from "@/components/FaqSection";
import type { FaqSugerida } from "@/components/FaqSection";
import IntentSection, { Intent } from "@/components/IntentSection";
import { useFeatures } from '@/hooks/usePlan';
import ChannelStatus from "@/components/ChannelStatus";
import { MetaPageSelector } from '@/components/MetaPageSelector';

const canal = 'meta'; // o 'facebook', 'instagram', 'voz'

const META_CONNECT_URL = `${BACKEND_URL}/api/facebook/oauth-start`;

type MetaConnState = {
  connected: boolean;
  needsReconnect: boolean;
  fb?: { id?: string; name?: string };
  ig?: { id?: string; username?: string };
};

export default function MetaConfigPage() {
  const router = useRouter();
  const { loading: loadingPlan, features, esTrial } = useFeatures();

  // features = { whatsapp, meta, voice, sms, email }
  const [metaConn, setMetaConn] = useState<MetaConnState>({
  connected: false,
  needsReconnect: false,
});

const goConnectMeta = () => {
  if (!canMeta) { router.push("/upgrade"); return; }
  window.location.href = META_CONNECT_URL;
};

const handleDisconnect = async () => {
  if (!canMeta) { router.push("/upgrade"); return; }
  try {
    const r = await fetch(`${BACKEND_URL}/api/meta-config/disconnect`, {
      method: "POST",
      credentials: "include",
    });

    if (r.ok) {
      setMetaConn({ connected: false, needsReconnect: true, fb: undefined, ig: undefined });
      alert("Cuentas desconectadas ✅");
    } else {
      const j = await r.json().catch(() => ({}));
      alert(`❌ Error al desconectar: ${j?.error || r.statusText}`);
    }
  } catch (e) {
    console.error(e);
    alert("❌ Error al desconectar.");
  }
};

// ✅ Refresca el estado de conexión Meta (FB/IG) leyendo la DB
const refreshMetaConn = async () => {
  try {
    const mc = await fetch(`${BACKEND_URL}/api/meta-config`, {
      credentials: "include",
      cache: "no-store",
    });

    if (!mc.ok) {
      setMetaConn({ connected: false, needsReconnect: true });
      return;
    }

    const m = await mc.json();
    const hasFB = Boolean(m?.facebook_page_id);
    const hasIG = Boolean(m?.instagram_page_id);
    const isConnected = hasFB || hasIG;

    setMetaConn({
      connected: isConnected,
      needsReconnect: !isConnected,
      fb: hasFB ? { id: m.facebook_page_id, name: m.facebook_page_name } : undefined,
      ig: hasIG ? { id: m.instagram_page_id, username: m.instagram_page_name } : undefined,
    });
  } catch (e) {
    console.error("❌ refreshMetaConn error:", e);
  }
};

  const previewRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  type AssistantStructured =
  | string
  | {
      text?: string;
      mensaje?: string; // compat
      opciones?: Array<{ texto: string; respuesta?: string; submenu?: any }>;
    };

  type ChatMsg = { role: "user" | "assistant"; content: AssistantStructured };

  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intents, setIntents] = useState<Intent[]>([]);
  const [usage, setUsage] = useState({ used: 0, limit: null, porcentaje: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [usoMeta, setUsoMeta] = useState<any>(null);
  const [usos, setUsos] = useState<any[]>([]);
  const [clientOnly, setClientOnly] = useState(false);
  // ✅ usa este estado nuevo:
  const [channelState, setChannelState] = useState<{
    enabled: boolean;          // final para la UI
    plan_enabled: boolean;     // plan lo incluye
    settings_enabled: boolean; // toggle admin en DB
    maintenance: boolean;      // mantenimiento activo
  }>({ enabled: false, plan_enabled: false, settings_enabled: false, maintenance: false });

  useEffect(() => {
    setClientOnly(true);
  }, []);
  type Faq = {
    id?: number;
    pregunta: string;
    respuesta: string;
  };

  const [faq, setFaq] = useState<Faq[]>([]); // Usa el tipo importado de FaqSection si prefieres
  const [faqSugeridas, setFaqSugeridas] = useState<FaqSugerida[]>([]);
  
  const [settings, setSettings] = useState({
    name: "",
    categoria: "",
    prompt: "Eres un asistente útil.",
    bienvenida: "¡Hola! ¿En qué puedo ayudarte hoy?",
    membresia_activa: false,
    informacion_negocio: "",
    funciones_asistente: "",
    info_clave: "",
    idioma: "es",
    // ⬇️ NUEVO
    trial_disponible: false,
    trial_activo: false,
    can_edit: false,
});

  const isMembershipActive = Boolean(settings?.membresia_activa || settings?.trial_activo); // ✅ trial cuenta como activo
  const membershipInactive  = !isMembershipActive;
  const planHasMeta        = Boolean(channelState.plan_enabled);
  const channelMetaOn      = Boolean(channelState.settings_enabled);

  // ✅ Desbloquea si: plan lo incluye + toggle ON + sin mantenimiento + (plan activo o trial activo)
  const canMeta = Boolean(planHasMeta && channelMetaOn && !channelState.maintenance && (settings?.can_edit || isMembershipActive));

  const disabledAll = !canMeta;

  // 🔎 Exponer al window para inspeccionar en consola
  useEffect(() => { (window as any).__features  = features }, [features]);
  useEffect(() => { (window as any).__settings  = settings }, [settings]);

  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);
  
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1) Lee /api/settings para obtener trial flags y perfil base
        const settingsCoreRes = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: "include",
          cache: "no-store",
        });

        if (settingsCoreRes.ok) {
          const sdata = await settingsCoreRes.json();
          setSettings((prev) => ({
            ...prev,
            name: sdata?.name ?? prev.name,
            categoria: sdata?.categoria ?? prev.categoria,
            idioma: sdata?.idioma ?? prev.idioma,
            membresia_activa: Boolean(sdata?.membresia_activa),
            // ⬇️ flags de trial/can_edit que vienen del backend
            trial_disponible: Boolean(sdata?.trial_disponible),
            trial_activo: Boolean(sdata?.trial_vigente || sdata?.trial_activo),
            can_edit: Boolean(sdata?.can_edit ?? sdata?.membresia_activa ?? (sdata?.trial_vigente || sdata?.trial_activo)),
          }));
        }

        // 2) El resto de endpoints en paralelo
        const [settingsRes, faqRes, intentsRes, sugeridasRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/meta-config`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/faqs?canal=meta`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/intents?canal=meta`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/faqs/sugeridas?canal=meta`, { credentials: "include" }),
        ]);

        console.log("🔥 llamé /api/faqs/sugeridas?canal=meta:", sugeridasRes.status);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings((prev) => ({
            ...prev,
            name: data?.name || prev.name,
            categoria: data?.categoria || prev.categoria,
            prompt: data?.prompt ?? prev.prompt,
            bienvenida: data?.bienvenida ?? prev.bienvenida,
            informacion_negocio: data?.informacion_negocio ?? prev.informacion_negocio,
            funciones_asistente: data?.funciones_asistente ?? prev.funciones_asistente,
            info_clave: data?.info_clave ?? prev.info_clave,
            idioma: data?.idioma ?? prev.idioma,
            // 👇 NO toques los flags de trial aquí: ya vinieron de /api/settings
          }));
          setMessages([{ role: "assistant", content: data?.bienvenida ?? "¡Hola! ¿Cómo puedo ayudarte?" }]);
          setUsos(data?.limites || {});
        }

        if (faqRes.ok) setFaq(await faqRes.json());
        if (intentsRes.ok) {
          const arr = await intentsRes.json();
          const parsed: Intent[] = Array.isArray(arr)
            ? arr.map((x: any) => ({
                id: x?.id || (globalThis.crypto?.randomUUID?.() ?? String(Math.random())),
                nombre: x?.nombre ?? "",
                ejemplos: Array.isArray(x?.ejemplos) ? x.ejemplos : [],
                respuesta: x?.respuesta ?? "",
              }))
            : [];
          setIntents(parsed);
        }

        if (sugeridasRes.ok) {
          const raw: any[] = await sugeridasRes.json().catch(() => []);
          const limpias = raw
            .map((x: any) => ({
              id: Number(x?.id),
              pregunta: String(x?.pregunta ?? "").trim(),
              respuesta_sugerida: String(x?.respuesta_sugerida ?? "").trim(),
              canal: x?.canal ?? "meta",
            }))
            .filter(f => f.pregunta && f.respuesta_sugerida);

          console.log("✅ faqs sugeridas meta:", limpias);
          setFaqSugeridas(limpias);
        } else {
          console.warn("⚠️ /api/faqs/sugeridas status:", sugeridasRes.status);
          setFaqSugeridas([]);
        }

        // 3) Estado de conexión Meta
        try {
          const mc = await fetch(`${BACKEND_URL}/api/meta-config`, { credentials: "include" });
          if (mc.ok) {
            const m = await mc.json();
            const hasFB = Boolean(m?.facebook_page_id);
            const hasIG = Boolean(m?.instagram_page_id);
            const isConnected = hasFB || hasIG;

            setMetaConn({
              connected: isConnected,
              needsReconnect: !isConnected,
              fb: hasFB ? { id: m.facebook_page_id, name: m.facebook_page_name } : undefined,
              ig: hasIG ? { id: m.instagram_page_id, username: m.instagram_page_name } : undefined,
            });
          } else if (mc.status === 401) {
            setMetaConn({ connected: false, needsReconnect: true });
          }
        } catch (e) {
          console.error("❌ Error cargando meta-config:", e);
          setMetaConn((prev) => ({ ...prev, connected: false, needsReconnect: true }));
        }

        // 4) Flags de canal en DB
        try {
          const ch = await fetch(`${BACKEND_URL}/api/channel-settings?canal=meta`, {
            credentials: "include",
            cache: "no-store",
          });
          if (ch.ok) {
            const data = await ch.json();
            setChannelState({
              enabled: Boolean(data.enabled),
              plan_enabled: Boolean(data.plan_enabled),
              settings_enabled: Boolean(data.settings_enabled),
              maintenance: Boolean(data.maintenance),
            });
            (window as any).__channelState = data;
            console.log("channel-state(meta):", data);
          } else {
            console.warn("⚠️ /api/channel-settings(meta) status:", ch.status);
          }
        } catch (e) {
          console.error("❌ Error cargando channel-settings(meta):", e);
        }

      } catch (err) {
        console.error("❌ Error cargando configuración:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [router]);

  const handleChange = (e: any) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);

    // payload SOLO de meta_configs
    const payload = {
      funciones_asistente: settings.funciones_asistente?.trim() || "",
      info_clave: (settings.info_clave ?? '').replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').trim(),
      prompt_meta: settings.prompt,          // 👈 el backend espera *_meta
      bienvenida_meta: settings.bienvenida,  // 👈 el backend espera *_meta
      idioma: settings.idioma ?? "es",
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/meta-config`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert("❌ Error al guardar (meta_configs): " + (data?.error || res.statusText));
      } else {
        alert("Configuración Meta guardada ✅");
      }
    } catch (err) {
      console.error("❌ Error en handleSave(meta):", err);
      alert("Error al guardar la configuración de Meta.");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!canMeta) { router.push("/upgrade"); return; }
    await sendPreview(input.trim());
  };

  const saveIntents = async () => {
    // Normaliza y valida
    const intencionesLimpias = intents
      .map(i => ({
        id: i.id, // ✅ importante
        nombre: (i.nombre || '').trim(),
        ejemplos: (i.ejemplos || []).map(e => (e || '').trim()).filter(Boolean),
        respuesta: (i.respuesta || '').trim(),
      }))
      .filter(i => i.nombre && i.ejemplos.length > 0 && i.respuesta);

    if (!intencionesLimpias.length) {
      return alert("❌ Agrega al menos una intención válida.");
    }

    try {
      // ✅ Reemplazo total por canal
      const res = await fetch(`${BACKEND_URL}/api/intents?canal=meta`, {
        method: "PUT",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intents: intencionesLimpias }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return alert(`❌ Error al guardar intenciones: ${json?.error || res.statusText}`);
      }

      alert("Intenciones guardadas ✅");

      // 🔄 Recarga desde DB para reflejar exactamente lo persistido
      const r2 = await fetch(`${BACKEND_URL}/api/intents?canal=meta`, {
        credentials: "include",
        cache: "no-store",
      });
      if (r2.ok) {
        const arr2 = await r2.json();
        const parsed2: Intent[] = Array.isArray(arr2)
          ? arr2.map((x:any) => ({
              id: x?.id || (globalThis.crypto?.randomUUID?.() ?? String(Math.random())),
              nombre: x?.nombre ?? "",
              ejemplos: Array.isArray(x?.ejemplos) ? x.ejemplos : [],
              respuesta: x?.respuesta ?? "",
            }))
          : [];
        setIntents(parsed2);
      }
    } catch (e) {
      console.error("❌ Error guardando intenciones (meta):", e);
      alert("❌ Error guardando intenciones.");
    }
  };
  
  const saveFaqs = async () => {
    // Normaliza/valida
    const faqsValidas = (faq ?? [])
      .map(f => ({
        pregunta: (f.pregunta || "").trim(),
        respuesta: (f.respuesta || "").trim(),
      }))
      .filter(f => f.pregunta && f.respuesta);
  
    if (!faqsValidas.length) {
      alert("❌ Agrega al menos una FAQ válida.");
      return;
    }
  
    try {
      const res = await fetch(`${BACKEND_URL}/api/faqs?canal=${canal}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faqs: faqsValidas }),
      });
  
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`❌ Error al guardar FAQs: ${json?.error || res.statusText}`);
        return;
      }
  
      // Recarga desde DB
      const reload = await fetch(`${BACKEND_URL}/api/faqs?canal=${canal}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (reload.ok) setFaq(await reload.json());
  
      alert("FAQs guardadas ✅");
    } catch (e) {
      console.error("❌ Error guardando FAQs:", e);
      alert("❌ Error guardando FAQs.");
    }
  };
  
  // 🔁 Envío reutilizable para preview (Meta)
  const sendPreview = async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsTyping(true);
    setInput("");
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);

    try {
      // ⬇️ Endpoint de preview para Meta
      const res = await fetch(`${BACKEND_URL}/api/preview/meta`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const resp = data?.response;

      // Si el backend devuelve estructura de Flow (objeto), la guardamos tal cual
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: String(resp ?? "...") },
      ]);
    } catch (e) {
      console.error("❌ Error en preview:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, ocurrió un error en la vista previa." },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  };
  
  // Agrega esta función dentro del componente
  const comprarMas = async (canal: string, cantidad: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout-credit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal,
          cantidad,
          redirectPath: "/dashboard/meta-config",  // Puedes ajustar si necesitas otro path
        }),
      });
  
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;  // Redirige a Stripe Checkout
      } else {
        alert("❌ Error al iniciar la compra.");
      }
    } catch (error) {
      console.error("❌ Error al comprar créditos:", error);
      alert("❌ Error al procesar la compra.");
    }
  };  

  useEffect(() => {
    const fetchUsos = async () => {
      const res = await fetch(`${BACKEND_URL}/api/usage`, { credentials: "include" });
      const data = await res.json();
      setUsos(data.usos || []);
      setUsoMeta(data.usos.find((u: any) => u.canal === "meta"));
    };
    fetchUsos();
  }, []);

  const calcularPorcentaje = (usados: number, limite: number) => {
    if (!limite || limite === 0) return 0;
    return (usados / limite) * 100;
  };
  
  const colorBarra = (porcentaje: number) => {
    if (porcentaje > 80) return "bg-red-500";
    if (porcentaje > 50) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  const renderAssistantContent = (content: AssistantStructured) => {
  return <>{typeof content === "string" ? content : String(content?.text ?? content?.mensaje ?? "")}</>;
  };

  if (loading || loadingPlan) return <p className="text-center">Cargando configuración...</p>;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] text-white px-4 py-6 sm:px-6 md:px-8">
      <div className="w-full max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md px-4 py-6 sm:p-8">
  
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
          <SiMeta
            size={28}
            className="text-green-400 animate-pulse sm:size-9"
          />
          <span>
            Configuración del Asistente
            <br className="sm:hidden" />
            de Facebook e Instagram
          </span>
        </h1>

        <ChannelStatus
          canal="meta"
          showBanner
          hideTitle
          membershipInactive={membershipInactive}
        />

        {/* 🎁 Caso 1: Nunca usó trial → invitar a activar prueba */}
        {settings?.trial_disponible && !settings?.can_edit && (
          <div className="mb-4 sm:mb-6 px-3 py-2 sm:p-4 bg-purple-500/20 border border-purple-400 text-purple-100 rounded text-center text-sm sm:text-base font-medium">
            🎁 <strong>Activa tu prueba gratis</strong> y comienza a usar el canal Meta.
            <button
              onClick={() => router.push('/upgrade')}
              className="ml-3 inline-flex items-center px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              Activar prueba gratis
            </button>
          </div>
        )}

        {/* 🟡 Caso 2: Trial activo (permitido editar) → mensaje informativo */}
        {!settings?.membresia_activa && settings?.trial_activo && (
          <div className="mb-4 sm:mb-6 px-3 py-2 sm:p-4 bg-yellow-500/20 border border-yellow-400 text-yellow-200 rounded text-center text-sm sm:text-base font-medium">
            🟡 Estás usando la <strong>prueba gratis</strong>. ¡Aprovecha para configurar tu asistente en Meta!
          </div>
        )}

        {/* 🔴 Caso 3: Sin plan y sin trial → banner inactiva */}
        {!settings?.can_edit && !settings?.trial_disponible && !settings?.trial_activo && (
          <div className="mb-4 sm:mb-6 px-3 py-2 sm:p-4 bg-red-500/20 border border-red-400 text-red-200 rounded text-center text-sm sm:text-base font-medium">
            🚫 Tu membresía está inactiva. No puedes guardar cambios ni entrenar el asistente en Meta.{" "}
            <a onClick={() => router.push('/upgrade')} className="underline cursor-pointer">
              Activa un plan para continuar.
            </a>
          </div>
        )}

        {usage.porcentaje >= 80 && (
          <div className="mb-4 sm:mb-6 px-3 py-2 sm:p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-center text-sm sm:text-base font-medium">
            ⚠ Estás utilizando el <strong>{usage.porcentaje}%</strong> de tu límite mensual ({usage.used}/{usage.limit} mensajes).<br />Considera actualizar tu plan para evitar interrupciones.
          </div>
        )}
  
        <TrainingHelp context="meta" />

        {/* 🔗 Integración con Meta: botones SIEMPRE visibles */}
        <div className="mb-4 sm:mb-6 px-3 py-3 sm:p-4 rounded-xl border text-xs sm:text-sm bg-white/5 border-white/10 text-white">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-1">
                <p className="font-semibold">Integración con Facebook / Instagram</p>
                <p className="text-white/80 text-xs">
                  Estado:{" "}
                  {metaConn.connected
                    ? "Conectado ✅"
                    : metaConn.needsReconnect
                    ? "Requiere conexión ⚠️"
                    : "No conectado"}
                </p>
                {(metaConn.fb || metaConn.ig) && (
                  <div className="text-white/70 text-xs space-y-1">
                    {metaConn.fb && (
                      <p>Facebook: {metaConn.fb.name ?? "—"} {metaConn.fb.id ? `(${metaConn.fb.id})` : ""}</p>
                    )}
                    {metaConn.ig && (
                      <p>Instagram: @{metaConn.ig.username ?? "—"} {metaConn.ig.id ? `(${metaConn.ig.id})` : ""}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
                {/* ÚNICO botón para FB/IG */}
                <button
                  onClick={goConnectMeta}
                  disabled={disabledAll}
                  aria-disabled={disabledAll}
                  className={`w-full sm:w-auto px-3 py-2 rounded text-sm text-white ${
                    !disabledAll
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
                  }`}

                  title={
                    canMeta
                      ? ""
                      : !isMembershipActive
                        ? "Requiere membresía activa"
                        : !planHasMeta
                          ? "Tu plan no incluye Meta"
                          : !channelMetaOn
                            ? "Canal Meta desactivado por admin"
                            : channelState.maintenance
                              ? "Canal en mantenimiento"
                              : ""
                  }
                >
                  {metaConn.connected ? "Reconectar Facebook/Instagram" : "Conectar Facebook/Instagram"}
                </button>

                <button
                  onClick={handleDisconnect}
                  disabled={disabledAll || (!metaConn.connected && !metaConn.fb && !metaConn.ig)}
                  aria-disabled={disabledAll || (!metaConn.connected && !metaConn.fb && !metaConn.ig)}
                  className={`w-full sm:w-auto px-3 py-2 rounded border text-sm ${
                    canMeta && (metaConn.connected || metaConn.fb || metaConn.ig)
                      ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                      : "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                  }`}

                  title={
                    canMeta
                      ? ""
                      : !isMembershipActive
                        ? "Requiere membresía activa"
                        : !planHasMeta
                          ? "Tu plan no incluye Meta"
                          : !channelMetaOn
                            ? "Canal Meta desactivado por admin"
                            : channelState.maintenance
                              ? "Canal en mantenimiento"
                              : ""
                  }
                >
                  Desconectar
                </button>
              </div>
            </div>

            <p className="text-[12px] text-white/60">
              Tip: el mismo flujo de conexión concede permisos para Página de Facebook y mensajes de Instagram (si tu
              IG está vinculado a esa Página). Si cambiaste la contraseña de Facebook o Meta invalidó el token, pulsa
              “Reconectar”.
            </p>
          </div>
        </div>

        <MetaPageSelector onConnected={refreshMetaConn} />

        {usoMeta && (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <SiMeta /> Uso de Facebook / Instagram
            </h3>

            <p className="text-white text-sm mb-2">
              {usoMeta.usados ?? 0} de {usoMeta.limite} mensajes enviados
              {(usoMeta.creditos_extras ?? 0) > 0 && " (incluye créditos extra)"}
            </p>

            {(usoMeta.creditos_extras ?? 0) > 0 && (
              <p className="text-green-300 text-sm">
                Incluye {usoMeta.creditos_extras} mensajes extra comprados.
              </p>
            )}

            <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
              <div
                className={`h-full ${colorBarra(
                  calcularPorcentaje(usoMeta.usados, usoMeta.limite)
                )} transition-all duration-500`}
                style={{
                  width: `${calcularPorcentaje(
                    usoMeta.usados,
                    usoMeta.limite
                  )}%`,
                }}
              />
            </div>

            <div className="flex gap-2">
              {[500, 1000, 2000].map((extra) => (
                <button
                  key={extra}
                  onClick={() => comprarMas("meta", extra)}
                  className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
                >
                  +{extra}
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          name="name"
          value={settings.name}
          readOnly
          placeholder="Nombre del negocio"
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
        />
  
        <select
          name="idioma"
          value={settings.idioma}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
          disabled={!canMeta}
        >
          <option value="es">Español</option>
          <option value="en">Inglés</option>
        </select>
  
        <PromptGenerator
          infoClave={settings.info_clave}
          funcionesAsistente={settings.funciones_asistente}
          setInfoClave={(value) => setSettings((prev) => ({ ...prev, info_clave: value }))}
          setFuncionesAsistente={(value) =>
            setSettings((prev) => ({ ...prev, funciones_asistente: value }))
          }
          idioma={settings.idioma}
          membresiaActiva={canMeta}
          onPromptGenerated={(prompt) => setSettings((prev) => ({ ...prev, prompt }))}
        />
  
        <input
          name="bienvenida"
          value={settings.bienvenida}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
          placeholder="Mensaje de bienvenida"
          disabled={!canMeta}
        />
  
        <textarea
          name="prompt"
          value={settings.prompt}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
          placeholder="Prompt del sistema"
          disabled={!canMeta}
        />
  
        <button
          onClick={handleSave}
          disabled={disabledAll}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 mb-10 ${
            !disabledAll
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-gray-600 text-white/50 cursor-not-allowed"
          }`}

        >
          <Save size={18} /> {saving ? "Guardando..." : "Guardar configuración"}
        </button>
  
        <FaqSection
          faqsSugeridas={faqSugeridas} // ✅ Ahora esto no dará error
          setFaqsSugeridas={setFaqSugeridas}
          faqs={faq}
          setFaqs={setFaq}
          canal="meta"
          membresiaActiva={canMeta}
          onSave={saveFaqs}
        />

        <IntentSection
          intents={intents}
          setIntents={setIntents}
          canal="meta"
          membresiaActiva={canMeta}
          onSave={saveIntents}
        />

        <div
          ref={previewRef}
          className="mt-8 sm:mt-10 bg-[#14142a]/60 backdrop-blur px-3 py-4 sm:p-6 rounded-xl border border-white/20"
        >

        <h3 className="text-lg sm:text-xl font-bold mb-2 text-purple-300 flex items-center gap-2">
          <SiMinutemailer className="animate-pulse" size={20} />
          Vista previa del Asistente
        </h3>

          <div
            ref={chatContainerRef}
            className="bg-[#0f0f25]/60 px-3 py-3 sm:p-4 rounded flex flex-col gap-2 sm:gap-3 mb-4 border border-white/10 h-64 sm:h-72 md:h-80 lg:h-96 overflow-y-auto"
          >

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] sm:max-w-[80%] px-3 py-2 sm:p-3 rounded-lg text-xs sm:text-sm flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-indigo-400/30 self-end text-right"
                    : "bg-green-400/30 self-start text-left"
                }`}
              >

                {msg.role === "assistant"
                  ? renderAssistantContent(msg.content)
                  : (typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content))}
              </div>
            ))}
            {isTyping && (
              <div className="max-w-[85%] sm:max-w-[80%] bg-green-400/20 self-start text-left text-xs sm:text-sm text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg italic animate-pulse">
                El asistente está escribiendo...
              </div>
            )}
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}              
              placeholder="Escribe algo..."
              disabled={!canMeta}
              className="w-full sm:flex-1 border px-3 py-2.5 sm:p-3 rounded bg-white/10 border-white/20 text-white text-sm placeholder-white/50"
            />
            <button
              onClick={handleSend}
              disabled={!canMeta}
              className={`w-full sm:w-auto px-4 py-2.5 rounded text-sm ${
                settings.membresia_activa
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-gray-600 text-white/50 cursor-not-allowed"
              }`}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  ); 
} 
MetaConfigPage.displayName = "MetaConfigPage";