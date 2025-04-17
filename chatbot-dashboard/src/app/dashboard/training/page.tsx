"use client";

import { useEffect, useState } from "react";
import TrainingHelp from "@/components/TrainingHelp";
import PromptGenerator from "@/components/PromptGenerator";
import { useRouter } from "next/navigation";
import {
  MessageSquareText,
  Sparkles,
  Flame,
  NotebookText,
  BotMessageSquare,
  Info,
  Save,
  Settings,
} from "lucide-react";
import { BACKEND_URL } from "@/utils/api";

export default function TrainingPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faq, setFaq] = useState<{ pregunta: string; respuesta: string }[]>([]);
  const [intents, setIntents] = useState<{ nombre: string; ejemplos: string[]; respuesta: string }[]>([]);
  const [usage, setUsage] = useState({ used: 0, limit: null, porcentaje: 0 });

  const [settings, setSettings] = useState({
    name: "",
    categoria: "",
    prompt: "Eres un asistente útil.",
    bienvenida: "¡Hola! ¿En qué puedo ayudarte hoy?",
    membresia_activa: true,
    informacion_negocio: "",
    idioma: "es",
  });

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
          setSettings({
            name: data.name || "",
            categoria: data.categoria || "",
            prompt: data.prompt || "Eres un asistente útil.",
            bienvenida: data.bienvenida || "¡Hola! ¿En qué puedo ayudarte hoy?",
            membresia_activa: data.membresia_activa,
            informacion_negocio: data.informacion_negocio || "",
            idioma: data.idioma || "es",
          });
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
    setSaving(true);
    await fetch(`${BACKEND_URL}/api/settings`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    alert("Configuración del bot guardada ✅");
  };

  const handleSend = async () => {
    if (!settings.membresia_activa || !input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    setLoading(true);
    const res = await fetch(`${BACKEND_URL}/api/preview`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", content: data.response || "..." }]);
    setLoading(false);
  };

  const handleRegenerate = async () => {
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
  };

  const handleFaqChange = (index: number, field: string, value: string) => {
    const newFaq = [...faq];
    newFaq[index][field] = value;
    setFaq(newFaq);
  };

  const addFaq = () => setFaq([...faq, { pregunta: "", respuesta: "" }]);

  const saveFaq = async () => {
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
    updated[i][field] = field === "ejemplos" ? value.split("\n") : value;
    setIntents(updated);
  };

  const addIntent = () => setIntents([...intents, { nombre: "", ejemplos: [], respuesta: "" }]);

  const saveIntents = async () => {
    await fetch(`${BACKEND_URL}/api/intents`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intents }),
    });
    alert("Intenciones guardadas ✅");
  };

  if (loading) return <p className="text-center">Cargando configuración...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] text-white p-6">
      <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Settings className="text-indigo-400" size={32} />
          Configuración del Asistente AI
        </h2>

        {usage.porcentaje >= 80 && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-center font-medium">
            ⚠ Estás utilizando el <strong>{usage.porcentaje}%</strong> de tu límite mensual ({usage.used}/{usage.limit} mensajes).
            <br />
            Considera actualizar tu plan para evitar interrupciones.
          </div>
        )}

        <TrainingHelp context="training" />

        <input
          name="name"
          value={settings.name}
          onChange={handleChange}
          placeholder="Nombre del negocio"
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
        />

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

        <PromptGenerator
          informacion={settings.informacion_negocio}
          idioma={settings.idioma}
          membresiaActiva={settings.membresia_activa}
          onPromptGenerated={(prompt) =>
            setSettings((prev) => ({ ...prev, prompt }))
          }
        />

        <input
          name="bienvenida"
          value={settings.bienvenida}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
          placeholder="Mensaje de bienvenida"
        />

        <textarea
          name="prompt"
          value={settings.prompt}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
          placeholder="Prompt del sistema"
        />

        <textarea
          name="informacion_negocio"
          value={settings.informacion_negocio}
          onChange={handleChange}
          rows={5}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
          placeholder="Información clave del negocio (servicios, links, precios...)"
        />

        <button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mb-10"
        >
          <Save size={18} /> {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
