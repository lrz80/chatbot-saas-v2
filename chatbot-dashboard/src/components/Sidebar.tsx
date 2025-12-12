'use client';

import {
  FiHome, FiUser, FiCalendar, FiMic, FiClock, FiMail, FiUsers, FiMessageSquare,
} from 'react-icons/fi';
import { FaWhatsapp, FaFacebookMessenger } from 'react-icons/fa';
import ClientOnly from './ClientOnly';
import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/utils/api';

export default function Sidebar({ onLogout, isOpen, onClose }: any) {
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/settings`, { credentials: 'include' });
        if (!res.ok) throw new Error('Error al cargar datos del tenant');
        setTenant(await res.json());
      } catch (err) {
        console.error('❌ Error al cargar tenant:', err);
      }
    })();
  }, []);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={[
          // posicionamiento del drawer
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw]',
          // alto móvil real (dvh); fallback a 100dvh
          'h-[100dvh]',
          // estilo
          'bg-gradient-to-b from-[#5b21b6]/40 to-[#9333ea]/30 backdrop-blur-xl',
          'border-r border-white/10 shadow-[0_0_20px_2px_rgba(147,51,234,0.3)]',
          'text-white',
          // layout
          'flex flex-col',
          // animación
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
      >
        {/* Contenido scrollable */}
        <div
          className="flex-1 overflow-y-auto px-6 pt-6 pb-28"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
        >
          <div className="flex items-center gap-4 mb-10">
            {tenant?.logo_url ? (
              <div className="w-12 h-12 rounded-full bg-white p-[2px] shadow-inner">
                <img src={tenant.logo_url} alt="Logo" className="w-full h-full rounded-full object-cover" />
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

          <h2 className="text-xl font-bold mb-6 text-purple-300 hidden lg:block">Panel AI</h2>

          <nav className="space-y-2 text-sm font-medium">
            {[
              { href: '/dashboard', icon: <FiHome />, label: 'Inicio' },
              { href: '/dashboard/profile', icon: <FiUser />, label: 'Perfil del Negocio' },
              { href: '/dashboard/training', icon: <FaWhatsapp className="text-white" />, label: 'Asistente de WhatsApp' },
              { href: '/dashboard/meta-config', icon: <FaFacebookMessenger className="text-white" />, label: 'Asistente de Meta' },
              { href: '/dashboard/voice-config', icon: <FiMic />, label: 'Asistente de Voz' },
              { href: '/dashboard/history', icon: <FiClock />, label: 'Historial de Mensajes' },
              { href: '/dashboard/appointments', icon: <FiCalendar />, label: 'Citas agendadas' },
              { href: '/dashboard/follow-up', icon: <FiUsers />, label: 'Seguimiento de Leads' },
              { href: '/dashboard/campaigns/sms', icon: <FiMessageSquare />, label: 'Campañas SMS' },
              { href: '/dashboard/campaigns/email', icon: <FiMail />, label: 'Campañas Email' },
            ].map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 hover:pl-5 transition-all rounded-lg group"
              >
                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Footer sticky con safe-area: botón siempre visible y pulsable */}
        <div
          className="sticky left-0 right-0 px-6 pb-4 pt-3 bg-gradient-to-t from-[#1D0A2B] to-transparent"
          style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <ClientOnly>
            <button
              onClick={onLogout}
              className="w-full rounded-2xl py-3 font-medium shadow bg-red-600 hover:bg-red-700 text-white"
            >
              Cerrar sesión
            </button>
          </ClientOnly>
        </div>
      </aside>
    </>
  );
}
