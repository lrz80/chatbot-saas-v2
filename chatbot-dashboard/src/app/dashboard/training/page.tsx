"use client";

import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TrainingHelp from "@/components/TrainingHelp";
import {
  MessageSquareText,
  Sparkles,
  Flame,
  NotebookText,
  BotMessageSquare,
  Info,
  Save,
} from "lucide-react";
import { BACKEND_URL } from "@/utils/api";

export default function TrainingPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intents, setIntents] = useState<{ nombre: string; ejemplos: string[]; respuesta: string }[]>([]);
  const [faq, setFaq] = useState<{ pregunta: string; respuesta: string }[]>([]);
  const [usage, setUsage] = useState<{ used: number; limit: number | null; porcentaje: number }>({
    used: 0,
    limit: null,
    porcentaje: 0,
  });
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();

        setSettings({
          name: data.name || "",
          categoria: data.categoria || "",
          prompt: data.prompt || "Eres un asistente útil.",
          bienvenida: data.bienvenida || "¡Hola! ¿En qué puedo ayudarte hoy?",
          membresia_activa: data.membresia_activa,
          informacion_negocio: data.informacion_negocio || "",
          funciones_asistente: data.funciones_asistente || "",
          info_clave: data.info_clave || "",
          idioma: data.idioma || "es",
        });

        const usageRes = await fetch(`${BACKEND_URL}/api/usage`, {
          credentials: "include",
        });
        if (usageRes.ok) {
          const usageData = await usageRes.json();
          setUsage(usageData);
        }

        const faqRes = await fetch(`${BACKEND_URL}/api/faq`, {
          credentials: "include",
        });
        if (faqRes.ok) {
          const faqData = await faqRes.json();
          setFaq(faqData);
        }

        const intentsRes = await fetch(`${BACKEND_URL}/api/intents`, {
          credentials: "include",
        });
        if (intentsRes.ok) {
          const intentData = await intentsRes.json();
          setIntents(intentData);
        }
      } catch (err) {
        console.error("❌ Error cargando configuración:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  if (loading) return <p className="text-center">Cargando configuración...</p>;

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-10">
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <Settings className="text-indigo-400" size={28} /> Configuración del Asistente AI
      </h2>

      <TrainingHelp context="training" />

      {/* Nombre del negocio */}
      <input
        name="name"
        value={settings.name}
        onChange={handleChange}
        className="w-full p-3 border rounded bg-white/10 border-white/20 text-white placeholder-gray-300"
        placeholder="Nombre del negocio"
      />

      {/* ¿Qué debe hacer tu asistente? */}
      <section>
        <h3 className="text-xl font-semibold text-indigo-300 mb-2">🧠 ¿Qué debe hacer tu Asistente?</h3>
        <textarea
          name="funciones_asistente"
          value={settings.funciones_asistente}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border rounded bg-white/10 border-white/20 text-white"
          placeholder="Ejemplo: Agendar citas, responder dudas, enviar promociones..."
        />
      </section>

      {/* Información que el Asistente debe conocer */}
      <section>
        <h3 className="text-xl font-semibold text-indigo-300 mb-2">📚 Información clave para el Asistente</h3>
        <textarea
          name="info_clave"
          value={settings.info_clave}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border rounded bg-white/10 border-white/20 text-white"
          placeholder="Ejemplo: Servicios, precios, promociones, links, etc."
        />
      </section>

      {/* Generador de Prompts */}
      <section>
        <h3 className="text-xl font-semibold text-indigo-300 mb-2">🛠️ Generador de Prompts</h3>
        <p className="text-white/70 text-sm mb-2">
          Usa plantillas predefinidas según la categoría de tu negocio.
        </p>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm">
          Ver plantillas por categoría
        </button>
      </section>

      {/* Prompt del sistema */}
      <section>
        <label className="block text-sm mb-1 mt-6">🧾 Prompt del sistema</label>
        <textarea
          name="prompt"
          value={settings.prompt}
          onChange={handleChange}
          rows={4}
          className="w-full p-3 border rounded bg-white/10 border-white/20 text-white"
        />
      </section>

      {/* Mensaje de bienvenida */}
      <section>
        <label className="block text-sm mb-1">👋 Mensaje de bienvenida</label>
        <input
          name="bienvenida"
          value={settings.bienvenida}
          onChange={handleChange}
          className="w-full p-3 border rounded bg-white/10 border-white/20 text-white"
        />
      </section>

      {/* Información del negocio */}
      <section>
        <h3 className="text-xl font-semibold text-indigo-300 mb-2">🏢 Información del negocio</h3>
        <textarea
          name="informacion_negocio"
          value={settings.informacion_negocio}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border rounded bg-white/10 border-white/20 text-white"
          placeholder="Dirección, horario, redes sociales..."
        />
      </section>

      {/* Preguntas frecuentes */}
      <section>
        <h3 className="text-xl font-semibold text-indigo-300 mb-2">❓ Preguntas frecuentes</h3>
        {/* Aquí iría tu componente de edición de FAQ */}
      </section>

      {/* Entrenamiento por intención */}
      <section>
        <h3 className="text-xl font-semibold text-indigo-300 mb-2">🎯 Entrenamiento por intención</h3>
        {/* Aquí iría tu componente de intents */}
      </section>

      {/* Vista previa */}
      <section>
        <h3 className="text-xl font-semibold text-indigo-300 mb-2">🔍 Vista previa del Asistente</h3>
        {/* Aquí puedes integrar tu componente PreviewBot */}
      </section>

      <button
        onClick={handleSave}
        className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded text-white font-semibold flex items-center gap-2"
      >
        <Save size={18} /> {saving ? "Guardando..." : "Guardar Configuración"}
      </button>
    </div>
  );
}
