"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/calls`, {
          credentials: "include",
        });
        const data = await res.json();
        setCalls(data);
      } catch (err) {
        console.error("❌ Error cargando llamadas:", err);
      }
    };
    fetchCalls();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-indigo-600 mb-4">📞 Historial de Llamadas</h2>
      {calls.length === 0 ? (
        <p className="text-gray-500">No hay llamadas registradas aún.</p>
      ) : (
        <div className="space-y-6">
          {calls.map((msg, i) => (
            <div key={i} className="bg-white p-4 rounded shadow">
              <p className="text-sm text-gray-400">
                {new Date(msg.created_at).toLocaleString()}
              </p>
              <p className={`mt-2 ${msg.sender === "user" ? "text-indigo-600" : "text-green-700"}`}>
                <strong>{msg.sender === "user" ? "Cliente dijo:" : "Bot respondió:"}</strong><br />
                {msg.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
