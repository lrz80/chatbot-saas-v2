'use client';

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "@/utils/api";

/**
 * Hook compartido para tener una instancia de Socket.IO en el frontend.
 * Devuelve `Socket | null`. En el primer render puede ser null, así que
 * el componente que lo use debe verificarlo antes de usarlo.
 */
export function useSocket(): Socket | null {
  const socketRef = useRef<Socket | null>(null);

  // Crear el socket solo en cliente y solo una vez
  if (!socketRef.current && typeof window !== "undefined") {
    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    console.log("🔌 [useSocket] Socket creado:", socket.id);
  }

  // Cleanup al desmontar
  useEffect(() => {
    const socket = socketRef.current;

    return () => {
      if (socket) {
        console.log("🔌 [useSocket] Desconectando socket:", socket.id);
        socket.disconnect();
      }
    };
  }, []);

  return socketRef.current;
}
