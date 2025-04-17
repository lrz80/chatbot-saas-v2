"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { BACKEND_URL } from "@/utils/api"; // ✅ importa la constante

export default function MessageHistory() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canal, setCanal] = useState("");
  const [conteo, setConteo] = useState({
    whatsapp: 0,
    facebook: 0,
    voice: 0,
  });

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/messages?canal=${canal}`, {
          credentials: "include", // ✅ necesario para cookies httpOnly
        });

        if (!res.ok) throw new Error("Error al obtener mensajes");

        const data = await res.json();
        setMessages(data.mensajes);
        setLoading(false);

        const whatsappCount = data.filter((m: any) => m.canal === "whatsapp").length;
        const facebookCount = data.filter((m: any) => m.canal === "facebook").length;
        const voiceCount = data.filter((m: any) => m.canal === "voice").length;

        setConteo({ whatsapp: whatsappCount, facebook: facebookCount, voice: voiceCount });
      } catch (error) {
        console.error("❌ Error al obtener mensajes:", error);
        setLoading(false);
      }
    };

    fetchMessages();
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
                <p className="text-xs mt-1 text-right text-white/70">
                  {msg.canal?.toUpperCase() || "WHATSAPP"} •{" "}
                  {format(new Date(msg.timestamp), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
