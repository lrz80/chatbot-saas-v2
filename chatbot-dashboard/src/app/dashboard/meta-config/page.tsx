"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaFacebookF } from "react-icons/fa";
import TrainingHelp from "@/components/TrainingHelp";
import { BACKEND_URL } from "@/utils/api";

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_META_REDIRECT_URI!;

export default function MetaConfigPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const estadoFacebook = "❌ No conectado a Facebook";
  const estadoInstagram = "❌ No conectado a Instagram";

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: "include",
        });

        if (!res.ok) {
          console.error("❌ No autenticado");
          router.push("/login");
          return;
        }

        const data = await res.json();
        setTenantId(data.tenant_id);
      } catch (err) {
        console.error("❌ Error cargando tenant:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, [router]);

  if (loading || !tenantId) return null;

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=pages_show_list,pages_messaging,instagram_basic,instagram_manage_messages,instagram_messaging&response_type=code&state=${tenantId}&auth_type=rerequest`;

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
        <p className="text-white/80">
          Pulsa el botón para conectar tu Página de Facebook e Instagram Business.
        </p>

        <div className="mt-6 space-y-1 text-sm">
          <p><strong>Estado Facebook:</strong> {estadoFacebook}</p>
          <p><strong>Estado Instagram:</strong> {estadoInstagram}</p>
        </div>
      </div>
    </div>
  );
}
