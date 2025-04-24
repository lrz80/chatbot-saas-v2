"use client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface Props {
  idioma: string;
  categoria: string;
  onGenerate: (prompt: string, bienvenida: string) => void;
}

export default function VoicePromptGenerator({ idioma, categoria, onGenerate }: Props) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prompt-generator/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idioma, categoria }),
      });
      const data = await res.json();
      if (res.ok) {
        onGenerate(data.prompt, data.bienvenida);
        toast.success("✅ Prompt generado automáticamente");
      } else {
        toast.error("❌ No se pudo generar el prompt.");
      }
    } catch (err) {
      toast.error("❌ Error de red");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Generando..." : "Generar prompt de voz automáticamente"}
    </button>
  );
}
