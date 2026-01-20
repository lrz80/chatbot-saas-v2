"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import { track } from "@/lib/metaPixel";

type SettingsResp = {
  membresia_activa: boolean;
  estado_membresia_texto?: string;
};

export default function UpgradePage() {
  const [settings, setSettings] = useState<SettingsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: "include",
          cache: "no-store",
        });

        // ✅ Si no hay sesión, saca al usuario
        if (r.status === 401) {
          window.location.href = "/register";
          return;
        }

        const s = await r.json();

        setSettings({
          membresia_activa: !!s.membresia_activa,
          estado_membresia_texto: s.estado_membresia_texto,
        });
      } catch (e) {
        setError("No fue posible leer tu sesión.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startCheckout = async () => {
    try {
      setStartingCheckout(true);
      setError(null);

      // ✅ Meta Pixel: inició checkout
      track("InitiateCheckout", {
        content_name: "Plan 24/7 (3 canales)",
        value: 399,
        currency: "USD",
      });

      const r = await fetch(`${BACKEND_URL}/api/stripe/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data = await r.json();
      if (!r.ok || !data?.url) {
        throw new Error(data?.error || "No se pudo iniciar el checkout.");
      }

      window.location.href = data.url;
    } catch (e: any) {
      setError(e?.message || "Error iniciando el checkout.");
      setStartingCheckout(false);
    }
  };

  if (loading) return <div className="text-white text-center mt-10">Cargando…</div>;
  if (!settings) return <div className="text-red-300 text-center mt-10">{error || "No fue posible leer tu sesión."}</div>;

  const isActive = settings.membresia_activa;

  return (
    <div className="max-w-4xl mx-auto p-6 text-white">
      {!isActive ? (
        <div className="mb-6 p-4 rounded-lg border border-yellow-400 bg-yellow-500/10 text-yellow-200 text-center">
          Tu membresía está inactiva. Actívala para continuar.
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-lg border border-emerald-400 bg-emerald-500/10 text-emerald-200 text-center">
          Tu membresía está activa.
        </div>
      )}

      <h1 className="text-3xl font-bold mb-2">Activar Atención Automática 24/7</h1>
      <p className="text-white/80 mb-8">
        Responde automáticamente por WhatsApp, Instagram y Facebook, con seguimiento automático hasta 23 horas.
      </p>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
        <h2 className="text-xl font-semibold">Plan 24/7 (3 canales)</h2>

        <ul className="mt-4 space-y-2 text-white/80 text-sm">
          <li>• Respuesta inmediata 24/7</li>
          <li>• WhatsApp + Instagram + Facebook</li>
          <li>• Seguimiento automático hasta 23 horas</li>
          <li>• Se activa igual para todos (sin personalizaciones)</li>
        </ul>

        <div className="mt-6">
          <div className="text-3xl font-extrabold">
            $399 <span className="text-sm font-normal text-white/70">hoy</span>
          </div>
          <div className="text-white/70 text-sm mt-1">
            Incluye instalación + primer mes. Luego <span className="text-white font-semibold">$199/mes</span> desde el mes 2.
          </div>
        </div>

        {error ? (
          <div className="mt-4 text-red-300 text-sm">{error}</div>
        ) : null}

        <button
          className="mt-6 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 py-3 font-semibold disabled:opacity-60"
          onClick={startCheckout}
          disabled={startingCheckout || isActive}
        >
          {isActive ? "Membresía activa" : startingCheckout ? "Redirigiendo a Stripe…" : "Activar con Stripe"}
        </button>

        <p className="mt-4 text-xs text-white/60">
          Cancelas cuando quieras. La facturación mensual comienza automáticamente en el mes 2.
        </p>
      </div>
    </div>
  );
}
