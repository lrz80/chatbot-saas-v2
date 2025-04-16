"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api"; // ✅ Asegúrate que este archivo existe

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/messages`, {
          credentials: "include", // ✅ necesaria para cookies httpOnly
        });
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  if (loading) return <p className="text-white">Cargando mensajes...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-white">💬 Historial de Mensajes</h2>
      <div className="bg-white/10 rounded shadow p-4 space-y-4 text-white">
        {messages.length === 0 ? (
          <p className="text-gray-400">No hay mensajes todavía.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="border-b border-white/20 pb-2">
              <p className="text-sm text-white/60">{new Date(msg.timestamp).toLocaleString()}</p>
              <p>
                <span className="font-bold">{msg.sender === "user" ? "👤 Cliente" : "🤖 Bot"}:</span>{" "}
                {msg.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
