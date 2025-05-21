'use client';

import {
  FiHome,
  FiUser,
  FiLogOut,
  FiMic,
  FiClock,
  FiMail,
  FiUsers,
  FiMessageSquare,
} from 'react-icons/fi';
import { FaWhatsapp, FaFacebookMessenger } from 'react-icons/fa';
import ClientOnly from './ClientOnly';
import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/utils/api';

export default function Sidebar({ onLogout, isOpen, onClose }: any) {
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Error al cargar datos del tenant');
        const data = await res.json();
        setTenant(data);
      } catch (err) {
        console.error('❌ Error al cargar tenant:', err);
      }
    };

    fetchTenant();
  }, []);

  return (
    <>
      {isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/60 z-40 lg:hidden" />}

      <aside
        className={`fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-[#5b21b6]/40 to-[#9333ea]/30 backdrop-blur-xl border-r border-white/10 shadow-[0_0_20px_2px_rgba(147,51,234,0.3)] text-white p-6 z-50 flex flex-col justify-between transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div>
          <div className="flex items-center gap-4 mb-10">
            {tenant?.logo_url ? (
              <div className="w-12 h-12 rounded-full bg-white p-[2px] shadow-inner">
                <img
                  src={tenant.logo_url}
                  alt="Logo"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/20 text-white font-bold flex items-center justify-center rounded-full text-xl shadow-inner">
                {(tenant?.owner_name || tenant?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm text-white/70">Bienvenido</p>
              <p className="font-semibold text-lg leading-tight truncate max-w-[160px]">
                {tenant?.name || 'Negocio'}
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-6 text-purple-300 block lg:block hidden">Panel AI</h2>

          <nav className="space-y-2 text-sm font-medium">
            {[
              { href: '/dashboard', icon: <FiHome />, label: 'Inicio' },
              { href: '/dashboard/profile', icon: <FiUser />, label: 'Perfil del Negocio' },
              { href: '/dashboard/training', icon: <FaWhatsapp className="text-white" />, label: 'Asistente de WhatsApp' },
              { href: '/dashboard/meta-config', icon: <FaFacebookMessenger className="text-white" />, label: 'Asistente de Meta' },
              { href: '/dashboard/voice-config', icon: <FiMic />, label: 'Asistente de Voz' },
              { href: '/dashboard/history', icon: <FiClock />, label: 'Historial de Mensajes' },
              { href: '/dashboard/follow-up', icon: <FiUsers />, label: 'Seguimiento de Leads' },
              { href: '/dashboard/campaigns/sms', icon: <FiMessageSquare />, label: 'Campañas SMS' },
              { href: '/dashboard/campaigns/email', icon: <FiMail />, label: 'Campañas Email' },
            ].map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 hover:pl-5 transition-all rounded-lg group"
              >
                <span className="group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-8">
          <ClientOnly>
            <button
              onClick={onLogout}
              className="flex items-center gap-3 p-2 hover:bg-red-600/80 bg-white/5 rounded w-full text-left transition-all"
            >
              <FiLogOut />
              Cerrar sesión
            </button>
          </ClientOnly>
        </div>
      </aside>
    </>
  );
}
