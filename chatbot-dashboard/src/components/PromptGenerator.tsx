// src/components/PromptGenerator.tsx

"use client";

import { useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { SiOpenai, SiDatabricks } from 'react-icons/si';

const INFO_TEMPLATE = `Nombre del negocio:
Tipo de negocio:
Ubicación:
Teléfono:

Servicios principales:
- 

Horarios:

Precios o cómo consultar precios:

Reservas / contacto:
`;

interface PromptGeneratorProps {
  infoClave: string;
  funcionesAsistente: string;
  setInfoClave: (value: string) => void;
  setFuncionesAsistente: (value: string) => void;
  idioma: string;
  membresiaActiva: boolean;
  onPromptGenerated: (prompt: string) => void;
}

export default function PromptGenerator({
  infoClave,
  funcionesAsistente,
  setInfoClave,
  setFuncionesAsistente,
  idioma,
  membresiaActiva,
  onPromptGenerated,
}: PromptGeneratorProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!membresiaActiva) {
      alert("Debes activar tu membresía para generar prompts.");
      return;
    }

    if (!funcionesAsistente.trim()) {
      alert("Por favor describe qué debe hacer el asistente.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/generar-prompt`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          descripcion: funcionesAsistente,
          informacion: infoClave,
          idioma,
        }),
      });

      const data = await res.json();
      if (data.prompt) {
        onPromptGenerated(data.prompt);
      } else {
        alert("No se pudo generar el prompt.");
      }
    } catch (err) {
      console.error("❌ Error generando prompt:", err);
      alert("Hubo un error al generar el prompt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <label className="block font-medium mb-1 flex items-center gap-2 text-pink-300">
        <SiOpenai size={18} />
        ¿Qué debe hacer tu asistente?
      </label>
      <textarea
        placeholder={`Ej:
      - Responder preguntas frecuentes
      - Dar información sobre precios
      - Ayudar a reservar citas
      - Ofrecer seguimiento si no hay respuesta`}
        value={funcionesAsistente}
        onChange={(e) => setFuncionesAsistente(e.target.value)}
        rows={4}
        className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white placeholder-white/50 font-mono"
        disabled={!membresiaActiva}
      />

      <label className="block font-medium mb-1 flex items-center gap-2 text-teal-300">
        <SiDatabricks size={18} />
        Información que el Asistente debe conocer
      </label>
      <textarea
        value={infoClave || INFO_TEMPLATE}
        onChange={(e) => setInfoClave(e.target.value)}
        rows={8}
        className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white font-mono"
        disabled={!membresiaActiva}
        style={{ whiteSpace: "pre-line" }}
      />

      <button
        onClick={handleGenerate}
        disabled={!membresiaActiva || loading}
        className={`mt-2 px-4 py-2 rounded font-semibold ${
          membresiaActiva
            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
            : "bg-gray-600 text-white/50 cursor-not-allowed"
        }`}
      >
        {loading ? "Generando..." : "Generar Instrucciones"}
      </button>
    </div>
  );
}
