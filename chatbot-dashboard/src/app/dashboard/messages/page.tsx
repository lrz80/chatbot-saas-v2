"use client";

import { useEffect, useState } from "react";

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
        const res = await fetch("/api/messages");
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

  if (loading) return <p>Cargando mensajes...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">💬 Historial de Mensajes</h2>
      <div className="bg-white rounded shadow p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-gray-500">No hay mensajes todavía.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="border-b pb-2">
              <p className="text-sm text-gray-600">{new Date(msg.timestamp).toLocaleString()}</p>
              <p>
                <span className="font-bold">{msg.sender === "user" ? "Cliente" : "Bot"}:</span>{" "}
                {msg.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
