"use client";

import { useEffect, useRef, useState } from "react";
import TrainingHelp from "@/components/TrainingHelp";
import PromptGenerator from "@/components/PromptGenerator";
import { useRouter } from "next/navigation";
import {
  MessageSquareText,
  NotebookText,
  BotMessageSquare,
  Save,
  Settings,
} from "lucide-react";
import { BACKEND_URL } from "@/utils/api";

type FlowOption = {
  texto: string;
  respuesta?: string;
  submenu?: {
    mensaje: string;
    opciones: FlowOption[];
  };
};

type Flow = {
  mensaje: string;
  opciones: FlowOption[];
};

export default function TrainingPage() {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faq, setFaq] = useState<{ pregunta: string; respuesta: string }[]>([]);
  const [intents, setIntents] = useState<{ nombre: string; ejemplos: string[]; respuesta: string }[]>([]);
  const [usage, setUsage] = useState({ used: 0, limit: null, porcentaje: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const chatDiv = chatContainerRef.current;
    if (chatDiv) {
      chatDiv.scrollTop = chatDiv.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, usageRes, faqRes, intentsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/settings`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/usage`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/faq`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/intents`, { credentials: "include" }),
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
          }));
          setMessages([{ role: "assistant", content: data.bienvenida || "¡Hola! ¿Cómo puedo ayudarte?" }]);
        }

        if (usageRes.ok) setUsage(await usageRes.json());
        if (faqRes.ok) setFaq(await faqRes.json());
        if (intentsRes.ok) setIntents(await intentsRes.json());
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

    const payload = {
      nombre_negocio: settings.name,
      categoria: settings.categoria,
      idioma: settings.idioma,
      prompt: settings.prompt,
      bienvenida: settings.bienvenida,
      informacion_negocio: settings.informacion_negocio,
      funciones_asistente: settings.funciones_asistente?.trim() || undefined,
      info_clave: settings.info_clave?.trim() || undefined,
    };    

    console.log("📤 Enviando payload a /api/settings:", payload);

    try {
      const res = await fetch(`${BACKEND_URL}/api/settings`, {
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
    if (!isMembershipActive || !input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);

    const res = await fetch(`${BACKEND_URL}/api/preview`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", content: data.response || "..." }]);
    setIsTyping(false);

    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  const handleRegenerate = async () => {
    if (!isMembershipActive) return;
    const lastUserMsg = messages.slice().reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    setLoading(true);
    const res = await fetch(`${BACKEND_URL}/chatbot`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje: lastUserMsg.content }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", content: data.respuesta }]);
    setLoading(false);

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleFaqChange = (index: number, field: string, value: string) => {
    const newFaq = [...faq];
    newFaq[index][field] = value;
    setFaq(newFaq);
  };

  const addFaq = () => setFaq([...faq, { pregunta: "", respuesta: "" }]);

  const saveFaq = async () => {
    if (!isMembershipActive) return;
    await fetch(`${BACKEND_URL}/api/faq`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faqs: faq }),
    });
    alert("Preguntas frecuentes guardadas ✅");
  };

  const handleIntentChange = (i: number, field: string, value: string) => {
    const updated = [...intents];
    updated[i][field] = field === "ejemplos" ? value.split("\n").filter(Boolean) : value;
    setIntents(updated);
  };
  
  const addIntent = () =>
    setIntents([...intents, { nombre: "", ejemplos: [], respuesta: "" }]);
  
  const saveIntents = async () => {
    if (!isMembershipActive) return;
  
    const sanitizedIntents = intents.map((intent) => ({
      ...intent,
      ejemplos: Array.isArray(intent.ejemplos)
        ? intent.ejemplos
        : [intent.ejemplos].filter(Boolean),
    }));
  
    await fetch(`${BACKEND_URL}/api/intents`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intents: sanitizedIntents }),
    });
  
    alert("Intenciones guardadas ✅");
  };
  
  const [flows, setFlows] = useState<Flow[]>([
    {
      mensaje: "¿Qué deseas hacer?",
      opciones: [
        {
          texto: "Reservar",
          submenu: {
            mensaje: "¿Qué deseas reservar?",
            opciones: [
              { texto: "Facial", respuesta: "Agenda tu facial aquí: [link]" },
              { texto: "Masaje", respuesta: "Perfecto, masaje disponible aquí: [link]" },
            ],
          },
        },
        {
          texto: "Ver precios",
          respuesta: "Nuestros precios están en este link: [link]",
        },
      ],
    },
  ]);  
  
  const handleFlowChange = (
    nivel: number,
    key: keyof FlowOption | keyof Flow,
    value: any,
    path: number[] = []
  ) => {
  
    const copy = JSON.parse(JSON.stringify(flows));
    let ref = copy;
    path.forEach((i) => ref = (ref[i].submenu?.opciones ?? ref[i].opciones) as FlowOption[]);
    (ref[nivel] as any)[key] = value;
    setFlows(copy);
  };
  
  const addOpcion = (nivel: number = 0, path: number[] = []) => {
    const copy = JSON.parse(JSON.stringify(flows));
    let ref = copy;
    path.forEach((i) => ref = (ref[i].submenu?.opciones ?? ref[i].opciones) as FlowOption[]);
    ref[nivel].opciones.push({ texto: "", respuesta: "" });
    setFlows(copy);
  };
  
  const saveFlows = async () => {
    if (!settings.membresia_activa) return;
    await fetch(`${BACKEND_URL}/api/flows`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flows }),
    });
    alert("Flujos guardados ✅");
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
  
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3">
          <Settings className="text-indigo-400" size={28} />
          Configuración del Asistente AI
        </h2>
  
        {usage.porcentaje >= 80 && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-center font-medium text-sm">
            ⚠ Estás utilizando el <strong>{usage.porcentaje}%</strong> de tu límite mensual ({usage.used}/{usage.limit} mensajes).<br />Considera actualizar tu plan para evitar interrupciones.
          </div>
        )}
  
        <TrainingHelp context="training" />
  
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
          <option value="pt">Portugués</option>
          <option value="fr">Francés</option>
        </select>
  
        <PromptGenerator
          infoClave={settings.info_clave}
          funcionesAsistente={settings.funciones_asistente}
          setInfoClave={(value) => setSettings((prev) => ({ ...prev, info_clave: value }))}
          setFuncionesAsistente={(value) => setSettings((prev) => ({ ...prev, funciones_asistente: value }))}
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
  
        <button
          onClick={handleSave}
          disabled={!settings.membresia_activa}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 mb-10 ${
            settings.membresia_activa
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-gray-600 text-white/50 cursor-not-allowed"
          }`}
        >
          <Save size={18} /> {saving ? "Guardando..." : "Guardar configuración"}
        </button>
  
        {/* Omitido: Preguntas Frecuentes, Intenciones y Flujos para ahorrar espacio */}
  
        {/* Vista previa */}
        <div ref={previewRef} className="mt-10 bg-white/10 backdrop-blur p-6 rounded-xl border border-white/20">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <MessageSquareText /> Vista previa del Asistente
          </h3>
          <div
            ref={chatContainerRef}
            className="bg-white/5 p-4 rounded max-h-[50vh] sm:h-80 overflow-y-auto flex flex-col gap-3 mb-4 border border-white/10"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.role === "user"
                    ? "bg-indigo-400/30 self-end text-right"
                    : "bg-green-400/30 self-start text-left"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className="max-w-[80%] bg-green-400/20 self-start text-left text-sm text-white px-4 py-2 rounded-lg italic animate-pulse">
                El asistente está escribiendo...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
  
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe algo..."
              disabled={!settings.membresia_activa}
              className="flex-1 border p-3 rounded bg-white/10 border-white/20 text-white placeholder-white/50"
            />
            <button
              onClick={handleSend}
              disabled={!settings.membresia_activa}
              className={`px-4 py-2 rounded ${
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
    </div>
  );
}  