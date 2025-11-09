"use client";

import Footer from '@/components/Footer';
import { useEffect, useRef, useState } from "react";
import TrainingHelp from "@/components/TrainingHelp";
import PromptGenerator from "@/components/PromptGenerator";
import { useRouter } from "next/navigation";
import { Save, } from "lucide-react";
import { BACKEND_URL } from "@/utils/api";
import { SiMeta, SiOpenai, SiMinutemailer, SiChatbot, SiTarget, SiPaperspace } from 'react-icons/si';
import FaqSection from "@/components/FaqSection";
import type { FaqSugerida } from "@/components/FaqSection";
import IntentSection, { Intent } from "@/components/IntentSection";
import { useFeatures } from '@/hooks/usePlan';
import ChannelStatus from "@/components/ChannelStatus";
import ChannelGate from "@/components/ChannelGate";

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

  const canMetaConnect = !!features.meta; // ← habilitado por plan+membresía
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
    membresia_activa: true,
    informacion_negocio: "",
    funciones_asistente: "",
    info_clave: "",
    idioma: "es",
  });

  const isMembershipActive = settings.membresia_activa;
  const planMeta = !!features?.meta;
  const canMeta = planMeta && isMembershipActive; // el gate maneja mantenimiento/pausas
  const disabledAll = !canMeta;

  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);
  
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, faqRes, intentsRes, sugeridasRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/settings?canal=meta`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/faqs?canal=meta`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/intents?canal=meta`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/faqs/sugeridas?canal=meta`, { credentials: "include" }),
        ]);    
  
        console.log("🔥 llamé /api/faqs/sugeridas?canal=meta:", sugeridasRes.status);
        
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings((prev) => ({
            ...prev,
            name: data.name || prev.name,
            categoria: data.categoria || prev.categoria,
            prompt: data.prompt || prev.prompt,
            bienvenida: data.bienvenida || prev.bienvenida,
            informacion_negocio: data.informacion_negocio || prev.informacion_negocio,
            funciones_asistente: data.funciones_asistente || prev.funciones_asistente,
            info_clave: data.info_clave || prev.info_clave,
            membresia_activa: data.membresia_activa,
            idioma: data.idioma || prev.idioma,
          }));
          setMessages([{ role: "assistant", content: data.bienvenida != null ? data.bienvenida : "¡Hola! ¿Cómo puedo ayudarte?" }]);
          setUsos(data.limites || {});  // 🚀 Ahora guardamos límites completos por canal
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
              respuesta_sugerida: String(x?.respuesta_sugerida ?? "").trim(), // 👈 nombre correcto
              canal: x?.canal ?? "meta",
            }))
            .filter(f => f.pregunta && f.respuesta_sugerida); // 👈 filtra con ese nombre

          console.log("✅ faqs sugeridas meta:", limpias);
          setFaqSugeridas(limpias);
        } else {
          console.warn("⚠️ /api/faqs/sugeridas status:", sugeridasRes.status);
          setFaqSugeridas([]);
        }

        // 👇 NUEVO: lee estado de conexión de Meta
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
          // En error, deja visible el botón Conectar
          setMetaConn((prev) => ({ ...prev, connected: false, needsReconnect: true }));
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

    const payload = {
      nombre_negocio: settings.name,
      categoria: settings.categoria,
      idioma: settings.idioma,
      prompt: settings.prompt,
      bienvenida: settings.bienvenida,
      informacion_negocio: settings.informacion_negocio,
      funciones_asistente: settings.funciones_asistente?.trim() || undefined,
      info_clave: (settings.info_clave ?? '').replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').trim(),
    };    

    console.log("📤 Enviando payload a /api/settings:", payload);

    try {
      const res = await fetch(`${BACKEND_URL}/api/settings?canal=meta`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("✅ Respuesta del servidor:", data);

      if (!res.ok) {
        alert("❌ Error al guardar: " + data?.error || "Error desconocido");
      } else {
        alert("Configuración del bot guardada ✅");
      }
    } catch (err) {
      console.error("❌ Error en handleSave:", err);
      alert("Error al guardar la configuración.");
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
  
        <h1 className="text-3xl md:text-4xl font-extrabold text-center flex justify-center items-center gap-2 mb-8 text-purple-300">
          <SiMeta size={36} className="text-green-400 animate-pulse" />
          Configuración del Asistente de Facebook e Instagram
        </h1>

        <ChannelStatus canal="meta" showBanner hideTitle />

        {usage.porcentaje >= 80 && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-center font-medium text-sm">
            ⚠ Estás utilizando el <strong>{usage.porcentaje}%</strong> de tu límite mensual ({usage.used}/{usage.limit} mensajes).<br />Considera actualizar tu plan para evitar interrupciones.
          </div>
        )}
  
        <TrainingHelp context="meta" />

        <ChannelGate canal="meta">
        {/* 🔗 Integración con Meta: botones SIEMPRE visibles */}
        <div className="mb-6 p-4 rounded-lg border text-sm bg-white/5 border-white/10 text-white">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

              <div className="flex flex-wrap gap-2">
                {/* ÚNICO botón para FB/IG */}
                <button
                  onClick={goConnectMeta}
                  disabled={disabledAll}
                  aria-disabled={disabledAll}
                  className={`px-4 py-2 rounded text-white ${
                    !disabledAll
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
                  }`}
                  title={!disabledAll ? "" : "Bloqueado por plan/membresía o canal"}
                >
                  {metaConn.connected ? "Reconectar Facebook/Instagram" : "Conectar Facebook/Instagram"}
                </button>

                <button
                  onClick={handleDisconnect}
                  disabled={disabledAll || (!metaConn.connected && !metaConn.fb && !metaConn.ig)}
                  aria-disabled={disabledAll || (!metaConn.connected && !metaConn.fb && !metaConn.ig)}
                  className={`px-4 py-2 rounded border ${
                    canMetaConnect && (metaConn.connected || metaConn.fb || metaConn.ig)
                      ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                      : "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                  }`}
                  title={!disabledAll ? "" : "Bloqueado por plan/membresía o canal"}
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

        {usoMeta && (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <SiMeta /> Uso de Facebook / Instagram
            </h3>
            <p className="text-white text-sm mb-2">
              {usoMeta.usados ?? 0} de {usoMeta.limite} mensajes enviados (incluye créditos extra)
            </p>
            {usoMeta.limite > 500 && (
              <p className="text-green-300 text-sm">
                Incluye {usoMeta.limite - 500} mensajes extra comprados.
              </p>
            )}
            <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
              <div
                className={`h-full ${colorBarra(calcularPorcentaje(usoMeta.usados, usoMeta.limite))} transition-all duration-500`}
                style={{ width: `${calcularPorcentaje(usoMeta.usados, usoMeta.limite)}%` }}
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
          <option value="pt">Portugués</option>
          <option value="fr">Francés</option>
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

        <div ref={previewRef} className="mt-10 bg-[#14142a]/60 backdrop-blur p-6 rounded-xl border border-white/20">
        <h3 className="text-xl font-bold mb-2 text-purple-300 flex items-center gap-2">
          <SiMinutemailer className="animate-pulse" size={24} />
          Vista previa del Asistente
        </h3>

          <div
            ref={chatContainerRef}
            style={{ height: '400px', overflowY: 'auto' }} // ✅ Altura fija
            className="bg-[#0f0f25]/60 p-4 rounded flex flex-col gap-3 mb-4 border border-white/10"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] p-3 rounded-lg text-sm flex-shrink-0 ${
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
              <div className="max-w-[80%] bg-green-400/20 self-start text-left text-sm text-white px-4 py-2 rounded-lg italic animate-pulse">
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
              className="w-full sm:flex-1 border p-3 rounded bg-white/10 border-white/20 text-white placeholder-white/50"
            />
            <button
              onClick={handleSend}
              disabled={!canMeta}
              className={`w-full sm:w-auto px-4 py-2 rounded ${
                settings.membresia_activa
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-gray-600 text-white/50 cursor-not-allowed"
              }`}
            >
              Enviar
            </button>
          </div>
        </div>
        </ChannelGate>
      </div>
      <Footer />
    </div>
  ); 
} 
MetaConfigPage.displayName = "MetaConfigPage";