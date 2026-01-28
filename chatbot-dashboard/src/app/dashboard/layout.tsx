'use client';

import {
  FiHome, FiUser, FiCalendar, FiMic, FiClock, FiMail, FiUsers, FiMessageSquare,
} from 'react-icons/fi';
import { FaWhatsapp, FaFacebookMessenger } from 'react-icons/fa';
import ClientOnly from '@/components/ClientOnly';
import { useMemo } from 'react';
import { BACKEND_URL } from '@/utils/api';
import { useI18n } from '../../i18n/LanguageProvider';

type SidebarProps = {
  tenant?: any;
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ tenant, isOpen, onClose }: SidebarProps) {
  const { t } = useI18n();

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      // ⛔ mata cualquier estado React / Next / cache
      window.location.replace('/login');
    }
  };

  const navItems = useMemo(
    () => [
      { href: '/dashboard', icon: <FiHome />, labelKey: 'sidebar.nav.home' },
      { href: '/dashboard/profile', icon: <FiUser />, labelKey: 'sidebar.nav.businessProfile' },
      { href: '/dashboard/training', icon: <FaWhatsapp className="text-white" />, labelKey: 'sidebar.nav.whatsappAssistant' },
      { href: '/dashboard/meta-config', icon: <FaFacebookMessenger className="text-white" />, labelKey: 'sidebar.nav.metaAssistant' },
      { href: '/dashboard/voice-config', icon: <FiMic />, labelKey: 'sidebar.nav.voiceAssistant' },
      { href: '/dashboard/history', icon: <FiClock />, labelKey: 'sidebar.nav.messageHistory' },
      { href: '/dashboard/appointments', icon: <FiCalendar />, labelKey: 'sidebar.nav.calendar' },
      { href: '/dashboard/follow-up', icon: <FiUsers />, labelKey: 'sidebar.nav.leadFollowUp' },
      { href: '/dashboard/campaigns/sms', icon: <FiMessageSquare />, labelKey: 'sidebar.nav.smsCampaigns' },
      { href: '/dashboard/campaigns/email', icon: <FiMail />, labelKey: 'sidebar.nav.emailCampaigns' },
    ],
    []
  );

  const fallbackLetter = (tenant?.owner_name || tenant?.email || t('sidebar.fallbackUserLetter'))
    .charAt(0)
    .toUpperCase();

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          aria-label={t('sidebar.closeMenuAria')}
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
                <img
                  src={tenant.logo_url}
                  alt={t('sidebar.logoAlt')}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/20 text-white font-bold flex items-center justify-center rounded-full text-xl shadow-inner">
                {fallbackLetter}
              </div>
            )}

            <div>
              <p className="text-sm text-white/70">{t('sidebar.welcome')}</p>
              <p className="font-semibold text-lg leading-tight truncate max-w-[160px]">
                {tenant?.name || t('sidebar.fallbackBusiness')}
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-6 text-purple-300 hidden lg:block">
            {t('sidebar.title')}
          </h2>

          <nav className="space-y-2 text-sm font-medium">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 hover:pl-5 transition-all rounded-lg group"
              >
                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                {t(item.labelKey)}
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
              onClick={handleLogout}
              className="w-full rounded-2xl py-3 font-medium shadow bg-red-600 hover:bg-red-700 text-white"
            >
              {t('sidebar.logout')}
            </button>
          </ClientOnly>
        </div>
      </aside>
    </>
  );
}
