"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { toast } from "react-toastify";
import { FiMic, FiMessageCircle, FiSettings, FiVolume2, FiHash } from "react-icons/fi";
import TrainingHelp from "@/components/TrainingHelp";
import { BACKEND_URL } from "@/utils/api"; // ✅ CORRECTO

type VoiceOption = {
  label: string;
  value: string;
};

function getVoicesByLanguage(lang: string): VoiceOption[] {
  const voices: Record<string, VoiceOption[]> = {
    "es-ES": [
      { label: "Alice (neutro)", value: "alice" },
      { label: "Conchita (España)", value: "Polly.Conchita" },
      { label: "Lucia (España)", value: "Polly.Lucia" },
      { label: "Miguel (España)", value: "Polly.Miguel" },
    ],
    "en-US": [
      { label: "Matthew (US)", value: "Polly.Matthew" },
      { label: "Joanna (US)", value: "Polly.Joanna" },
      { label: "Kendra (US)", value: "Polly.Kendra" },
      { label: "Joey (US)", value: "Polly.Joey" },
    ],
    "default": [{ label: "Alice (neutro)", value: "alice" }],
  };
  return voices[lang] || voices["default"];
}

export default function VoiceConfigPage() {
  const [idioma, setIdioma] = useState("es-ES");
  const tenant = useTenant();
  const tenantId = tenant?.id;
  const router = useRouter();

  const idiomasDisponibles = [
    { label: "Español", value: "es-ES" },
    { label: "English", value: "en-US" },
  ];

  if (!tenantId) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-400 animate-pulse">
        Cargando configuración del negocio...
      </div>
    );
  }

  const voiceOptions = getVoicesByLanguage(idioma);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const res = await fetch(`${BACKEND_URL}/api/voice-config`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        toast.success("✅ ¡Configuración guardada!");
      } else {
        toast.error("❌ Algo salió mal.");
      }
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("⚠️ Error inesperado.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FiMic className="text-purple-400" />
        Asistente de Voz por Idioma
      </h1>
      <TrainingHelp context="voice" />

      <div className="flex space-x-4 mb-6">
        {idiomasDisponibles.map((lang) => (
          <button
            key={lang.value}
            className={`px-4 py-2 rounded ${
              idioma === lang.value ? "bg-purple-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setIdioma(lang.value)}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input type="hidden" name="idioma" value={idioma} />
        <input type="hidden" name="canal" value="voz" />
        <input type="hidden" name="tenant_id" value={tenantId} />

        <div className="mb-4">
          <label className="block mb-2 font-semibold flex items-center gap-2">
            <FiSettings className="text-purple-400" />
            Prompt del sistema ({idioma})
          </label>
          <textarea name="system_prompt" className="w-full border px-4 py-2 rounded" rows={4} />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold flex items-center gap-2">
            <FiMessageCircle className="text-green-400" />
            Mensaje de bienvenida ({idioma})
          </label>
          <input type="text" name="welcome_message" className="w-full border px-4 py-2 rounded" />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold flex items-center gap-2">
            <FiVolume2 className="text-indigo-400" />
            Voz de Twilio
          </label>
          <div className="flex gap-3 items-center">
            <select name="voice_name" className="w-full border px-4 py-2 rounded">
              {voiceOptions.map((voice) => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="text-sm bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
              onClick={async () => {
                const voice = (
                  document.querySelector("select[name='voice_name']") as HTMLSelectElement
                )?.value;

                const previewForm = new FormData();
                previewForm.append("voice", voice);
                previewForm.append("language", idioma);

                await fetch(`${BACKEND_URL}/api/voice-preview`, {
                  method: "POST",
                  body: previewForm,
                  credentials: "include",
                });

                toast.info("📞 Voz enviada. Llamá al número de prueba para escuchar.");
              }}
            >
              Escuchar voz
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold flex items-center gap-2">
            <FiHash className="text-yellow-400" />
            Hints (palabras clave)
          </label>
          <input
            type="text"
            name="voice_hints"
            className="w-full border px-4 py-2 rounded"
            placeholder="precio, cita, horario..."
          />
        </div>

        <button
          type="submit"
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
        >
          Guardar Configuración
        </button>
      </form>
    </div>
  );
}
