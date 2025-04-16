"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";

export default function PromptsPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/prompt`, {
          credentials: "include", // 🔐 importante para cookies
        });

        if (!res.ok) {
          throw new Error("No se pudo obtener el prompt.");
        }

        const data = await res.json();
        setPrompt(data?.system_prompt || "");
      } catch (err) {
        console.error("❌ Error al cargar prompt:", err);
        setPrompt("");
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/prompt`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ system_prompt: prompt }),
      });

      if (!res.ok) throw new Error("Error al guardar");

      alert("✅ Prompt actualizado correctamente");
    } catch (err) {
      console.error("❌ Error guardando prompt:", err);
      alert("❌ Error al guardar el prompt");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white">Cargando prompt...</p>;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">🧠 Configurar Prompt del Asistente</h2>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={8}
        className="w-full p-4 rounded border border-white/20 bg-white/5 text-white placeholder-white/50 mb-4"
        placeholder="Escribe aquí el prompt personalizado del negocio..."
      />

      <button
        onClick={handleSave}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        disabled={saving}
      >
        {saving ? "Guardando..." : "Guardar Prompt"}
      </button>
    </div>
  );
}
