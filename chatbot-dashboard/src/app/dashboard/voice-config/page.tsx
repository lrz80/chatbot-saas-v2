"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { toast } from "react-toastify";
import { Brain, User, Bot, Link } from "lucide-react";
import TrainingHelp from "@/components/TrainingHelp";
import { BACKEND_URL } from "@/utils/api";
import VoicePromptGenerator from "@/components/VoicePromptGenerator";
import Footer from "@/components/Footer";
import { SiAudioboom } from "react-icons/si";
import VoicePlayer from "@/components/VoicePlayer";
import VoiceMinutesCard from '@/components/VoiceMinutesCard';

export default function VoiceConfigPage() {
  const [idioma, setIdioma] = useState("es-ES");
  const tenant = useTenant();
  const tenantId = tenant?.id;
  const tieneMembresia = tenant?.membresia_activa;
  const router = useRouter();

  // ✨ Estado controlado
  const [funcionesVoz, setFuncionesVoz] = useState("");
  const [infoClaveVoz, setInfoClaveVoz] = useState("");
  const [promptVoz, setPromptVoz] = useState("");
  const [bienvenidaVoz, setBienvenidaVoz] = useState("");
  const [voiceName, setVoiceName] = useState("");      // NEW
  const [voiceHints, setVoiceHints] = useState("");    // NEW

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
  const [usoVoz, setUsoVoz] = useState<any>(null);
  // E.164: + y 10–15 dígitos
  const E164_REGEX = /^\+\d{10,15}$/;

  const [representanteNumber, setRepresentanteNumber] = useState<string>("");
  const [repTouched, setRepTouched] = useState(false);

  // Normaliza: deja solo + y dígitos; colapsa múltiples '+'
  function normalizeTelInput(v: string) {
    let s = v.replace(/[^\d+]/g, '');
    if ((s.match(/\+/g) || []).length > 1) s = '+' + s.replace(/\+/g, '');
    if (s.length > 1) s = s[0] + s.slice(1).replace(/\+/g, '');
    return s;
  }

  // Válido si está vacío (sin transferencia) o cumple E.164
  const e164Ok = representanteNumber === "" || E164_REGEX.test(representanteNumber);

  const verificarMembresia = (e?: Event | React.SyntheticEvent) => {
    if (!tieneMembresia) {
      e?.preventDefault();
      toast.warning("⚠️ Activa tu membresía para usar esta función.");
      router.push("/upgrade");
      return false;
    }
    return true;
  };

  // Cargar configuración de voz por idioma
  useEffect(() => {
    const fetchVoiceConfig = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/voice-config?idioma=${idioma}&canal=voz`, {
          credentials: "include",
        });
        const data = await res.json();

        // Sincroniza inputs controlados con la config
        setPromptVoz(data?.system_prompt || "");
        setBienvenidaVoz(data?.welcome_message || "");
        setVoiceName(data?.voice_name || "");
        setVoiceHints(data?.voice_hints || "");
        setFuncionesVoz(data?.funciones_asistente || "");
        setInfoClaveVoz(data?.info_clave || "");
        setRepresentanteNumber(data?.representante_number || "");

        setAudioDemoUrl(data?.audio_demo_url || "");
      } catch (err) {
        console.error("Error al cargar configuración de voz:", err);
        // No interrumpimos la UI
      }
    };

    fetchVoiceConfig();
  }, [idioma]);

  // Historial (usar canal = 'voz' para coincidir con backend)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/messages?canal=voz`, {
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

  // Links útiles
  useEffect(() => {
    const fetchLinksUtiles = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/voice-links`, {
          credentials: "include",
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("GET /api/voice-links failed:", res.status, err);
          if (res.status === 401 || res.status === 403) {
            toast.warn("No autorizado para ver links. Inicia sesión nuevamente.");
          } else {
            toast.error("No se pudieron cargar los links útiles.");
          }
          setLinksUtiles([]);
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setLinksUtiles(data);
        } else {
          console.warn("GET /api/voice-links no devolvió array:", data);
          setLinksUtiles([]);
        }
      } catch (err) {
        console.error("Error cargando links útiles:", err);
        setLinksUtiles([]);
      }
    };

    fetchLinksUtiles();
  }, []); // <- sin tenantId en dependencias

  const agregarLink = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/voice-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(nuevoLink),
      });
      const data = await res.json().catch(() => null);
  
      if (res.ok) {
        toast.success("✅ Link agregado");
        setNuevoLink({ tipo: "", nombre: "", url: "" });
        // Si el backend devolvió array, úsalo; si no, rehace GET.
        if (data && Array.isArray(data)) {
          setLinksUtiles(data);
        } else {
          // rehacer GET por si acaso
          const res2 = await fetch(`${BACKEND_URL}/api/voice-links`, { credentials: "include" });
          const data2 = await res2.json().catch(() => []);
          setLinksUtiles(Array.isArray(data2) ? data2 : []);
        }
      } else {
        console.error("POST /api/voice-links error:", res.status, data);
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
    if (!e164Ok) {
      setRepTouched(true); // muestra el error si aún no tocó el input
      toast.error("El número de representante debe estar en formato E.164, ej: +15551234567");
      return;
    }

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    // Asegura que los controlados también viajen
    formData.set("system_prompt", promptVoz);
    formData.set("welcome_message", bienvenidaVoz);
    formData.set("voice_name", voiceName);
    formData.set("voice_hints", voiceHints);
    formData.set("funciones_asistente", funcionesVoz);
    formData.set("info_clave", infoClaveVoz);
    formData.set("representante_number", representanteNumber.trim());

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

  // Uso / créditos
  useEffect(() => {
    const fetchUsos = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/usage`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUsoVoz(data.usos.find((u: any) => u.canal === "voz"));
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

      <VoiceMinutesCard />

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
        className="mb-10"
      >
        <input type="hidden" name="idioma" value={idioma} />
        <input type="hidden" name="canal" value="voz" />
        <input type="hidden" name="tenant_id" value={tenantId || ""} />

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div>
            <label className="block text-white font-semibold mb-1">¿Qué debe hacer tu asistente?</label>
            <textarea
              name="funciones_asistente"
              value={funcionesVoz}
              onChange={(e) => setFuncionesVoz(e.target.value)}
              rows={3}
              placeholder="Ejemplo: Atender llamadas, agendar citas..."
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-1">Información clave sobre tu negocio</label>
            <textarea
              name="info_clave"
              value={infoClaveVoz}
              onChange={(e) => setInfoClaveVoz(e.target.value)}
              rows={3}
              placeholder="Ejemplo: servicios, precios, ubicación..."
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />
          </div>
        </div>

        <VoicePromptGenerator
          idioma={idioma}
          categoria="voz"
          funciones={funcionesVoz}
          infoClave={infoClaveVoz}
          disabled={!tieneMembresia}
          onGenerate={(nuevoPrompt, nuevaBienvenida) => {
            setPromptVoz(nuevoPrompt);
            setBienvenidaVoz(nuevaBienvenida);
          }}
        />

        <div className="grid grid-cols-1 gap-6 mt-6">
          <div>
            <label className="block text-white font-semibold mb-1">Instrucciones de Voz generadas</label>
            <textarea
              name="system_prompt"
              value={promptVoz}
              onChange={(e) => setPromptVoz(e.target.value)}
              rows={6}
              placeholder="Este es el comportamiento del asistente..."
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-1">Mensaje de bienvenida</label>
            <input
              type="text"
              name="welcome_message"
              value={bienvenidaVoz}
              onChange={(e) => setBienvenidaVoz(e.target.value)}
              placeholder="Hola, soy Amy..."
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />

            <label className="block text-white font-semibold mt-4 mb-1">Seleccionar voz</label>
            <select
              name="voice_name"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
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
              value={voiceHints}
              onChange={(e) => setVoiceHints(e.target.value)}
              placeholder="Nombres o términos difíciles de pronunciar"
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            />
          </div>
            <div className="mt-6">
              <label className="block text-white font-semibold mb-1">
                Número de representante (para transferir llamadas)
              </label>
              <input
                type="tel"
                name="representante_number"
                value={representanteNumber}
                onChange={(e) => setRepresentanteNumber(normalizeTelInput(e.target.value))}
                onBlur={() => setRepTouched(true)}
                placeholder="+15551234567"
                inputMode="tel"
                maxLength={16}                 // + y hasta 15 dígitos
                pattern="^\+\d{10,15}$"        // hint para el navegador
                title="Formato E.164: + y 10–15 dígitos (ej: +15551234567)"
                aria-invalid={!e164Ok && repTouched}
                className={`w-full px-3 py-2 rounded bg-white/10 border text-white
                  ${!e164Ok && repTouched ? 'border-red-500' : 'border-white/20'}`}
              />
              {!e164Ok && repTouched && (
                <p className="text-red-400 text-sm mt-1">
                  Formato inválido. Usa E.164: + y 10–15 dígitos (ej: +15551234567).
                </p>
              )}
              <p className="text-xs text-white/70 mt-1">
                Déjalo vacío si no quieres transferencias.
              </p>
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
                  <strong>{link.tipo}</strong>: {link.nombre} —{" "}
                  <a href={link.url} target="_blank" rel="noreferrer" className="underline">
                    {link.url}
                  </a>
                </span>
                <button
                  type="button"
                  onClick={() => eliminarLink(link.id)}
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
              className={`px-6 py-2 rounded shadow text-white
                ${!tieneMembresia || !e164Ok ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              disabled={!tieneMembresia || !e164Ok}
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
              <div key={idx} className="bg-white/10 border border-white/20 p-4 rounded-xl backdrop-blur-sm mb-4">
                <div className="text-sm text-white/70 mb-1">
                  {new Date(msg.timestamp).toLocaleString()} — {msg.from_number || "anónimo"}
                </div>
                <div className="font-semibold text-white">
                  {msg.role === "user" ? (
                    <>
                      <User className="inline-block w-4 h-4 mr-1 text-white/70" /> Cliente: {msg.content}
                    </>
                  ) : (
                    <>
                      <Bot className="inline-block w-4 h-4 mr-1 text-white/70" /> Bot: {msg.content}
                    </>
                  )}
                </div>
                {msg.role === "user" && msg.emotion && (
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
