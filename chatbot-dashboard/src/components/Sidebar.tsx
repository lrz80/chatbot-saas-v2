"use client";

import {
  FiBarChart2,
  FiCalendar,
  FiChevronDown,
  FiClock,
  FiHome,
  FiList,
  FiMail,
  FiMessageSquare,
  FiMic,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { FaFacebookMessenger, FaWhatsapp } from "react-icons/fa";
import ClientOnly from "./ClientOnly";
import { useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useI18n } from "../i18n/LanguageProvider";

type SidebarProps = {
  onLogout?: () => void;
  isOpen: boolean;
  onClose: () => void;
};

type MenuItem = {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
};

type CollapsibleMenuProps = {
  title: string;
  icon: React.ReactNode;
  items: MenuItem[];
  pathname: string;
  defaultOpen?: boolean;
  onNavigate: () => void;
};

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function CollapsibleMenu({
  title,
  icon,
  items,
  pathname,
  defaultOpen = false,
  onNavigate,
}: CollapsibleMenuProps) {
  const hasActiveItem = useMemo(
    () => items.some((item) => isRouteActive(pathname, item.href)),
    [items, pathname]
  );

  const [open, setOpen] = useState(defaultOpen || hasActiveItem);

  useEffect(() => {
    if (hasActiveItem) {
      setOpen(true);
    }
  }, [hasActiveItem]);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={[
          "flex w-full items-center justify-between rounded-lg p-3 transition-all",
          hasActiveItem
            ? "bg-white/15 text-white"
            : "bg-white/5 text-white hover:bg-white/10",
        ].join(" ")}
      >
        <span className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span>{title}</span>
        </span>

        <FiChevronDown
          className={[
            "transition-transform duration-200",
            open ? "rotate-180" : "rotate-0",
          ].join(" ")}
        />
      </button>

      <div
        className={[
          "grid overflow-hidden transition-all duration-200",
          open
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="min-h-0">
          <div className="ml-4 mt-1 space-y-1 border-l border-white/15 pl-3">
            {items.map((item) => {
              const active = isRouteActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={[
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
                    active
                      ? "bg-white/20 font-semibold text-white"
                      : "text-white/80 hover:bg-white/10 hover:pl-4 hover:text-white",
                  ].join(" ")}
                >
                  <span className="transition-transform group-hover:scale-110">
                    {item.icon}
                  </span>

                  <span>{item.labelKey}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const [tenant, setTenant] = useState<any>(null);

  const pathname = usePathname();
  const { t } = useI18n();

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.replace("/login");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadTenant = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setTenant(data);
        }
      } catch (error) {
        console.error("❌ Error al cargar tenant:", error);
      }
    };

    void loadTenant();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavigation = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const channelsItems: MenuItem[] = [
    {
      href: "/dashboard/training",
      icon: <FaWhatsapp />,
      labelKey: t("sidebar.nav.whatsappAssistant"),
    },
    {
      href: "/dashboard/meta-config",
      icon: <FaFacebookMessenger />,
      labelKey: t("sidebar.nav.metaAssistant"),
    },
    {
      href: "/dashboard/voice-config",
      icon: <FiMic />,
      labelKey: t("sidebar.nav.voiceAssistant"),
    },
  ];

  const crmItems: MenuItem[] = [
    {
      href: "/dashboard/contacts",
      icon: <FiUsers />,
      labelKey: t("sidebar.nav.contacts"),
    },
    {
      href: "/dashboard/history",
      icon: <FiClock />,
      labelKey: t("sidebar.nav.messageHistory"),
    },
    {
      href: "/dashboard/follow-up",
      icon: <FiUsers />,
      labelKey: t("sidebar.nav.leadFollowUp"),
    },
  ];

  const campaignsItems: MenuItem[] = [
    {
      href: "/dashboard/campaigns/sms",
      icon: <FiMessageSquare />,
      labelKey: t("sidebar.nav.smsCampaigns"),
    },
    {
      href: "/dashboard/campaigns/email",
      icon: <FiMail />,
      labelKey: t("sidebar.nav.emailCampaigns"),
    },
  ];

  const mainItems: MenuItem[] = [
    {
      href: "/dashboard",
      icon: <FiHome />,
      labelKey: t("sidebar.nav.home"),
    },
    {
      href: "/dashboard/profile",
      icon: <FiUser />,
      labelKey: t("sidebar.nav.businessProfile"),
    },
    {
      href: "/dashboard/services",
      icon: <FiList />,
      labelKey: t("sidebar.nav.services"),
    },
  ];

  const bottomItems: MenuItem[] = [
    {
      href: "/dashboard/appointments",
      icon: <FiCalendar />,
      labelKey: t("sidebar.nav.calendar"),
    },
    {
      href: "/dashboard/reports",
      icon: <FiBarChart2 />,
      labelKey: t("sidebar.nav.reports"),
    },
  ];

  return (
    <>
      {isOpen ? (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label={t("sidebar.closeMenuAria")}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 h-[100dvh] w-72 max-w-[85vw]",
          "flex flex-col text-white",
          "border-r border-white/10",
          "bg-gradient-to-b from-[#5b21b6]/40 to-[#9333ea]/30",
          "shadow-[0_0_20px_2px_rgba(147,51,234,0.3)] backdrop-blur-xl",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div
          className="flex-1 overflow-y-auto px-6 pb-28 pt-6"
          style={{
            paddingBottom:
              "calc(env(safe-area-inset-bottom, 0px) + 96px)",
          }}
        >
          <div className="mb-8 flex items-center gap-4">
            {tenant?.logo_url ? (
              <div className="h-12 w-12 rounded-full bg-white p-[2px] shadow-inner">
                <img
                  src={tenant.logo_url}
                  alt={t("sidebar.logoAlt")}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white shadow-inner">
                {(
                  tenant?.owner_name ||
                  tenant?.email ||
                  t("sidebar.fallbackUserLetter")
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm text-white/70">
                {t("sidebar.welcome")}
              </p>

              <p className="max-w-[160px] truncate text-lg font-semibold leading-tight">
                {tenant?.name || t("sidebar.fallbackBusiness")}
              </p>
            </div>
          </div>

          <h2 className="mb-5 hidden text-xl font-bold text-purple-300 lg:block">
            {t("sidebar.title")}
          </h2>

          <nav className="space-y-2 text-sm font-medium">
            {mainItems.map((item) => {
              const active = isRouteActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavigation}
                  className={[
                    "group flex items-center gap-3 rounded-lg p-3 transition-all",
                    active
                      ? "bg-white/20 font-semibold text-white"
                      : "bg-white/5 text-white hover:bg-white/10 hover:pl-5",
                  ].join(" ")}
                >
                  <span className="transition-transform group-hover:scale-110">
                    {item.icon}
                  </span>

                  <span>{item.labelKey}</span>
                </Link>
              );
            })}

            <CollapsibleMenu
              title={t("sidebar.groups.channels")}
              icon={<FiMessageSquare />}
              items={channelsItems}
              pathname={pathname}
              defaultOpen
              onNavigate={handleNavigation}
            />

            <CollapsibleMenu
              title={t("sidebar.groups.crm")}
              icon={<FiUsers />}
              items={crmItems}
              pathname={pathname}
              defaultOpen
              onNavigate={handleNavigation}
            />

            {bottomItems
              .filter(
                (item) => item.href === "/dashboard/appointments"
              )
              .map((item) => {
                const active = isRouteActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavigation}
                    className={[
                      "group flex items-center gap-3 rounded-lg p-3 transition-all",
                      active
                        ? "bg-white/20 font-semibold text-white"
                        : "bg-white/5 text-white hover:bg-white/10 hover:pl-5",
                    ].join(" ")}
                  >
                    <span className="transition-transform group-hover:scale-110">
                      {item.icon}
                    </span>

                    <span>{item.labelKey}</span>
                  </Link>
                );
              })}

            <CollapsibleMenu
              title={t("sidebar.groups.campaigns")}
              icon={<FiMail />}
              items={campaignsItems}
              pathname={pathname}
              onNavigate={handleNavigation}
            />

            {bottomItems
              .filter((item) => item.href === "/dashboard/reports")
              .map((item) => {
                const active = isRouteActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavigation}
                    className={[
                      "group flex items-center gap-3 rounded-lg p-3 transition-all",
                      active
                        ? "bg-white/20 font-semibold text-white"
                        : "bg-white/5 text-white hover:bg-white/10 hover:pl-5",
                    ].join(" ")}
                  >
                    <span className="transition-transform group-hover:scale-110">
                      {item.icon}
                    </span>

                    <span>{item.labelKey}</span>
                  </Link>
                );
              })}
          </nav>
        </div>

        <div
          className="sticky left-0 right-0 bg-gradient-to-t from-[#1D0A2B] to-transparent px-6 pb-4 pt-3"
          style={{
            bottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <ClientOnly>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-2xl bg-red-600 py-3 font-medium text-white shadow hover:bg-red-700"
            >
              {t("sidebar.logout")}
            </button>
          </ClientOnly>
        </div>
      </aside>
    </>
  );
}