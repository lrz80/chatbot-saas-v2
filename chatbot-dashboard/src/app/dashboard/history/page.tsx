"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { BACKEND_URL } from "@/utils/api";

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
      const pageToFetch = reset ? 1 : page;

      const res = await fetch(
        `${BACKEND_URL}/api/messages?canal=${canal}&page=${pageToFetch}&limit=${PAGE_SIZE}`,
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
        if (nuevosMensajes.length > 0) {
          lastTimestampRef.current = nuevosMensajes[nuevosMensajes.length - 1].timestamp;
        }
      } else {
        setMessages((prev) => [...prev, ...nuevosMensajes]);
        setPage((prev) => prev + 1);
        if (nuevosMensajes.length > 0) {
          lastTimestampRef.current = nuevosMensajes[nuevosMensajes.length - 1].timestamp;
        }
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

  // 🔄 Polling solo para mensajes nuevos
  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/messages?canal=${canal}&page=1&limit=5`,
          { credentials: "include" }
        );
        const data = await res.json();
        const nuevos = data.mensajes.sort(
          (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const ultFecha = lastTimestampRef.current;
        const nuevosFiltrados = ultFecha
          ? nuevos.filter(
              (msg: any) => new Date(msg.timestamp).getTime() > new Date(ultFecha).getTime()
            )
          : nuevos;

        if (nuevosFiltrados.length > 0) {
          setMessages((prev) => [...prev, ...nuevosFiltrados]);
          lastTimestampRef.current =
            nuevosFiltrados[nuevosFiltrados.length - 1].timestamp;
        }
      } catch (err) {
        console.error("❌ Error en polling de mensajes:", err);
      }
    }, 5000);

    return () => clearInterval(intervalo);
  }, [canal]);

  useEffect(() => {
    setLoading(true);
    fetchMessages(true); // reset al cambiar canal
  }, [canal]);

  return (
    <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
      <h2 className="text-3xl font-bold mb-6 text-indigo-300">🕓 Historial de Interacciones</h2>

      <div className="mb-4 text-sm text-white/70">
        📲 WhatsApp ({conteo.whatsapp}) | 💬 Facebook ({conteo.facebook}) | 📞 Voz ({conteo.voice})
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium text-white mr-2">Filtrar por canal:</label>
        <div className="inline-flex items-center bg-white/10 border border-white/30 rounded">
          <select
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
            className="bg-transparent text-white px-4 py-2 rounded appearance-none focus:outline-none"
          >
            <option value="">🌐 Todos</option>
            <option value="whatsapp">📲 WhatsApp</option>
            <option value="facebook">💬 Facebook</option>
            <option value="voice">📞 Voz</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-white/60">Cargando mensajes...</p>
      ) : messages.length === 0 ? (
        <p className="text-center text-white/50">No hay mensajes recientes.</p>
      ) : (
        <>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-xl shadow text-sm ${
                    msg.sender === "user"
                      ? "bg-white/20 text-white"
                      : "bg-indigo-500/70 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {msg.sender === "user" && msg.from_number && (
                    <p className="text-xs text-white/50 mt-1">📞 {msg.from_number}</p>
                  )}

                  <p className="text-xs mt-1 text-right text-white/70">
                    {msg.canal?.toUpperCase() || "WHATSAPP"} •{" "}
                    {format(new Date(msg.timestamp), "dd/MM/yyyy HH:mm")}
                  </p>
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
