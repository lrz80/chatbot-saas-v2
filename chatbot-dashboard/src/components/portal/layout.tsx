"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiMenu } from "react-icons/fi";

import PortalSidebar from "@/components/portal/PortalSidebar";
import { TenantContext } from "@/context/TenantContext";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/i18n/LanguageProvider";
import LangToggle from "@/components/LangToggle";

type PortalLayoutProps = {
  children: React.ReactNode;
};

type PortalSession = {
  uid?: string;
  email?: string;
  role?: "admin" | "business_owner" | "manager" | "technician";
  is_admin?: boolean;
  tenant_id?: string;
  home_tenant_id?: string;

  name?: string;
  business_name?: string;
  logo_url?: string;

  limites?: Record<string, unknown>;
  channel_flags?: Record<string, boolean>;
  meta_subchannel_flags?: Record<string, boolean>;

  [key: string]: unknown;
};

export default function PortalLayout({
  children,
}: PortalLayoutProps) {
  const router = useRouter();
  const { t } = useI18n();

  const [tenant, setTenant] =
    useState<PortalSession | null>(null);

  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPortalSession() {
      try {
        setError(null);

        const response = await fetch(
          `${BACKEND_URL}/api/settings`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data =
          (await response.json()) as PortalSession;

        const isAdmin =
          data?.is_admin === true ||
          data?.role === "admin";

        if (isAdmin) {
          router.replace("/dashboard");
          return;
        }

        if (!data?.tenant_id) {
          throw new Error(
            "Portal session does not include tenant_id"
          );
        }

        if (!cancelled) {
          setTenant(data);
          setLoading(false);
        }
      } catch (loadError) {
        console.error(
          "[CLIENT_PORTAL][SESSION_LOAD_FAILED]",
          loadError
        );

        if (!cancelled) {
          setError(t("portal.errors.session"));
          setLoading(false);
        }
      }
    }

    void loadPortalSession();

    return () => {
      cancelled = true;
    };
  }, [router, t]);

  async function handleLogout() {
    try {
      await fetch(
        `${BACKEND_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (logoutError) {
      console.error(
        "[CLIENT_PORTAL][LOGOUT_FAILED]",
        logoutError
      );
    } finally {
      document.cookie =
        "token=; Max-Age=0; path=/";

      document.cookie =
        "admin_tenant_id=; Max-Age=0; path=/";

      router.replace("/login");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-purple-500" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-200">
            {error ?? t("portal.errors.session")}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 rounded-xl bg-white px-5 py-2.5 font-medium text-black"
          >
            {t("portal.actions.retry")}
          </button>
        </div>
      </div>
    );
  }

  const businessName =
    tenant.name ||
    tenant.business_name ||
    t("sidebar.fallbackBusiness");

  return (
    <TenantContext.Provider value={tenant}>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <PortalSidebar
          tenant={tenant}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />

        <div className="min-h-screen lg:ml-72">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#0a0a0a]/90 px-4 backdrop-blur lg:px-8">
            <button
              type="button"
              onClick={() =>
                setSidebarOpen(true)
              }
              aria-label={t(
                "portal.sidebar.open"
              )}
              className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"
            >
              <FiMenu size={22} />
            </button>

            <div className="ml-auto flex min-w-0 items-center gap-3">
            <LangToggle />

            <div className="min-w-0 text-right">
                <p className="truncate text-sm font-medium">
                {businessName}
                </p>

                {tenant.email ? (
                <p className="truncate text-xs text-white/50">
                    {tenant.email}
                </p>
                ) : null}
            </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </TenantContext.Provider>
  );
}