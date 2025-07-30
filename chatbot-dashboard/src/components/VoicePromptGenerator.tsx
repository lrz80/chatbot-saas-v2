// ✅ src/components/VoicePromptGenerator.tsx

"use client";
import { useState } from "react";
import { toast } from "react-toastify";
import { BACKEND_URL } from "@/utils/api";

interface Props {
  idioma: string;
  categoria: string;
  funciones: string;
  infoClave: string;
  onGenerate: (prompt: string, bienvenida: string) => void;
  disabled?: boolean;
}

export default function VoicePromptGenerator({
  idioma,
  categoria,
  funciones,
  infoClave,
  onGenerate,
  disabled = false,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!funciones.trim() || !infoClave.trim()) {
      toast.warn("Por favor completa ambos campos antes de generar el prompt.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/voice-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idioma,
          categoria,
          funciones_asistente: funciones.trim(),
          info_clave: infoClave.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onGenerate(data.prompt, data.bienvenida);
        toast.success("✅ Prompt generado automáticamente");
      } else {
        toast.error(data.error || "❌ No se pudo generar el prompt.");
      }
    } catch (err) {
      toast.error("❌ Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading || disabled}
      className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Generando..." : "Generar Instrucciones de voz"}
    </button>
  );
}
