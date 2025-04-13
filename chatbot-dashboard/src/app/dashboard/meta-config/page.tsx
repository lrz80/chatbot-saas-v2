"use client";

import { useTenant } from "@/context/TenantContext";
import { FaFacebookF } from "react-icons/fa";
import TrainingHelp from "@/components/TrainingHelp";

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_META_REDIRECT_URI!;

export default function MetaConfigPage() {
  const tenant = useTenant();

  const estadoFacebook = "❌ No conectado a Facebook";
  const estadoInstagram = "❌ No conectado a Instagram";

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=pages_messaging,pages_read_engagement,pages_manage_metadata,pages_show_list,pages_manage_posts,instagram_basic,instagram_manage_messages&response_type=code&state=${tenant?.id}`;

  return (
    <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaFacebookF className="text-[#1877F2]" size={28} />
        Configuración de Facebook e Instagram
      </h1>

      <TrainingHelp context="meta" />

      <a
        href={authUrl}
        className="inline-block mb-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
      >
        Conectar con Facebook e Instagram
      </a>

      <div className="space-y-6">
        <p className="text-white/80">Configuración deshabilitada temporalmente en el frontend.</p>

        <div className="mt-6 space-y-1 text-sm">
          <p><strong>Estado Facebook:</strong> {estadoFacebook}</p>
          <p><strong>Estado Instagram:</strong> {estadoInstagram}</p>
        </div>
      </div>
    </div>
  );
}
