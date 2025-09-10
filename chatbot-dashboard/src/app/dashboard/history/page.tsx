// ✅ src/app/dashboard/history/page.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { BACKEND_URL } from "@/utils/api";
import { SiWhatsapp, SiFacebook, SiInstagram } from "react-icons/si";
import { FiGlobe, FiPhoneCall } from "react-icons/fi";
import type { ReactNode } from 'react';

const PAGE_SIZE = 10;

type Msg = {
  id: number;
  timestamp: string;
  role?: string;
  content: string;
  canal?: string;
  nombre_cliente?: string;
  from_number?: string;
  emotion?: string;
  intencion?: string;
  nivel_interes?: string | number;
};

const normalizeCanal = (c?: string) => (c || "").toString().trim().toLowerCase();

export default function MessageHistory() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canal, setCanal] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const lastIdRef = useRef<number | null>(null);
  const mensajesGlobalesRef = useRef<Msg[]>([]);

  const [conteo, setConteo] = useState({
    whatsapp: 0,
    facebook: 0,
    instagram: 0,
    voice: 0,
  });

  const fetchConteoGlobal = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/conteo`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al obtener conteo global");
      const data = await res.json();
      setConteo(data);
    } catch (err) {
      console.error("❌ Error en conteo global:", err);
    }
  };

  const fetchMessages = async (reset = false) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const pageToFetch = reset ? 1 : page;

      const res = await fetch(
        `${BACKEND_URL}/api/messages?canal=${canal}&page=${pageToFetch}&limit=${PAGE_SIZE}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Error al obtener mensajes");

      const data = await res.json();
      const nuevosMensajes: Msg[] = (data.mensajes || [])
        .sort(
          (a: Msg, b: Msg) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        .map((m: Msg) => ({ ...m, canal: normalizeCanal(m.canal) }));

      // merge + dedupe por id
      const base = reset ? [] : mensajesGlobalesRef.current;
      const merged = [...base, ...nuevosMensajes];
      const mensajesUnicos = Array.from(new Map(merged.map((m) => [m.id, m])).values());

      mensajesGlobalesRef.current = mensajesUnicos;

      // avanzar paginación de forma segura
      setPage((p) => (reset ? 2 : p + 1));
      setHasMore(nuevosMensajes.length === PAGE_SIZE);

      if (nuevosMensajes.length > 0) {
        lastIdRef.current = nuevosMensajes[nuevosMensajes.length - 1].id;
      }

      // aplicar filtro activo (el backend ya filtra por canal, pero dejamos por si acaso)
      const filtrados = canal
        ? mensajesUnicos.filter((m) => m.canal === canal)
        : mensajesUnicos;

      const ordenadosDesc = filtrados.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setMessages(ordenadosDesc);
      await fetchConteoGlobal();
    } catch (error) {
      console.error("❌ Error al obtener mensajes:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchMensajesNuevos = async () => {
    try {
      if (!lastIdRef.current) return;

      const res = await fetch(
        `${BACKEND_URL}/api/messages/nuevos?canal=${canal}&lastId=${lastIdRef.current}`,
        { credentials: "include" }
      );
      if (!res.ok) return;

      const data = await res.json();
      const nuevos: Msg[] = (data.mensajes || []).map((m: Msg) => ({
        ...m,
        canal: normalizeCanal(m.canal),
      }));

      if (nuevos.length > 0) {
        const todos = [...mensajesGlobalesRef.current, ...nuevos];
        const mensajesUnicos = Array.from(new Map(todos.map((m) => [m.id, m])).values());

        mensajesGlobalesRef.current = mensajesUnicos;

        const filtrados = canal
          ? mensajesUnicos.filter((m) => m.canal === canal)
          : mensajesUnicos;

        const ordenadosDesc = filtrados.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setMessages(ordenadosDesc);

        lastIdRef.current = nuevos[nuevos.length - 1].id;
        await fetchConteoGlobal();
      }
    } catch (err) {
      console.error("❌ Error en polling de nuevos mensajes:", err);
    }
  };

  // Carga inicial + cuando cambia el canal
  useEffect(() => {
    setMessages([]);
    mensajesGlobalesRef.current = [];
    lastIdRef.current = null;
    setPage(1);
    setHasMore(true);
    fetchMessages(true);
  }, [canal]);

  // Polling cada 5s
  useEffect(() => {
    const interval = setInterval(fetchMensajesNuevos, 5000);
    return () => clearInterval(interval);
  }, [canal]);

  const canalIcons: Record<string, ReactNode> = {
    whatsapp: <SiWhatsapp className="inline text-green-400" />,
    facebook: <SiFacebook className="inline text-blue-400" />,
    instagram: <SiInstagram className="inline text-pink-400" />,
    voice: <FiPhoneCall className="inline text-purple-400" />,
    "": <FiGlobe className="inline text-white/70" />,
  };  

  const currentIcon = canalIcons[canal as keyof typeof canalIcons] ?? canalIcons[""];

  return (
    <div className="w-full px-4 sm:px-6 py-6 text-white max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-indigo-300 flex items-center gap-2">
        {currentIcon} Historial de Interacciones
      </h2>

      <div className="mb-4 text-sm text-white/70 flex flex-wrap gap-4">
        <span>{canalIcons.whatsapp} WhatsApp ({conteo.whatsapp})</span>
        <span>{canalIcons.facebook} Facebook ({conteo.facebook})</span>
        <span>{canalIcons.instagram} Instagram ({conteo.instagram})</span>
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
          <option value="instagram">📸 Instagram</option>
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
            {messages.map((msg) => {
              const isUser = msg.role?.toLowerCase() === "user";
              const isBot = msg.role?.toLowerCase() === "assistant";
              const icono = isUser ? "👤" : isBot ? "🤖" : "❓";
              const remitente = isUser ? (msg.nombre_cliente || "Cliente") : isBot ? "Amy" : "Desconocido";

              return (
                <div key={msg.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                  <div className="w-full sm:max-w-2xl p-4 bg-white/5 border border-white/20 rounded-lg text-sm text-white">
                    <div className="flex justify-between text-white/60 text-xs mb-1">
                      <span>{format(new Date(msg.timestamp), "dd/MM/yyyy, HH:mm:ss")}</span>
                      <span>{!msg.nombre_cliente ? (msg.from_number || "anónimo") : ""}</span>
                    </div>

                    <div className="font-medium text-white break-words whitespace-pre-wrap">
                      {icono} {remitente}: {msg.content}
                    </div>

                    {msg.emotion && (
                      <div className="text-purple-300 text-xs mt-1">
                        Emoción detectada: <span className="font-semibold">{msg.emotion}</span>
                      </div>
                    )}

                    {msg.intencion && (
                      <div className="text-green-400 text-xs mt-1">
                        🧠 Intención detectada:{" "}
                        <span className="font-semibold">{msg.intencion}</span>
                        {msg.nivel_interes !== undefined ? ` (Nivel ${msg.nivel_interes})` : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={() => fetchMessages(false)}
                disabled={loadingMore}
                className={`px-4 py-2 rounded-xl text-sm ${
                  loadingMore
                    ? "bg-indigo-400/40 cursor-not-allowed text-white"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                }`}
              >
                {loadingMore ? "Cargando..." : "Ver más"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
