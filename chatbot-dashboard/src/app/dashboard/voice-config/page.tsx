"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { toast } from "react-toastify";
import {
  Brain,
  User,
  Bot,
  Link,
  Trash,
} from "lucide-react";
import TrainingHelp from "@/components/TrainingHelp";
import { BACKEND_URL } from "@/utils/api";
import VoicePromptGenerator from "@/components/VoicePromptGenerator";
import Footer from "@/components/Footer";
import { SiAudioboom } from "react-icons/si";
import VoicePlayer from "@/components/VoicePlayer";


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
  const [linksUtiles, setLinksUtiles] = useState<any[]>([]);
  const [nuevoLink, setNuevoLink] = useState({ intencion: "", mensaje: "", url: "" });
  const [audioDemoUrl, setAudioDemoUrl] = useState<string>("");

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
  
          if (data.audio_demo_url) {
            setAudioDemoUrl(data.audio_demo_url);
          } else {
            setAudioDemoUrl("");
          }
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
        if (Array.isArray(data)) {
          setVoiceOptions(data);
        } else {
          console.error("❌ La respuesta de voices no es un array:", data);
          toast.error("Error al cargar voces disponibles.");
        }
      } catch (err) {
        console.error("Error cargando voces:", err);
        toast.error("No se pudieron cargar las voces de ElevenLabs.");
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

  useEffect(() => {
    const fetchLinksUtiles = async () => {
      if (!tenantId) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/voice-links`, {
          credentials: "include",
        });
        const data = await res.json();
        setLinksUtiles(data);
      } catch (err) {
        console.error("Error cargando links útiles:", err);
      }
    };

    fetchLinksUtiles();
  }, [tenantId]);

  const agregarLink = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/voice-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(nuevoLink),
      });
      if (res.ok) {
        toast.success("✅ Link agregado");
        setNuevoLink({ intencion: "", mensaje: "", url: "" });
        const data = await res.json();
        setLinksUtiles(data);
      } else {
        toast.error("❌ Error al agregar link útil");
      }
    } catch (err) {
      console.error("Error al agregar link:", err);
    }
  };

  const eliminarLink = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/voice-links/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.info("Link eliminado");
        setLinksUtiles((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error("Error al eliminar link:", err);
    }
  };

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

        {/* Audio demo generado */}
        {voiceOptions.length > 0 && (
          <div className="mt-6">
            <label className="block mb-2 font-semibold text-white">Vista previa de la voz:</label>
            <VoicePlayer url={audioDemoUrl} />
          </div>
        )}

        {/* Links útiles */}
        <div className="mb-8">
          <label className="block mb-2 font-semibold text-white flex items-center gap-2">
            <Link className="text-blue-400" /> Links útiles (enviar por SMS)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Intención: reservar, pagar, etc."
              value={nuevoLink.intencion}
              onChange={(e) => setNuevoLink({ ...nuevoLink, intencion: e.target.value })}
              className="border px-3 py-2 rounded"
            />
            <input
              type="text"
              placeholder="Mensaje del SMS"
              value={nuevoLink.mensaje}
              onChange={(e) => setNuevoLink({ ...nuevoLink, mensaje: e.target.value })}
              className="border px-3 py-2 rounded"
            />
            <input
              type="text"
              placeholder="URL destino"
              value={nuevoLink.url}
              onChange={(e) => setNuevoLink({ ...nuevoLink, url: e.target.value })}
              className="border px-3 py-2 rounded"
            />
          </div>
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
            onClick={agregarLink}
          >
            Agregar link útil
          </button>

          <ul className="text-white space-y-2">
            {linksUtiles.map((link) => (
              <li key={link.id} className="flex justify-between items-center bg-white/5 p-3 rounded-md">
                <span className="text-sm">
                  <strong>{link.intencion}</strong>: {link.mensaje} — <a href={link.url} target="_blank" className="underline">{link.url}</a>
                </span>
                <button onClick={() => eliminarLink(link.id)}>
                  <Trash className="text-red-400 hover:text-red-500 w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ...resto del formulario permanece igual... */}
      </form>

      {/* Historial de llamadas */}
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
