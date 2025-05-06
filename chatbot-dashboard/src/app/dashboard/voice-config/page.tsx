"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { toast } from "react-toastify";
import {
  Settings,
  MessageCircle,
  Volume2,
  Hash,
  Brain,
  User,
  Bot,
} from "lucide-react";
import TrainingHelp from "@/components/TrainingHelp";
import { BACKEND_URL } from "@/utils/api";
import VoicePromptGenerator from "@/components/VoicePromptGenerator";
import Footer from "@/components/Footer";
import { SiAudioboom } from "react-icons/si";

export default function VoiceConfigPage() {
  const [idioma, setIdioma] = useState("es-ES");
  const tenant = useTenant();
  const tenantId = tenant?.id;
  const router = useRouter();

  const idiomasDisponibles = [
    { label: "Español", value: "es-ES" },
    { label: "English", value: "en-US" },
  ];

  const [voiceOptions, setVoiceOptions] = useState<{ label: string; value: string }[]>([]);
  const [voiceMessages, setVoiceMessages] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchVoiceConfig = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/voice-config?idioma=${idioma}&canal=voz`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data) {
          const promptEl = document.querySelector("textarea[name='system_prompt']") as HTMLTextAreaElement;
          const welcomeEl = document.querySelector("input[name='welcome_message']") as HTMLInputElement;
          const voiceEl = document.querySelector("select[name='voice_name']") as HTMLSelectElement;
          const hintsEl = document.querySelector("input[name='voice_hints']") as HTMLInputElement;

          if (promptEl) promptEl.value = data.system_prompt || "";
          if (welcomeEl) welcomeEl.value = data.welcome_message || "";
          if (voiceEl) voiceEl.value = data.voice_name || "";
          if (hintsEl) hintsEl.value = data.voice_hints || "";
        }
      } catch (err) {
        console.error("Error al cargar configuración de voz:", err);
      }
    };

    fetchVoiceConfig();
  }, [idioma]);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/elevenlabs/voices`, {
          credentials: "include",
        });
        const data = await res.json();
        setVoiceOptions(data); // ahora es un array plano con label y value
      } catch (err) {
        console.error("Error cargando voces:", err);
      }
    };

    fetchVoices();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/messages?canal=voice`, {
          credentials: "include",
        });
        const data = await res.json();
        setVoiceMessages(data);
      } catch (err) {
        console.error("Error al cargar historial de voz:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchMessages();
  }, []);

  if (!tenant) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-400 animate-pulse">
        Cargando configuración del negocio...
      </div>
    );
  }

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
      <h1 className="text-3xl md:text-4xl font-extrabold text-center flex justify-center items-center gap-2 mb-8 text-purple-300">
        <SiAudioboom size={36} className="text-sky-400 animate-pulse" /> Configuración de Asistente de Voz
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

      <form onSubmit={handleSubmit} className="mb-10">
        <input type="hidden" name="idioma" value={idioma} />
        <input type="hidden" name="canal" value="voz" />
        <input type="hidden" name="tenant_id" value={tenantId} />

        <VoicePromptGenerator
          idioma={idioma}
          categoria={tenant?.categoria || "general"}
          onGenerate={(prompt, bienvenida) => {
            (document.querySelector("textarea[name='system_prompt']") as HTMLTextAreaElement).value = prompt;
            (document.querySelector("input[name='welcome_message']") as HTMLInputElement).value = bienvenida;
          }}
        />

        <div className="mb-4">
          <label className="block mb-2 font-semibold text-white">¿Qué debe hacer el asistente?</label>
          <textarea
            name="funciones_asistente"
            rows={3}
            className="w-full border px-4 py-2 rounded"
            placeholder="Ej: responder dudas, agendar citas..."
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold text-white">Información clave del negocio</label>
          <textarea
            name="info_clave"
            rows={3}
            className="w-full border px-4 py-2 rounded"
            placeholder="Ej: precios, dirección, horarios..."
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold flex items-center gap-2">
            <Settings className="text-purple-400" />
            Instrucciones del sistema ({idioma})
          </label>
          <textarea name="system_prompt" className="w-full border px-4 py-2 rounded" rows={4} />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold flex items-center gap-2">
            <MessageCircle className="text-green-400" />
            Mensaje de bienvenida ({idioma})
          </label>
          <input type="text" name="welcome_message" className="w-full border px-4 py-2 rounded" />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold flex items-center gap-2">
            <Volume2 className="text-indigo-400" />
            Voz de ElevenLabs
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
            <Hash className="text-yellow-400" />
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

      <hr className="my-8 border-white/20" />

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
        <Brain className="text-purple-300" />
        Historial de llamadas y emociones
      </h2>

      {loadingHistory ? (
        <div className="text-gray-400 animate-pulse">Cargando historial...</div>
      ) : voiceMessages.length === 0 ? (
        <div className="text-gray-400">No hay registros de voz aún.</div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {voiceMessages
            .slice()
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((msg, idx) => (
              <div
                key={idx}
                className="bg-white/10 border border-white/20 p-4 rounded-xl backdrop-blur-sm mb-4"
              >
                <div className="text-sm text-white/70 mb-1">
                  {new Date(msg.timestamp).toLocaleString()} — {msg.from_number || "anónimo"}
                </div>
                <div className="font-semibold text-white">
                  {msg.sender === "user" ? (
                    <>
                      <User className="inline-block w-4 h-4 mr-1 text-white/70" /> Cliente: {msg.content}
                    </>
                  ) : (
                    <>
                      <Bot className="inline-block w-4 h-4 mr-1 text-white/70" /> Bot: {msg.content}
                    </>
                  )}
                </div>

                {msg.sender === "user" && msg.emotion && (
                  <div className="text-sm mt-1 text-purple-300">
                    Emoción detectada: <span className="font-medium">{msg.emotion}</span>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
      <Footer />
    </div>
  );
}
