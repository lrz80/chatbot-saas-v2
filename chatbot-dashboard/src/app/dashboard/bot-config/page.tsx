"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils/api";
import { promptTemplates } from "../../../utils/promptTemplates";

export default function BotConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    name: "",
    prompt: "Eres un asistente útil.",
    bienvenida: "¡Hola! ¿En qué puedo ayudarte hoy?",
    categoria: "",
    membresia_activa: true,
  });

  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await fetch(`${BACKEND_URL}/api/settings`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();

      if (data.membresia_activa === false) {
        router.push("/dashboard/profile?upgrade=1");
        return;
      }

      setSettings({
        name: data.name || "",
        prompt: data.prompt || "Eres un asistente útil.",
        bienvenida: data.bienvenida || "¡Hola! ¿En qué puedo ayudarte hoy?",
        categoria: data.categoria || "",
        membresia_activa: data.membresia_activa,
      });

      setLoading(false);
    };

    fetchSettings();
  }, [router]);

  const handleChange = (e: any) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (settings.prompt.trim().length < 5) {
      alert("El prompt debe tener al menos 5 caracteres.");
      return;
    }

    if (settings.bienvenida.trim().length < 5) {
      alert("El mensaje de bienvenida debe tener al menos 5 caracteres.");
      return;
    }

    setSaving(true);
    const res = await fetch(`${BACKEND_URL}/api/settings`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...settings }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Error al guardar configuración.");
    } else {
      alert("Configuración del bot guardada ✅");
    }

    setSaving(false);
  };

  const aplicarPlantilla = () => {
    const plantilla = promptTemplates[settings.categoria?.toLowerCase()];
    if (plantilla) {
      setSettings((prev) => ({
        ...prev,
        prompt: plantilla.prompt,
        bienvenida: plantilla.bienvenida,
      }));
    } else {
      alert("No hay plantilla disponible para esta categoría.");
    }
  };

  if (loading) return <p className="text-center">Cargando configuración del Asistente...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] text-white p-6">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
        <h2 className="text-3xl font-bold mb-6 text-white">Configuración del Asistente AI</h2>

        <label className="block font-medium mb-1">Nombre del Negocio</label>
        <input
          type="text"
          name="name"
          value={settings.name}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-6 bg-white/10 border-white/20 text-white placeholder-white/60"
        />

        <label className="block font-medium mb-1">Categoría del Negocio</label>
        <select
          name="categoria"
          value={settings.categoria}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-6 bg-white/10 border-white/20 text-white"
        >
          <option value="">Selecciona una categoría</option>
          <option value="spa">Spa</option>
          <option value="clinica">Clínica</option>
          <option value="restaurante">Restaurante</option>
          <option value="barberia">Barbería</option>
          <option value="fitness">Fitness</option>
          <option value="petgrooming">Pet Grooming</option>
        </select>

        <button
          onClick={aplicarPlantilla}
          className="mb-6 bg-indigo-400/20 text-indigo-100 font-medium px-4 py-2 rounded hover:bg-indigo-500/30"
        >
          ✨ Aplicar Plantilla de Prompt
        </button>

        <label className="block font-medium mb-1">Prompt del sistema</label>
        <textarea
          name="prompt"
          value={settings.prompt}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
        />

        <label className="block font-medium mb-1">Mensaje de bienvenida</label>
        <input
          type="text"
          name="bienvenida"
          value={settings.bienvenida}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          {saving ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>
    </div>
  );
}
