"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { TenantContext } from "@/context/TenantContext";
import MobileMenuButton from "@/components/MobileMenuButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/settings");

        if (!res.ok) {
          router.push("/login"); // 🔒 No autenticado
          return;
        }

        const data = await res.json();

        if (!data.membresia_activa) {
          router.push("/upgrade"); // ⛔ Sin plan activo
          return;
        }

        setTenant(data);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error verificando autenticación:", err);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    // Agrega lógica de logout si luego usas auth de backend
    router.push("/login");
  };

  if (loading) return null; // Evita parpadeo mientras carga

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <Sidebar
        user={null}
        tenant={tenant}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <TenantContext.Provider value={tenant}>
        <div className="flex-1 lg:ml-72">
          {/* Header móvil */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/10">
            <MobileMenuButton onClick={() => setSidebarOpen(true)} />
            <p className="text-white text-lg font-semibold">Panel AI</p>
          </div>

          <main className="p-6">{children}</main>
        </div>
      </TenantContext.Provider>
    </div>
  );
}
