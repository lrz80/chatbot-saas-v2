"use client";

import Footer from '@/components/Footer';
import { useEffect, useRef, useState } from "react";
import TrainingHelp from "@/components/TrainingHelp";
import PromptGenerator from "@/components/PromptGenerator";
import { useRouter } from "next/navigation";
import { Save, } from "lucide-react";
import { BACKEND_URL } from "@/utils/api";
import { SiWhatsapp, SiMinutemailer } from 'react-icons/si';
import { MdWhatsapp } from "react-icons/md";
import FaqSection from "@/components/FaqSection";
import type { FaqSugerida } from "@/components/FaqSection";
import IntentSection, { Intent } from "@/components/IntentSection";
import CTASection from "@/components/CTASection";

const canal = 'whatsapp'; // o 'facebook', 'instagram', 'voz'

export default function TrainingPage() {
  const router = useRouter();
  const bloquearSiNoMembresia = async (
    callback: () => Promise<void> | void
  ): Promise<void> => {
    if (!settings.membresia_activa) {
      router.push("/upgrade");
      return;
    }
    await callback();
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
  
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [usoWhatsapp, setUsoWhatsapp] = useState<any>(null);
  
  const [intents, setIntents] = useState<Intent[]>([]);

  
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
    cta_text: "",
    cta_url: "",
  });

  // Estado para CTA final
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl,  setCtaUrl]  = useState('');

  const isMembershipActive = settings.membresia_activa;
  
  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);
  
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, faqRes, intentsRes, sugeridasRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/settings?canal=whatsapp`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/faqs?canal=whatsapp`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/intents?canal=whatsapp`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/faqs/sugeridas?canal=whatsapp`, { credentials: "include" }),
        ]);
  
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
            cta_text: data.cta_text ?? prev.cta_text,
            cta_url:  data.cta_url  ?? prev.cta_url,
          }));
          setMessages([{ role: "assistant", content: data.bienvenida ?? "¡Hola! ¿Cómo puedo ayudarte?" }]);
        }
  
        if (faqRes.ok) setFaq(await faqRes.json());
        if (intentsRes.ok) {
          const arr = await intentsRes.json();
          const parsed: Intent[] = Array.isArray(arr)
            ? arr.map((x:any) => ({
                nombre: x?.nombre ?? "",
                ejemplos: Array.isArray(x?.ejemplos) ? x.ejemplos : [],
                respuesta: x?.respuesta ?? "",
              }))
            : [];
          setIntents(parsed);
        }

        if (sugeridasRes.ok) setFaqSugeridas(await sugeridasRes.json());
  
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
    if (!isMembershipActive) return;
    setSaving(true);
  
    // 1) Construye base con posibles campos
    const base = {
      nombre_negocio: settings.name,
      categoria: settings.categoria,
      idioma: settings.idioma,
      prompt: settings.prompt?.trim(),
      bienvenida: settings.bienvenida?.trim(),
      informacion_negocio: settings.informacion_negocio?.trim(),
      funciones_asistente: settings.funciones_asistente?.trim(),
      info_clave: (settings.info_clave ?? '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{2,}/g, '\n')
        .trim(),
      cta_text: settings.cta_text?.trim(),
      cta_url:  settings.cta_url?.trim(),
    };
  
    // 2) Filtra claves vacías/indefinidas (no pisar con '')
    const payload: Record<string, any> = {};
    Object.entries(base).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        payload[k] = v;
      }
    });
  
    console.log("📤 Enviando payload a /api/settings (PATCH):", payload);
  
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings`, {
        method: "PATCH",                
        credentials: "include",
        cache: "no-store",               // opcional, previene stales
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json().catch(() => ({}));
      console.log("✅ Respuesta del servidor:", data);
  
      if (!res.ok) {
        alert("❌ Error al guardar: " + (data?.error || "Error desconocido"));
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
    if (!isMembershipActive || !input.trim()) return;
    await sendPreview(input.trim());
  };  

  // 👉 Cuando el usuario hace clic en una opción de flujo
  const handleFlowOptionClick = async (texto: string) => {
    if (!isMembershipActive) return;
    await sendPreview(texto);
  };

  const saveIntents = async () => {
    if (!isMembershipActive) return;
  
    // normaliza y valida
    const intencionesLimpias = intents
      .map(i => ({
        nombre: (i.nombre || '').trim(),
        ejemplos: (i.ejemplos || []).map(e => (e || '').trim()).filter(Boolean),
        respuesta: (i.respuesta || '').trim(),
      }))
      .filter(i => i.nombre && i.ejemplos.length > 0 && i.respuesta);
  
    if (!intencionesLimpias.length) {
      return alert("❌ Agrega al menos una intención válida.");
    }
  
    try {
      const res = await fetch(`${BACKEND_URL}/api/intents?canal=${canal}`, { // ⬅️ canal
        method: "POST",
        credentials: "include",
        cache: "no-store",                        // opcional: evita stales
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intents: intencionesLimpias }),
      });
  
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return alert(`❌ Error al guardar intenciones: ${json?.error || res.statusText}`);
      }
  
      alert("Intenciones guardadas ✅");
      // 🔄 Recarga la lista desde el backend para reflejar cambios
      try {
        const r2 = await fetch(`${BACKEND_URL}/api/intents?canal=${canal}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (r2.ok) {
          const arr2 = await r2.json();
          const parsed2: Intent[] = Array.isArray(arr2)
            ? arr2.map((x:any) => ({
                nombre: x?.nombre ?? "",
                ejemplos: Array.isArray(x?.ejemplos) ? x.ejemplos : [],
                respuesta: x?.respuesta ?? "",
              }))
            : [];
          setIntents(parsed2);
        }
      } catch {}
    } catch (e) {
      console.error("❌ Error guardando intenciones:", e);
      alert("❌ Error guardando intenciones.");
    }
  };  
  
  
  const saveFaqs = async () => {
    if (!settings.membresia_activa) return;
  
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
        cache: "no-store",
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
  
  // 🔁 Envío reutilizable para preview (WhatsApp)
  const sendPreview = async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsTyping(true);
    setInput("");
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);

    try {
      // ⬇️ Nuevo endpoint específico de WhatsApp
      const res = await fetch(`${BACKEND_URL}/api/preview/whatsapp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const resp = data?.response;

      // Si es estructura de flujo (objeto), la guardamos tal cual para renderizar botones
      if (resp && typeof resp === "object") {
        setMessages((prev) => [...prev, { role: "assistant", content: resp }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: String(resp ?? "...") },
        ]);
      }
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
          redirectPath: "/dashboard/training",  // Puedes ajustar si necesitas otro path
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
      setUsoWhatsapp(data.usos.find((u: any) => u.canal === "whatsapp"));
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
  
  // 🧩 Renderiza contenido del asistente: string o estructura de flujo
  const renderAssistantContent = (content: AssistantStructured) => {
    if (typeof content === "string") return <>{content}</>;

    const texto = content?.text ?? content?.mensaje ?? "";
    const opciones = Array.isArray(content?.opciones) ? content.opciones : [];

    return (
      <div className="flex flex-col gap-2">
        {texto && <div>{texto}</div>}
        {!!opciones.length && (
          <div className="flex flex-wrap gap-2 mt-1">
            {opciones.map((op, idx) => (
              <button
                key={idx}
                onClick={() => handleFlowOptionClick(op.texto)}
                className="px-3 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs"
              >
                {op.texto}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <p className="text-center">Cargando configuración...</p>;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] text-white px-4 py-6 sm:px-6 md:px-8">
      <div className="w-full max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md px-4 py-6 sm:p-8">
  
        {!settings.membresia_activa && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-center font-medium">
            ⚠ Tu membresía está inactiva. No puedes guardar cambios ni entrenar el asistente.
          </div>
        )}
  
        <h1 className="text-3xl md:text-4xl font-extrabold text-center flex justify-center items-center gap-2 mb-8 text-purple-300">
          <SiWhatsapp size={36} className="text-green-400 animate-pulse" />
          Configuración del Asistente de WhatsApp
        </h1>
  
        <TrainingHelp context="training" />

        {usoWhatsapp && (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <MdWhatsapp /> Uso de WhatsApp
            </h3>
            <p className="text-white text-sm mb-2">
              {usoWhatsapp.usados ?? 0} de {usoWhatsapp.limite} mensajes enviados (incluye créditos extra)
            </p>
            {usoWhatsapp.limite > 500 && (
              <p className="text-green-300 text-sm">
                Incluye {usoWhatsapp.limite - 500} mensajes extra comprados.
              </p>
            )}
            <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
              <div
                className={`h-full ${colorBarra(calcularPorcentaje(usoWhatsapp.usados, usoWhatsapp.limite))} transition-all duration-500`}
                style={{ width: `${calcularPorcentaje(usoWhatsapp.usados, usoWhatsapp.limite)}%` }}
              />
            </div>
            <div className="flex gap-2">
              {[500, 1000, 2000].map((extra) => (
                <button
                  key={extra}
                  onClick={() => comprarMas("whatsapp", extra)}
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
          disabled={!settings.membresia_activa}
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
          membresiaActiva={settings.membresia_activa}
          onPromptGenerated={(prompt) => setSettings((prev) => ({ ...prev, prompt }))}
        />
  
        <input
          name="bienvenida"
          value={settings.bienvenida}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
          placeholder="Mensaje de bienvenida"
          disabled={!settings.membresia_activa}
        />
  
        <textarea
          name="prompt"
          value={settings.prompt}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
          placeholder="Prompt del sistema"
          disabled={!settings.membresia_activa}
        />
  
        <CTASection canal={canal} membresiaActiva={settings.membresia_activa} />

        <button
          onClick={() => bloquearSiNoMembresia(handleSave)}
          disabled={!settings.membresia_activa}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 mb-10 ${
            settings.membresia_activa
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-gray-600 text-white/50 cursor-not-allowed"
          }`}
        >
          <Save size={18} /> {saving ? "Guardando..." : "Guardar configuración"}
        </button>
  
        <FaqSection
          faqsSugeridas={faqSugeridas}
          setFaqsSugeridas={setFaqSugeridas}
          faqs={faq}
          setFaqs={setFaq}
          canal="whatsapp"
          membresiaActiva={settings.membresia_activa}
          onSave={() => bloquearSiNoMembresia(saveFaqs)}
        />

        <IntentSection
          intents={intents}
          setIntents={setIntents}
          canal={canal}
          membresiaActiva={settings.membresia_activa}
          onSave={() => bloquearSiNoMembresia(saveIntents)}
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
              disabled={!settings.membresia_activa}
              className="w-full sm:flex-1 border p-3 rounded bg-white/10 border-white/20 text-white placeholder-white/50"
            />
            <button
              onClick={() => bloquearSiNoMembresia(handleSend)}
              disabled={!settings.membresia_activa}
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
      </div>
      <Footer />
    </div>
  ); 
} 