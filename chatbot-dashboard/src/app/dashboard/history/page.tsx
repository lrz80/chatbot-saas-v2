// ✅ src/app/dashboard/history/page.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { BACKEND_URL } from "@/utils/api";
import { SiWhatsapp, SiFacebook, SiInstagram } from "react-icons/si";
import { FiGlobe, FiPhoneCall } from "react-icons/fi";
import type { ReactNode } from "react";
import { io, Socket } from 'socket.io-client';
import { useI18n } from "@/i18n/LanguageProvider";


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
  const { t } = useI18n();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canal, setCanal] = useState(""); // filtro seleccionado
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const lastIdRef = useRef<number | null>(null);
  const mensajesGlobalesRef = useRef<Msg[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // 👉 1) Calcula los contadores SOLO a partir de los mensajes cargados
  const conteo = messages.reduce(
    (acc, msg) => {
      const c = normalizeCanal(msg.canal);

      // Contamos todos los mensajes por canal, sin filtrar por role
      if (c === "whatsapp") acc.whatsapp += 1;
      if (c === "facebook") acc.facebook += 1;
      if (c === "instagram") acc.instagram += 1;
      if (c === "voice" || c === "voz") acc.voice += 1;

      return acc;
    },
    { whatsapp: 0, facebook: 0, instagram: 0, voice: 0 }
  );

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
      const mensajesUnicos = Array.from(
        new Map(merged.map((m) => [m.id, m])).values()
      );

      mensajesGlobalesRef.current = mensajesUnicos;

      // avanzar paginación de forma segura
      setPage((p) => (reset ? 2 : p + 1));
      setHasMore(nuevosMensajes.length === PAGE_SIZE);

      if (nuevosMensajes.length > 0) {
        lastIdRef.current = nuevosMensajes[nuevosMensajes.length - 1].id;
      }

      // aplicar filtro activo (por si acaso, aunque el backend ya filtra)
      const filtrados = canal
        ? mensajesUnicos.filter((m) => m.canal === canal)
        : mensajesUnicos;

      const ordenadosDesc = filtrados.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setMessages(ordenadosDesc);
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
        const mensajesUnicos = Array.from(
          new Map(todos.map((m) => [m.id, m])).values()
        );

        mensajesGlobalesRef.current = mensajesUnicos;

        const filtrados = canal
          ? mensajesUnicos.filter((m) => m.canal === canal)
          : mensajesUnicos;

        const ordenadosDesc = filtrados.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setMessages(ordenadosDesc);

        lastIdRef.current = nuevos[nuevos.length - 1].id;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal]);

  // Polling cada 5s
  useEffect(() => {
    const interval = setInterval(fetchMensajesNuevos, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal]);

  const canalIcons: Record<string, ReactNode> = {
    whatsapp: <SiWhatsapp className="inline text-green-400" />,
    facebook: <SiFacebook className="inline text-blue-400" />,
    instagram: <SiInstagram className="inline text-pink-400" />,
    voice: <FiPhoneCall className="inline text-purple-400" />,
    "": <FiGlobe className="inline text-white/70" />,
  };

  const currentIcon = canalIcons[canal as keyof typeof canalIcons] ?? canalIcons[""];

  // 🔌 Conexión en tiempo real con Socket.IO
  useEffect(() => {
    // Conecta al backend (BACKEND_URL debe ser algo como https://api.aamy.ai)
    const socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🟢 Socket conectado:', socket.id);
    });

    socket.on('message:new', (data) => {
      console.log('📩 Evento message:new recibido EN TIEMPO REAL:', data);

      const nuevo: Msg = {
        id: data.id ?? Date.now(), // fallback si no viene id
        timestamp: data.created_at ?? new Date().toISOString(),
        role: data.role,
        content: data.content,
        canal: normalizeCanal(data.canal),
        from_number: data.from_number,
      };

      // 🧠 1. Insertar en memoria global evitando duplicados
      const existe = mensajesGlobalesRef.current.some((m) => m.id === nuevo.id);
      if (!existe) {
        mensajesGlobalesRef.current = [
          nuevo,
          ...mensajesGlobalesRef.current,
        ];
      }

      // 🧩 2. Aplicar filtro activo
      const filtrados = canal
        ? mensajesGlobalesRef.current.filter((m) => m.canal === canal)
        : mensajesGlobalesRef.current;

      // 🕒 3. Ordenar por fecha descendente
      const ordenadosDesc = filtrados.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // 🎯 4. Render inmediato
      setMessages([...ordenadosDesc]);
    });

    socket.on('disconnect', () => {
      console.log('🔴 Socket desconectado');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] text-white px-4 py-6 sm:px-6 md:px-8">
      <div className="w-full max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md px-4 py-6 sm:p-8">

        {/* Título principal */}
        <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-indigo-300 flex items-center gap-2">
          {currentIcon} {t("history.title")}
        </h2>

        {/* Resumen por canal */}
        <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg text-xs sm:text-sm flex flex-wrap gap-4">
          <span>{canalIcons.whatsapp} {t("history.channels.whatsapp")} ({conteo.whatsapp})</span>
          <span>{canalIcons.facebook} {t("history.channels.facebook")} ({conteo.facebook})</span>
          <span>{canalIcons.instagram} {t("history.channels.instagram")} ({conteo.instagram})</span>
          <span>{canalIcons.voice} {t("history.channels.voice")} ({conteo.voice})</span>
        </div>

        {/* Filtro por canal */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-medium text-white sm:mr-2">
            {t("history.filter.label")}
          </label>
          <select
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
            className="bg-white/10 border border-white/30 text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">{t("history.filter.all")}</option>
            <option value="whatsapp">{t("history.filter.whatsapp")}</option>
            <option value="facebook">{t("history.filter.facebook")}</option>
            <option value="instagram">{t("history.filter.instagram")}</option>
            <option value="voice">{t("history.filter.voice")}</option>
          </select>
        </div>

        {/* Contenido principal */}
        {loading ? (
          <p className="text-center text-white/60 text-sm">{t("history.loading")}</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-white/50 text-sm">
            {t("history.empty")}
          </p>
        ) : (
          <>
            {/* Lista de mensajes con altura fija y scroll, similar a la vista previa de Meta */}
            <div className="space-y-3 sm:space-y-4 h-[60vh] sm:h-[65vh] md:h-[70vh] overflow-y-auto pr-1">
              {messages.map((msg) => {
                const isUser = msg.role?.toLowerCase() === "user";
                const isBot = msg.role?.toLowerCase() === "assistant";
                const icono = isUser ? "👤" : isBot ? "🤖" : "❓";
                const remitente = isUser
                  ? msg.nombre_cliente || t("history.sender.client")
                  : isBot
                  ? t("history.sender.assistant")
                  : t("history.sender.unknown");

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`
                        max-w-[85%] sm:max-w-[70%]
                        px-3 py-2 sm:p-3
                        rounded-lg
                        text-xs sm:text-sm
                        flex-shrink-0
                        border border-white/15
                        ${
                          isUser
                            ? "bg-indigo-400/20 self-start text-left"
                            : "bg-green-400/20 self-end text-left"
                        }
                      `}
                    >
                      {/* Fecha y número */}
                      <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-white/60 mb-1 gap-2">
                        <span>
                          {format(
                            new Date(msg.timestamp),
                            "dd/MM/yyyy, HH:mm:ss"
                          )}
                        </span>
                        <span className="truncate">
                          {!msg.nombre_cliente ? msg.from_number || t("history.sender.anonymous") : ""}
                        </span>
                      </div>

                      {/* Contenido del mensaje */}
                      <div className="font-medium text-white break-words whitespace-pre-wrap">
                        {icono} {remitente}: {msg.content}
                      </div>

                      {/* Emoción */}
                      {msg.emotion && (
                        <div className="text-purple-300 text-[11px] mt-1">
                          {t("history.emotion.label")}
                          <span className="font-semibold">{msg.emotion}</span>
                        </div>
                      )}

                      {/* Intención / nivel de interés */}
                      {msg.nivel_interes !== undefined &&
                        msg.nivel_interes !== null && (
                          <div className="text-green-300 text-[11px] mt-1">
                            {t("history.intent.label")}{" "}
                            <span className="font-semibold">
                              {t("history.intent.levelPrefix")} {msg.nivel_interes}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón "Ver más" */}
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={() => fetchMessages(false)}
                  disabled={loadingMore}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${
                    loadingMore
                      ? "bg-indigo-400/40 cursor-not-allowed text-white"
                      : "bg-indigo-500 hover:bg-indigo-600 text-white"
                  }`}
                >
                  {loadingMore ? t("history.more.loading") : t("history.more.cta")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
