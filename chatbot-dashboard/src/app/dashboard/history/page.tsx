// ✅ src/app/dashboard/history/page.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { BACKEND_URL } from "@/utils/api";
import {
  SiWhatsapp,
  SiFacebook,
  SiMinutemailer,
  SiInstagram,
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
  const lastIdRef = useRef<number | null>(null);

  const [conteo, setConteo] = useState({
    whatsapp: 0,
    facebook: 0,
    instagram: 0,
    voice: 0,
  });  

  const mensajesGlobalesRef = useRef<any[]>([]); // ✅ global

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
      ).map(m => ({
        ...m,
        canal: (m.canal || '').toString().trim().toLowerCase(), // normalizar
      }));

      let mensajesActuales = reset ? [...nuevosMensajes] : [...mensajesGlobalesRef.current, ...nuevosMensajes];

      // ✅ quitar duplicados por ID
      const mensajesUnicos = Array.from(new Map(mensajesActuales.map(m => [m.id, m])).values());

      mensajesGlobalesRef.current = mensajesUnicos; // actualizar referencia global
      setPage(reset ? 2 : page + 1);

      if (nuevosMensajes.length > 0) {
        lastIdRef.current = nuevosMensajes[nuevosMensajes.length - 1].id;
        lastTimestampRef.current = nuevosMensajes[nuevosMensajes.length - 1].timestamp;
      }

      setHasMore(nuevosMensajes.length === PAGE_SIZE);

      // ✅ aplicar filtro activo
      const mensajesFiltrados = canal
        ? mensajesUnicos.filter((m) => m.canal === canal)
        : mensajesUnicos;

      const mensajesOrdenadosDesc = mensajesFiltrados.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setMessages(mensajesOrdenadosDesc);      

      setLoading(false);
    } catch (error) {
      console.error("❌ Error al obtener mensajes:", error);
      setLoading(false);
    }
  };
    
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
  
  const fetchMensajesNuevos = async () => {
    try {
      if (!lastIdRef.current) return;
  
      const res = await fetch(
        `${BACKEND_URL}/api/messages/nuevos?canal=${canal}&lastId=${lastIdRef.current}`,
        { credentials: "include" }
      );
      if (!res.ok) return;
  
      const data = await res.json();
      const nuevos = data.mensajes || [];
  
      if (nuevos.length > 0) {
        const todos = [...mensajesGlobalesRef.current, ...nuevos];
        const mensajesUnicos = Array.from(
          new Map(todos.map(m => [m.id, {
            ...m,
            canal: (m.canal || '').toString().trim().toLowerCase(),
          }])).values()
        );
  
        const filtradosPorCanal = canal
          ? mensajesUnicos.filter(m => m.canal === canal)
          : mensajesUnicos;
  
        mensajesGlobalesRef.current = mensajesUnicos;
        const ordenadosDesc = filtradosPorCanal.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setMessages(ordenadosDesc);
        
        lastIdRef.current = nuevos[nuevos.length - 1].id;

        // ✅ Actualiza conteo desde backend real
        await fetchConteoGlobal();
      }
    } catch (err) {
      console.error("❌ Error en polling de nuevos mensajes:", err);
    }
  };  
  
  useEffect(() => {
    setLoading(true);
    setMessages([]); // 🧼 limpia mensajes anteriores al cambiar de canal
    lastIdRef.current = null;
    fetchMessages(true);
    fetchConteoGlobal();
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
    instagram: <SiInstagram className="inline text-pink-400" />,
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
                const remitente = isUser
                  ? msg.nombre_cliente || "Cliente"
                  : isBot
                    ? "Amy"
                    : "Desconocido";

                return (
                  <div key={msg.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                    <div className="w-full sm:max-w-2xl p-4 bg-white/5 border border-white/20 rounded-lg text-sm text-white">
                      <div className="flex justify-between text-white/60 text-xs mb-1">
                        <span>{format(new Date(msg.timestamp), "dd/MM/yyyy, HH:mm:ss")}</span>
                        {/* Solo mostrar el número si no hay nombre del cliente */}
                        <span>{!msg.nombre_cliente ? msg.from_number || "anónimo" : ""}</span>
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
                          🧠 Intención detectada: <span className="font-semibold">{msg.intencion}</span> (Nivel {msg.nivel_interes})
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
