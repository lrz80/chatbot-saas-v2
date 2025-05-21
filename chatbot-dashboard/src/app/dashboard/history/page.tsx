// ✅ src/app/dashboard/history/page.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { BACKEND_URL } from "@/utils/api";
import {
  SiWhatsapp,
  SiFacebook,
  SiMinutemailer,
} from "react-icons/si";
import { FiGlobe } from "react-icons/fi";

const PAGE_SIZE = 10;

export default function MessageHistory() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canal, setCanal] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const lastTimestampRef = useRef<string | null>(null);

  const [conteo, setConteo] = useState({
    whatsapp: 0,
    facebook: 0,
    voice: 0,
  });

  const fetchMessages = async (reset = false) => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/messages?canal=${canal}&page=${reset ? 1 : page}&limit=${PAGE_SIZE}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Error al obtener mensajes");

      const data = await res.json();
      const nuevosMensajes = data.mensajes.sort(
        (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      if (reset) {
        setMessages(nuevosMensajes);
        setPage(2);
      } else {
        setMessages((prev) => [...prev, ...nuevosMensajes]);
        setPage((prev) => prev + 1);
      }

      if (nuevosMensajes.length > 0) {
        lastTimestampRef.current = nuevosMensajes[nuevosMensajes.length - 1].timestamp;
      }

      setHasMore(nuevosMensajes.length === PAGE_SIZE);

      const allMessages = reset ? nuevosMensajes : [...messages, ...nuevosMensajes];
      setConteo({
        whatsapp: allMessages.filter((m) => m.canal === "whatsapp").length,
        facebook: allMessages.filter((m) => m.canal === "facebook").length,
        voice: allMessages.filter((m) => m.canal === "voice").length,
      });

      setLoading(false);
    } catch (error) {
      console.error("❌ Error al obtener mensajes:", error);
      setLoading(false);
    }
  };

  const fetchMensajesNuevos = async () => {
    try {
      const desde = lastTimestampRef.current;
      if (!desde) return;

      const res = await fetch(
        `${BACKEND_URL}/api/messages/nuevos?canal=${canal}&desde=${encodeURIComponent(desde)}`,
        { credentials: "include" }
      );
      if (!res.ok) return;

      const data = await res.json();
      const nuevos = data.mensajes?.sort(
        (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ) || [];

      if (nuevos.length > 0) {
        setMessages((prev) => {
          const prevIds = new Set(prev.map((m) => m.id));
          const unicos = nuevos.filter((m) => !prevIds.has(m.id));
          return [...prev, ...unicos];
        });
      
        lastTimestampRef.current = nuevos[nuevos.length - 1].timestamp;
      
        setConteo((prev) => ({
          ...prev,
          [canal || "whatsapp"]: prev[canal || "whatsapp"] + nuevos.length,
        }));
      }      
      
    } catch (err) {
      console.error("❌ Error en polling de nuevos mensajes:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMessages(true);
  }, [canal]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMensajesNuevos();
    }, 5000);

    return () => clearInterval(interval);
  }, [canal]);

  const canalIcons = {
    whatsapp: <SiWhatsapp className="inline text-green-400" />,
    facebook: <SiFacebook className="inline text-blue-400" />,
    voice: <SiMinutemailer className="inline text-purple-400" />,
    "": <FiGlobe className="inline text-white/70" />,
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6 text-white max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-indigo-300 flex items-center gap-2">
        {canalIcons[""]} Historial de Interacciones
      </h2>

      <div className="mb-4 text-sm text-white/70 flex flex-wrap gap-4">
        <span>{canalIcons.whatsapp} WhatsApp ({conteo.whatsapp})</span>
        <span>{canalIcons.facebook} Facebook ({conteo.facebook})</span>
        <span>{canalIcons.voice} Voz ({conteo.voice})</span>
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium text-white mr-2">Filtrar por canal:</label>
        <select
          value={canal}
          onChange={(e) => setCanal(e.target.value)}
          className="bg-white/10 border border-white/30 text-white px-4 py-2 rounded-md focus:outline-none"
        >
          <option value="">🌐 Todos</option>
          <option value="whatsapp">📲 WhatsApp</option>
          <option value="facebook">💬 Facebook</option>
          <option value="voice">📞 Voz</option>
        </select>
      </div>

      {loading ? (
        <p className="text-center text-white/60">Cargando mensajes...</p>
      ) : messages.length === 0 ? (
        <p className="text-center text-white/50">No hay mensajes recientes.</p>
      ) : (
        <>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {messages
              .slice()
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div className="w-full sm:max-w-2xl p-4 bg-white/5 border border-white/20 rounded-lg text-sm text-white">
                    <div className="flex justify-between text-white/60 text-xs mb-1">
                      <span>{format(new Date(msg.timestamp), "dd/MM/yyyy, HH:mm:ss")}</span>
                      <span>{msg.from_number || "anónimo"}</span>
                    </div>

                    <div className="font-medium text-white break-words whitespace-pre-wrap">
                      {msg.sender === "user" ? "👤 Cliente:" : "🤖 Bot:"} {msg.content}
                    </div>

                    {msg.emotion && (
                      <div className="text-purple-300 text-xs mt-1">
                        Emoción detectada: <span className="font-semibold">{msg.emotion}</span>
                      </div>
                    )}

                    {msg.intencion && (
                      <div className="text-green-400 text-xs mt-1">
                        🧠 Intención detectada: <span className="font-semibold">{msg.intencion}</span> (Nivel {msg.nivel_interes})
                      </div>
                    )}
                  </div>
                </div>
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={() => fetchMessages()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm"
              >
                Ver más
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
