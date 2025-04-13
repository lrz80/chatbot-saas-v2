"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { TenantContext } from "@/context/TenantContext";
import MobileMenuButton from "@/components/MobileMenuButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    // Si implementas logout desde backend, agrégalo aquí
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar fijo */}
      <Sidebar
        user={null}
        tenant={tenant}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Contenido principal */}
      <TenantContext.Provider value={tenant}>
        <div className="flex-1 lg:ml-72">
          {/* Header para móvil */}
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
