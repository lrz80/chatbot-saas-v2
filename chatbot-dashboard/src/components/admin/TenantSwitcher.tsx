"use client";

import { useEffect, useState } from "react";
import { FiChevronDown, FiLoader } from "react-icons/fi";
import { BACKEND_URL } from "@/utils/api";

type TenantOption = {
  id: string;
  name: string | null;
  logo_url?: string | null;
  email_negocio?: string | null;
};

type TenantSwitcherProps = {
  currentTenantId?: string;
};

export default function TenantSwitcher({
  currentTenantId,
}: TenantSwitcherProps) {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] =
    useState(currentTenantId || "");
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadTenants = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/admin/tenants`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Error cargando tenants: ${response.status}`
          );
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        setTenants(
          Array.isArray(data.tenants)
            ? data.tenants
            : []
        );

        setSelectedTenantId(
          data.selected_tenant_id ||
          currentTenantId ||
          ""
        );
      } catch (error) {
        console.error(
          "❌ Error cargando tenants:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadTenants();

    return () => {
      cancelled = true;
    };
  }, [currentTenantId]);

  const selectTenant = async (
    tenantId: string
  ) => {
    if (
      !tenantId ||
      tenantId === selectedTenantId ||
      changing
    ) {
      return;
    }

    setChanging(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/tenants/select`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenant_id: tenantId,
          }),
        }
      );

      if (!response.ok) {
        const body = await response
          .json()
          .catch(() => null);

        throw new Error(
          body?.error ||
          `Error seleccionando tenant: ${response.status}`
        );
      }

      setSelectedTenantId(tenantId);

      /**
       * Recarga todo el dashboard.
       * Así todas las páginas y consultas existentes
       * vuelven a ejecutarse usando la nueva cookie.
       */
      window.location.reload();
    } catch (error) {
      console.error(
        "❌ Error seleccionando tenant:",
        error
      );

      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
        <FiLoader className="animate-spin" />
        Cargando negocios...
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="px-1 text-xs font-medium uppercase tracking-wide text-white/50">
        Administrando
      </p>

      <div className="relative">
        <select
          value={selectedTenantId}
          disabled={changing}
          onChange={(event) => {
            void selectTenant(event.target.value);
          }}
          className="w-full appearance-none rounded-xl border border-purple-400/20 bg-black/30 px-3 py-3 pr-10 text-sm font-medium text-white outline-none transition focus:border-purple-400/60 disabled:cursor-wait disabled:opacity-60"
        >
          {tenants.map((tenant) => (
            <option
              key={tenant.id}
              value={tenant.id}
              className="bg-[#1D0A2B] text-white"
            >
              {tenant.name ||
                tenant.email_negocio ||
                tenant.id}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          {changing ? (
            <FiLoader className="animate-spin text-purple-300" />
          ) : (
            <FiChevronDown className="text-purple-300" />
          )}
        </span>
      </div>
    </div>
  );
}