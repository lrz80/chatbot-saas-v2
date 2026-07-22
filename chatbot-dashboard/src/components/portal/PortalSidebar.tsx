"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiBarChart2,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiHeadphones,
  FiHome,
  FiMap,
  FiMessageSquare,
  FiToggleRight,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { useI18n } from "@/i18n/LanguageProvider";

type PortalSidebarProps = {
  tenant: any;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
};

type PortalNavigationItem = {
  href: string;
  translationKey: string;
  icon: React.ReactNode;
  visible: boolean;
};

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/portal") {
    return pathname === "/portal";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isEnabled(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function hasVoiceChannel(tenant: any): boolean {
  return (
    isEnabled(tenant?.channel_flags?.voice) ||
    Boolean(tenant?.twilio_voice_number)
  );
}

function hasWhatsAppChannel(tenant: any): boolean {
  return (
    isEnabled(tenant?.channel_flags?.whatsapp) ||
    Boolean(tenant?.whatsapp_cloud_connected) ||
    Boolean(tenant?.whatsapp_twilio_connected)
  );
}

function hasMetaChannel(tenant: any): boolean {
  return isEnabled(tenant?.channel_flags?.meta);
}

function hasConversationChannel(tenant: any): boolean {
  return (
    hasVoiceChannel(tenant) ||
    hasWhatsAppChannel(tenant) ||
    hasMetaChannel(tenant)
  );
}

function hasBookingCapability(tenant: any): boolean {
  return (
    Boolean(tenant?.google_calendar_connected) ||
    Boolean(tenant?.square_connected) ||
    Boolean(tenant?.booking_enabled) ||
    Boolean(tenant?.appointment_enabled) ||
    Boolean(tenant?.channel_flags?.voice) ||
    Boolean(tenant?.channel_flags?.whatsapp) ||
    Boolean(tenant?.channel_flags?.meta)
  );
}

function hasFieldOperationsCapability(tenant: any): boolean {
  return (
    isEnabled(tenant?.field_operations_enabled) ||
    isEnabled(tenant?.route_optimization_enabled) ||
    isEnabled(tenant?.features?.field_operations) ||
    isEnabled(tenant?.features?.route_optimization) ||
    isEnabled(tenant?.modules?.field_operations) ||
    isEnabled(tenant?.portal_modules?.field_operations)
  );
}

export default function PortalSidebar({
  tenant,
  isOpen,
  onClose,
  onLogout,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const navigation: PortalNavigationItem[] = [
    {
      href: "/portal",
      translationKey: "portal.navigation.home",
      icon: <FiHome />,
      visible: true,
    },
    {
      href: "/portal/appointments",
      translationKey: "portal.navigation.appointments",
      icon: <FiCalendar />,
      visible: hasBookingCapability(tenant),
    },
    {
      href: "/portal/customers",
      translationKey: "portal.navigation.customers",
      icon: <FiUsers />,
      visible: true,
    },
    {
      href: "/portal/conversations",
      translationKey: "portal.navigation.conversations",
      icon: <FiMessageSquare />,
      visible: hasConversationChannel(tenant),
    },
    {
      href: "/portal/channels",
      translationKey: "portal.navigation.channels",
      icon: <FiToggleRight />,
      visible: true,
    },
    {
      href: "/portal/follow-up",
      translationKey: "portal.navigation.followUp",
      icon: <FiClock />,
      visible:
        isEnabled(tenant?.follow_up_enabled) ||
        isEnabled(tenant?.features?.follow_up) ||
        isEnabled(tenant?.modules?.follow_up),
    },
    {
      href: "/portal/routes",
      translationKey: "portal.navigation.routes",
      icon: <FiMap />,
      visible: hasFieldOperationsCapability(tenant),
    },
    {
      href: "/portal/business",
      translationKey: "portal.navigation.business",
      icon: <FiUser />,
      visible: true,
    },
    {
      href: "/portal/reports",
      translationKey: "portal.navigation.reports",
      icon: <FiBarChart2 />,
      visible: true,
    },
    {
      href: "/portal/plan",
      translationKey: "portal.navigation.plan",
      icon: <FiCreditCard />,
      visible: true,
    },
    {
      href: "/portal/support",
      translationKey: "portal.navigation.support",
      icon: <FiHeadphones />,
      visible: true,
    },
  ];

  const visibleNavigation = navigation.filter((item) => item.visible);

  const handleNavigation = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const businessName =
    tenant?.name ||
    tenant?.business_name ||
    t("sidebar.fallbackBusiness");

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label={t("portal.sidebar.close")}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-72 max-w-[85vw] flex-col",
          "border-r border-white/10",
          "bg-gradient-to-b from-[#171129] via-[#120f22] to-[#0d0b16]",
          "text-white shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            {tenant?.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={businessName}
                className="h-11 w-11 shrink-0 rounded-xl bg-white object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-lg font-bold">
                {businessName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-purple-300">
                {t("portal.sidebar.account")}
              </p>

              <p className="mt-1 truncate font-semibold">
                {businessName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("portal.sidebar.close")}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {visibleNavigation.map((item) => {
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavigation}
                className={[
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-950/30"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-lg transition-transform group-hover:scale-110",
                    active ? "text-white" : "text-purple-300",
                  ].join(" ")}
                >
                  {item.icon}
                </span>

                <span>{t(item.translationKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
          >
            {t("portal.sidebar.logout")}
          </button>
        </div>
      </aside>
    </>
  );
}