"use client";

import { useEffect, useState } from "react";
import TrainingHelp from "@/components/TrainingHelp";
import { getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";
import {
  MessageSquareText,
  Sparkles,
  Flame,
  NotebookText,
  BotMessageSquare,
  MessageCircleReply,
  RefreshCcw,
  PlusCircle,
  Save,
  Settings,
  Info,
} from "lucide-react";



export default function TrainingPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intents, setIntents] = useState<{ nombre: string; ejemplos: string[]; respuesta: string }[]>([]);
  const [faq, setFaq] = useState<{ pregunta: string; respuesta: string }[]>([]);
  const [settings, setSettings] = useState({
    name: "",
    categoria: "",
    prompt: "Eres un asistente útil.",
    bienvenida: "¡Hola! ¿En qué puedo ayudarte hoy?",
    membresia_activa: true,
    informacion_negocio: "",
    idioma: "es",
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        console.log("✅ Usuario logueado:", user.email);
        const res = await fetch("/api/settings");

        if (!res.ok) return;
        const data = await res.json();
        console.log("📦 Respuesta API settings:", data);

        if (user) {
          const usageRes = await fetch("/api/usage");
          const usageData = await usageRes.json();
          setUsage(usageData);

        }
        
        setSettings({
          name: data.name || "",
          categoria: data.categoria || "",
          prompt: data.prompt || "Eres un asistente útil.",
          bienvenida: data.bienvenida || "¡Hola! ¿En qué puedo ayudarte hoy?",
          membresia_activa: data.membresia_activa,
          informacion_negocio: data.informacion_negocio || "",
          idioma: data.idioma || "es",
        });

        const faqRes = await fetch("/api/faq");
        if (faqRes.ok) {
          const faqData = await faqRes.json();
          setFaq(faqData);
        }

        const intentsRes = await fetch("/api/intents");
        if (intentsRes.ok) {
          const intentData = await intentsRes.json();
          setIntents(intentData);
        }

        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleChange = (e: any) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!settings.membresia_activa) {
      alert("Tu membresía no está activa.");
      return;
    }
    
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
    
    setSaving(false);
    alert("Configuración del bot guardada ✅");
  };

  const [usage, setUsage] = useState<{ used: number; limit: number | null; porcentaje: number }>({
    used: 0,
    limit: null,
    porcentaje: 0,
  });
  
  const handleFaqChange = (index: number, field: string, value: string) => {
    const newFaq = [...faq];
    newFaq[index][field] = value;
    setFaq(newFaq);
  };

  const addFaq = () => {
    setFaq([...faq, { pregunta: "", respuesta: "" }]);
  };

  const saveFaq = async () => {
    if (!settings.membresia_activa) {
      alert("Tu membresía no está activa para guardar FAQs.");
      return;
    }
    
    await fetch("/api/faq", {
      method: "POST",
      body: JSON.stringify({ faqs: faq }),
    });
    
    alert("Preguntas frecuentes guardadas ✅");
  };
  const handleSend = async () => {
    if (!settings.membresia_activa) {
      alert("Debes activar tu membresía para usar el chatbot.");
      return;
    }    
    
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setLoading(true);
    setInput("");
  
    const res = await fetch("/api/preview", {
      method: "POST",
      body: JSON.stringify({ message: input }),
    });
    
  
    const data = await res.json();
    console.log("Respuesta del bot:", data);
  
    if (data.response) {
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    }
  
    setLoading(false);
  };  
  
  const handleIntentChange = (index: number, field: string, value: any) => {
    const updated = [...intents];
    if (field === "ejemplos") {
      updated[index][field] = value.split("\n");
    } else {
      updated[index][field] = value;
    }
    setIntents(updated);
  };
  
  const addIntent = () => {
    setIntents([...intents, { nombre: "", ejemplos: [], respuesta: "" }]);
  };
  
  const saveIntents = async () => {
    if (!settings.membresia_activa) {
      alert("Tu membresía no está activa para guardar intenciones.");
      return;
    }
    
    await fetch("/api/intents", {
      method: "POST",
      body: JSON.stringify({ intents }),
    });
    
    alert("Intenciones guardadas ✅");
  };
  
  const handleRegenerate = async () => {
    if (!settings.membresia_activa) {
      alert("Tu membresía no está activa para regenerar respuestas.");
      return;
    }
    
    const lastUserMsg = messages
      .slice()
      .reverse()
      .find((msg) => msg.role === "user");
  
    if (!lastUserMsg) return;
  
    setLoading(true);
  
    const res = await fetch("/chatbot", {
      method: "POST",
      body: JSON.stringify({ mensaje: lastUserMsg.content }),
    });
    
    const data = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", content: data.respuesta }]);
    setLoading(false);
  };
  
  if (loading) return <p className="text-center">Cargando configuración...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] text-white p-6">
      <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
  
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Settings className="text-indigo-400" size={32} />
        Configuración del Asistente AI
      </h2>

      <TrainingHelp context="training" />

      {!settings.membresia_activa && (
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-400 text-yellow-200 rounded-lg text-center font-medium">
          🚫 Tu membresía está inactiva. Puedes ver tu asistente pero necesitas <a href="/dashboard/profile?upgrade=1" className="underline">activar tu membresía</a> para usar o editarlo.
        </div>
      )}
        <label className="block font-medium mb-1">Nombre del Negocio</label>
        <input
          name="name"
          value={settings.name}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white placeholder-gray-300"
        />
  
        <label className="block font-medium mb-1 flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-300" />
          Categoría del Negocio
        </label>

        <select
          name="categoria"
          value={settings.categoria}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
        >
          <option value="">Selecciona una categoría</option>
          <option value="spa">Spa</option>
          <option value="barberia">Barbería</option>
          <option value="clinica">Clínica estética</option>
          <option value="restaurante">Restaurante</option>
          <option value="fitness">Fitness</option>
          <option value="petgrooming">Pet Grooming</option>
          <option value="otra">Otra</option>
        </select>
  
        <label className="block font-medium mb-1 flex items-center gap-2">
          🌐 Idioma del asistente
        </label>
        <select
          name="idioma"
          value={settings.idioma}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
        >
          <option value="es">Español</option>
          <option value="en">Inglés</option>
          <option value="pt">Portugués</option>
          <option value="fr">Francés</option>
        </select>

        {/* Generador automático de prompt con OpenAI */}
        {/* 
        <PromptGenerator
          informacion={settings.informacion_negocio}
          idioma={settings.idioma}
          membresiaActiva={settings.membresia_activa}
          onPromptGenerated={(prompt) =>
            setSettings((prev) => ({ ...prev, prompt }))
          }
        />   
        */}

        <label className="block font-medium mb-1 flex items-center gap-2">
          <BotMessageSquare size={18} />
          Prompt del sistema
        </label>

        <textarea
          name="prompt"
          value={settings.prompt}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
        />
  
        <label className="block font-medium mb-1 flex items-center gap-2">
          <Flame size={18} className="text-orange-400" />
          Mensaje de bienvenida
        </label>

        <input
          name="bienvenida"
          value={settings.bienvenida}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
        />
  
        <label className="block font-medium mb-1 mt-6 flex items-center gap-2">
          <Info size={18} className="text-teal-300" />
          Información del negocio (precios, links, ubicación, etc.)
        </label>
        <textarea
          name="informacion_negocio"
          value={settings.informacion_negocio}
          onChange={handleChange}
          rows={5}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white placeholder-white/50"
          placeholder={`Ej: Servicios:\n- Corte de cabello: $10\n- Cita previa: https://miweb.com/reservar\n- Ubicación: Calle 123, Ciudad`}
        ></textarea>

        <button
          onClick={handleSave}
          disabled={!settings.membresia_activa}
          className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 ${
            settings.membresia_activa
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-gray-600 text-white/50 cursor-not-allowed"
          }`}
        >
          <Save size={16} />
          {saving ? "Guardando..." : "Guardar Configuración"}
        </button>

        <hr className="my-10 border-white/20" />
  
        <h3 className="text-2xl font-bold mb-4 text-green-400 flex items-center gap-2">
          <NotebookText className="text-green-400" /> Preguntas Frecuentes
        </h3>

        {faq.map((item, index) => (
          <div key={index} className="mb-4">
            <input
              type="text"
              placeholder="Pregunta"
              value={item.pregunta}
              onChange={(e) => handleFaqChange(index, "pregunta", e.target.value)}
              className="w-full p-2 border rounded mb-2 bg-white/10 border-white/20 text-white"
            />
            <textarea
              placeholder="Respuesta"
              value={item.respuesta}
              onChange={(e) => handleFaqChange(index, "respuesta", e.target.value)}
              className="w-full p-2 border rounded bg-white/10 border-white/20 text-white"
              rows={2}
            />
          </div>
        ))}
  
        <div className="flex gap-2 mt-2">
          <button
            onClick={addFaq}
            className="bg-white/10 text-white px-4 py-2 rounded hover:bg-white/20"
          >
            ➕ Agregar pregunta
          </button>
  
          <button
            onClick={saveFaq}
            disabled={!settings.membresia_activa}
            className={`px-4 py-2 rounded ${
              settings.membresia_activa
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-600 text-white/50 cursor-not-allowed"
            }`}
          >
            Guardar Preguntas
          </button>

        </div>
  
        <hr className="my-10 border-white/20" />
        <h3 className="text-2xl font-bold mb-1 text-blue-400 flex items-center gap-2">
          <BotMessageSquare className="text-blue-400" /> Entrenamiento por Intención
        </h3>

        <p className="text-sm text-white/70 mb-4">
          Define intenciones específicas para que el asistente pueda reconocer patrones en los mensajes del usuario y responder con mayor precisión. 
          Cada intención incluye ejemplos de frases que los clientes podrían usar, junto con la respuesta que debería dar el asistente.
          <br /><br />
          <strong>Ejemplo:</strong><br />
          <em>Intención:</em> Reservar clase<br />
          <em>Ejemplos:</em> “Quiero agendar una clase”, “¿Puedo reservar para mañana?”, “Necesito una clase el lunes”<br />
          <em>Respuesta:</em> “¡Claro! ¿Qué día y hora prefieres para tu clase?”
        </p>

        {intents.map((item, i) => (
          <div key={i} className="mb-6 bg-white/10 border border-white/20 p-4 rounded-lg">
            <label className="block text-sm font-semibold mb-1">🎯 Intención</label>
            <input
              type="text"
              className="w-full p-2 border rounded mb-2 bg-white/10 border-white/20 text-white"
              value={item.nombre}
              onChange={(e) => handleIntentChange(i, "nombre", e.target.value)}
            />
  
            <label className="block text-sm font-semibold mb-1">✍️ Frases de ejemplo (una por línea)</label>
            <textarea
              className="w-full p-2 border rounded mb-2 bg-white/10 border-white/20 text-white"
              value={item.ejemplos.join("\n")}
              onChange={(e) => handleIntentChange(i, "ejemplos", e.target.value)}
              rows={3}
            />
  
            <label className="block text-sm font-semibold mb-1">💬 Respuesta del Asistente</label>
            <textarea
              className="w-full p-2 border rounded bg-white/10 border-white/20 text-white"
              value={item.respuesta}
              onChange={(e) => handleIntentChange(i, "respuesta", e.target.value)}
              rows={2}
            />
          </div>
        ))}
  
        <div className="flex gap-2 mt-2">
          <button
            onClick={saveIntents}
            disabled={!settings.membresia_activa}
            className={`px-4 py-2 rounded ${
              settings.membresia_activa
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-600 text-white/50 cursor-not-allowed"
            }`}
          >
            Guardar Intenciones
          </button>

        </div>
  
        <div className="mt-10 bg-white/10 backdrop-blur p-6 rounded-xl border border-white/20">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <MessageSquareText /> Vista previa del Asistente
        </h3>
          <p className="text-sm text-white/70 mb-4">
            Prueba cómo responde el asistente según el prompt y bienvenida configurados arriba.
          </p>
  
          <div className="bg-white/5 p-4 rounded h-80 overflow-y-auto flex flex-col gap-3 mb-4 border border-white/10">
            {messages.length === 0 && <p className="text-white/50 text-sm">Escribe un mensaje para iniciar la prueba.</p>}
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
            {loading && <p className="text-white/50 text-sm">⏳ Generando respuesta...</p>}
          </div>
  
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe algo..."
              className="flex-1 border p-3 rounded bg-white/10 border-white/20 text-white placeholder-white/50"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
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

            <button
              onClick={handleRegenerate}
              disabled={!settings.membresia_activa || loading || messages.length === 0}
              className={`px-4 py-2 rounded ${
                settings.membresia_activa
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-gray-600 text-white/50 cursor-not-allowed"
              }`}
            >
              🔁
            </button>
          </div>
        </div>
  
      </div>
    </div>
  );
  }
