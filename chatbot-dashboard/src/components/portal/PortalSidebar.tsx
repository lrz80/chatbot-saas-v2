//src/components/portal/PortalSidebar.tsx
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
  module?: string;
};

function normalizeEnabledModules(tenant: any): Set<string> | null {
  const source =
    tenant?.portal_modules ??
    tenant?.enabled_modules ??
    tenant?.features ??
    tenant?.modules;

  if (!source) {
    return null;
  }

  if (Array.isArray(source)) {
    return new Set(
      source
        .map((value) => {
          if (typeof value === "string") {
            return value;
          }

          if (
            value &&
            typeof value === "object" &&
            typeof value.key === "string" &&
            value.enabled !== false
          ) {
            return value.key;
          }

          return null;
        })
        .filter((value): value is string => Boolean(value))
    );
  }

  if (typeof source === "object") {
    return new Set(
      Object.entries(source)
        .filter(([, enabled]) => enabled === true)
        .map(([key]) => key)
    );
  }

  return null;
}

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/portal") {
    return pathname === "/portal";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PortalSidebar({
  tenant,
  isOpen,
  onClose,
  onLogout,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const enabledModules = normalizeEnabledModules(tenant);

  const navigation: PortalNavigationItem[] = [
    {
      href: "/portal",
      translationKey: "portal.navigation.home",
      icon: <FiHome />,
    },
    {
      href: "/portal/appointments",
      translationKey: "portal.navigation.appointments",
      icon: <FiCalendar />,
      module: "appointments",
    },
    {
      href: "/portal/customers",
      translationKey: "portal.navigation.customers",
      icon: <FiUsers />,
      module: "crm",
    },
    {
      href: "/portal/conversations",
      translationKey: "portal.navigation.conversations",
      icon: <FiMessageSquare />,
      module: "conversations",
    },
    {
      href: "/portal/follow-up",
      translationKey: "portal.navigation.followUp",
      icon: <FiClock />,
      module: "follow_up",
    },
    {
      href: "/portal/routes",
      translationKey: "portal.navigation.routes",
      icon: <FiMap />,
      module: "field_operations",
    },
    {
      href: "/portal/reports",
      translationKey: "portal.navigation.reports",
      icon: <FiBarChart2 />,
      module: "reports",
    },
    {
      href: "/portal/plan",
      translationKey: "portal.navigation.plan",
      icon: <FiCreditCard />,
      module: "billing",
    },
    {
      href: "/portal/support",
      translationKey: "portal.navigation.support",
      icon: <FiHeadphones />,
    },
  ];

  const visibleNavigation = navigation.filter((item) => {
    if (!item.module) {
      return true;
    }

    /*
     * Mientras el backend todavía no entregue módulos,
     * mostramos las funciones genéricas del portal.
     *
     * Cuando portal_modules exista, el menú se filtra automáticamente.
     */
    if (!enabledModules) {
      return true;
    }

    return enabledModules.has(item.module);
  });

  const handleNavigation = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

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
          "border-r border-white/10 bg-[#111111] text-white shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            {tenant?.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant?.name ?? ""}
                className="h-11 w-11 rounded-xl bg-white object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-lg font-bold">
                {(tenant?.name ?? "A").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm text-white/60">
                {t("portal.sidebar.account")}
              </p>

              <p className="truncate font-semibold">
                {tenant?.name ?? tenant?.business_name ?? ""}
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
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-purple-600 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <span className="text-lg">{item.icon}</span>
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