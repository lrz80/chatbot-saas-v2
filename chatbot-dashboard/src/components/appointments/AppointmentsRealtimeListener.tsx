//src/components/appointments/AppoinmentsRealtimeListener.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
// Reutiliza tu contexto/hook de socket que ya usas para message:new
import { useSocket } from "@/hooks/useSocket"; // ajusta la ruta a como la tengas

type Props = {
  tenantId?: string;
};

export function AppointmentsRealtimeListener({ tenantId }: Props) {
  const socket = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    const handler = (payload: any) => {
      // Opcional: filtrar por tenant
      if (tenantId && payload?.tenantId && payload.tenantId !== tenantId) {
        return;
      }

      console.log("🔔 appointment:new recibido en frontend:", payload);

      // Opción A: recargar solo los datos del server component
      router.refresh();

      // Opción B (si usas SWR en esta página):
      // mutate("/api/appointments");
    };

    socket.on("appointment:new", handler);
    return () => {
      socket.off("appointment:new", handler);
    };
  }, [socket, router, tenantId]);

  return null; // no renderiza nada
}
