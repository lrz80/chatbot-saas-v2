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
    <div className="min-h-screen bg-black text-white p-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Settings className="text-indigo-400" size={28} /> Configuración del Asistente AI
      </h2>
      <TrainingHelp context="training" />

      <input
        name="name"
        value={settings.name}
        onChange={handleChange}
        className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white placeholder-gray-300"
        placeholder="Nombre del negocio"
      />

      <label className="block text-sm mb-1">Prompt del sistema</label>
      <textarea
        name="prompt"
        value={settings.prompt}
        onChange={handleChange}
        rows={4}
        className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
      />

      <label className="block text-sm mb-1">Mensaje de bienvenida</label>
      <input
        name="bienvenida"
        value={settings.bienvenida}
        onChange={handleChange}
        className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
      />

      <button
        onClick={handleSave}
        className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded text-white font-semibold flex items-center gap-2"
      >
        <Save size={18} /> {saving ? "Guardando..." : "Guardar Configuración"}
      </button>
    </div>
  );
}
