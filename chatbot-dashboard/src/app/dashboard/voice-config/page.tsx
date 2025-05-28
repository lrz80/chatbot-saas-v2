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
} from "lucide-react";
import TrainingHelp from "@/components/TrainingHelp";
import { BACKEND_URL } from "@/utils/api";
import VoicePromptGenerator from "@/components/VoicePromptGenerator";
import Footer from "@/components/Footer";
import { SiAudioboom, SiOpenai } from "react-icons/si";
import VoicePlayer from "@/components/VoicePlayer";

export default function VoiceConfigPage() {
  const [idioma, setIdioma] = useState("es-ES");
  const tenant = useTenant();
  const tenantId = tenant?.id;
  const tieneMembresia = tenant?.membresia_activa;
  const router = useRouter();

  const verificarMembresia = (e?: Event | React.SyntheticEvent) => {
    if (!tieneMembresia) {
      e?.preventDefault();
      toast.warning("⚠️ Activa tu membresía para usar esta función.");
      router.push("/upgrade");
      return false;
    }
    return true;
  };
  
  const idiomasDisponibles = [
    { label: "Español", value: "es-ES" },
    { label: "English", value: "en-US" },
  ];

  const [voiceOptions, setVoiceOptions] = useState<{ label: string; value: string }[]>([]);
  const [voiceMessages, setVoiceMessages] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [linksUtiles, setLinksUtiles] = useState<any[]>([]);
  const [nuevoLink, setNuevoLink] = useState({ tipo: "", nombre: "", url: "" });
  const [audioDemoUrl, setAudioDemoUrl] = useState<string>("");
  const [linksParaEliminar, setLinksParaEliminar] = useState<number[]>([]);
  const [usoVoz, setUsoVoz] = useState<any>(null);
  const [usoTokens, setUsoTokens] = useState<any>(null);

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
        setVoiceMessages(Array.isArray(data) ? data : []);
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
        setNuevoLink({ tipo: "", nombre: "", url: "" });
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

  const marcarParaEliminar = (id: number) => {
    setLinksUtiles((prev) => prev.filter((l) => l.id !== id));
    setLinksParaEliminar((prev) => [...prev, id]);
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

        // 🔥 Eliminar links marcados para borrar
        if (linksParaEliminar.length > 0) {
          await Promise.all(
            linksParaEliminar.map((id) =>
              fetch(`${BACKEND_URL}/api/voice-links/${id}`, {
                method: "DELETE",
                credentials: "include",
              })
            )
          );
          setLinksParaEliminar([]);
          toast.info("🗑️ Links eliminados correctamente.");
        }
      } else {
        toast.error("❌ Algo salió mal.");
      }
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("⚠️ Error inesperado.");
    }
  };

  useEffect(() => {
    const fetchUsos = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/usage`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUsoVoz(data.usos.find((u: any) => u.canal === 'voz'));
          setUsoTokens(data.usos.find((u: any) => u.canal === 'tokens_openai'));
        }
      } catch (error) {
        console.error("Error obteniendo uso:", error);
      }
    };
    fetchUsos();
  }, []);

  const comprarMas = async (canal: string, cantidad: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout-credit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal,
          cantidad,
          redirectPath: "/dashboard/voice-config",
        }),
      });
  
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("❌ Error al iniciar la compra.");
      }
    } catch (error) {
      console.error("❌ Error al procesar la compra:", error);
      alert("❌ Error al procesar la compra.");
    }
  };  

  const calcularPorcentaje = (usados: number, limite: number) => (usados / limite) * 100;
  const colorBarra = (porcentaje: number) => {
    if (porcentaje > 80) return "bg-red-500";
    if (porcentaje > 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-center flex justify-center items-center gap-2 mb-8 text-purple-300">
        <SiAudioboom size={36} className="text-sky-400 animate-pulse" /> Configuración de Asistente de Voz
      </h1>
  
      <TrainingHelp context="voice" />

      {usoVoz && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <SiOpenai /> Uso de Voz (minutos)
          </h3>
          <p className="text-white text-sm mb-2">
            {usoVoz.usados ?? 0} de {usoVoz.limite ?? 500} minutos utilizados
          </p>
          <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
            <div
              className={`h-full ${colorBarra(calcularPorcentaje(usoVoz.usados, usoVoz.limite))} transition-all duration-500`}
              style={{ width: `${calcularPorcentaje(usoVoz.usados, usoVoz.limite)}%` }}
            />
          </div>
          <div className="flex gap-2">
            {[500, 1000, 2000].map((extra) => (
              <button
                key={extra}
                onClick={() => comprarMas("voz", extra)}
                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
              >
                +{extra} minutos
              </button>
            ))}
          </div>
        </div>
      )}

      {usoTokens && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <SiOpenai /> Uso de Tokens
          </h3>
          <p className="text-white text-sm mb-2">
            {usoTokens.usados ?? 0} de {usoTokens.limite ?? 500000} tokens utilizados
          </p>
          <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
            <div
              className={`h-full ${colorBarra(calcularPorcentaje(usoTokens.usados, usoTokens.limite))} transition-all duration-500`}
              style={{ width: `${calcularPorcentaje(usoTokens.usados, usoTokens.limite)}%` }}
            />
          </div>
          <div className="flex gap-2">
            {[50000, 100000, 200000].map((extra) => (
              <button
                key={extra}
                onClick={() => comprarMas("tokens_openai", extra)}
                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
              >
                +{extra.toLocaleString()} tokens
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-4 mb-6">
        {idiomasDisponibles.map((lang) => (
          <button
            key={lang.value}
            className={`px-4 py-2 rounded ${idioma === lang.value ? "bg-purple-600 text-white" : "bg-gray-200"}`}
            onClick={() => setIdioma(lang.value)}
          >
            {lang.label}
          </button>
        ))}
      </div>
  
      {!tieneMembresia && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded mb-6 text-sm border border-yellow-400">
          ⚠️ Tu membresía está inactiva. Puedes visualizar la configuración, pero no puedes guardar ni generar cambios hasta activarla.
        </div>
      )}

      <form
        onSubmit={(e) => {
          if (verificarMembresia(e)) {
            handleSubmit(e);
          }
        }}
      className="mb-10">
        <input type="hidden" name="idioma" value={idioma} />
        <input type="hidden" name="canal" value="voz" />
        <input type="hidden" name="tenant_id" value={tenantId} />
  
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div>
            <label className="block text-white font-semibold mb-1">¿Qué debe hacer tu asistente?</label>
            <textarea
              name="funciones_asistente"
              rows={3}
              placeholder="Ejemplo: Atender llamadas, agendar citas, responder preguntas..."
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-1">Información clave sobre tu negocio</label>
            <textarea
              name="info_clave"
              rows={3}
              placeholder="Ejemplo: Servicios, horarios, ubicación, promociones..."
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />
          </div>
        </div>
  
        <VoicePromptGenerator
          idioma={idioma}
          categoria={tenant?.categoria || "general"}
          disabled={!tieneMembresia}
          onGenerate={(prompt, bienvenida) => {
            (document.querySelector("textarea[name='system_prompt']") as HTMLTextAreaElement).value = prompt;
            (document.querySelector("input[name='welcome_message']") as HTMLInputElement).value = bienvenida;
          }}
        />
  
        <div className="grid grid-cols-1 gap-6 mt-6">
          <div>
            <label className="block text-white font-semibold mb-1">Instrucciones de Voz generadas</label>
            <textarea
              name="system_prompt"
              rows={6}
              placeholder="Este es el comportamiento del asistente de voz..."
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
              required
            />
          </div>
  
          <div>
            <label className="block text-white font-semibold mb-1">Mensaje de bienvenida</label>
            <input
              type="text"
              name="welcome_message"
              placeholder="Hola, soy Amy. Bienvenido a..."
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
              required
            />
  
            <label className="block text-white font-semibold mt-4 mb-1">Seleccionar voz</label>
            <select
              name="voice_name"
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
              required
            >
              <option value="">Selecciona una voz</option>
              {voiceOptions.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
  
            <label className="block text-white font-semibold mt-4 mb-1">Hints de pronunciación (opcional)</label>
            <input
              type="text"
              name="voice_hints"
              placeholder="Nombres o términos difíciles de pronunciar"
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />
          </div>
        </div>
  
        {audioDemoUrl && (
          <div className="mt-6">
            <label className="block mb-2 font-semibold text-white">Vista previa de la voz:</label>
            <VoicePlayer url={audioDemoUrl} />
          </div>
        )}
  
        <div className="mt-10 mb-8">
          <label className="block mb-2 font-semibold text-white flex items-center gap-2">
            <Link className="text-blue-400" /> Links útiles (enviar por SMS)
          </label>
  
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Tipo: reservar, pagar, etc."
              value={nuevoLink.tipo}
              onChange={(e) => setNuevoLink({ ...nuevoLink, tipo: e.target.value })}
              className="border px-3 py-2 rounded"
            />
            <input
              type="text"
              placeholder="Nombre del link"
              value={nuevoLink.nombre}
              onChange={(e) => setNuevoLink({ ...nuevoLink, nombre: e.target.value })}
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
            onClick={(e) => {
              if (verificarMembresia(e)) agregarLink();
            }}            
            disabled={!tieneMembresia}
          >
            Agregar link útil
          </button>
  
          <ul className="text-white space-y-2">
            {linksUtiles.map((link) => (
              <li key={link.id} className="flex justify-between items-center bg-white/5 p-3 rounded-md">
                <span className="text-sm">
                  <strong>{link.tipo}</strong>: {link.nombre} — {" "}
                  <a href={link.url} target="_blank" className="underline">
                    {link.url}
                  </a>
                </span>
                <button
                  type="button"
                  onClick={() => marcarParaEliminar(link.id)}
                  className="text-red-500 hover:text-red-700 text-lg font-bold ml-4"
                  title="Eliminar"
                >
                  ✖
                </button>
              </li>
            ))}
          </ul>
  
          <div className="mt-6">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow"
              disabled={!tieneMembresia}
            >
              Guardar configuración
            </button>
          </div>
        </div>
      </form>
  
      <hr className="my-8 border-white/20" />
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
        <Brain className="text-purple-300" />
        Historial de llamadas y emociones
      </h2>
  
      {loadingHistory ? (
        <div className="text-gray-400 animate-pulse">Cargando historial...</div>
      ) : !Array.isArray(voiceMessages) || voiceMessages.length === 0 ? (
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