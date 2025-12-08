'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { TenantContext } from '@/context/TenantContext';
import MobileMenuButton from '@/components/MobileMenuButton';
import { BACKEND_URL } from '@/utils/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/settings`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          console.error('🔴 Error de autenticación:', res.status);
          router.push('/login');
          return;
        }

        const data = await res.json();
        console.log('✅ Datos recibidos desde /api/settings:', data);

        // Guardar estado del negocio + membresía
        setTenant({
          ...data.negocio,
          membresia_activa: data.membresia_activa,
          membresia_vigencia: data.membresia_vigencia,
        });

        setLoading(false);
      } catch (err) {
        console.error('❌ Error al verificar sesión:', err);
        router.push('/login');
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    document.cookie = 'token=; Max-Age=0; path=/';
    router.push('/login');
  };

  if (loading) return null;

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar
        tenant={tenant}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <TenantContext.Provider value={tenant}>
        <div className="flex-1 lg:ml-72">
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/10">
            <MobileMenuButton onClick={() => setSidebarOpen(true)} />
            <span className="w-8" /> {/* espacio vacío */}
          </div>
          <main className="p-6">{children}</main>
        </div>

      </TenantContext.Provider>
    </div>
  );
}
