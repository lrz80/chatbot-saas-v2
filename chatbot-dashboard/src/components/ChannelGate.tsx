// components/ChannelGate.tsx
"use client";
import { ReactNode } from "react";
import { useFeatures } from "@/hooks/usePlan";

type Props = {
  canal: "whatsapp" | "meta" | "voice" | "sms" | "email";
  children: ReactNode;
};

/**
 * Gate SOLO oculta/muestra children. No renderiza banners ni estado.
 * El banner y chip de estado los muestra ChannelStatus por separado.
 */
export default function ChannelGate({ canal, children }: Props) {
  const { loading, features } = useFeatures();
  if (loading) return null;
  const allowed = !!features?.[canal];
  if (!allowed) return null;       // 🔒 oculta todo el contenido del canal
  return <>{children}</>;
}
