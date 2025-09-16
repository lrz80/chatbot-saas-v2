'use client';

import { useEffect, useMemo, useState } from 'react';

type Summary = {
  cycle_start: string;
  included: number;
  bought: number;
  used: number;
  total: number;
  available: number;
};

function joinUrl(base: string, path: string) {
  if (!base) return path; // fallback a relativo (solo útil si la cookie aplica al mismo host)
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export default function VoiceMinutesCard() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Toma la base del backend desde el entorno; fallback intenta deducir api.<host actual>
  const API = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        // si el frontend está en aamy.ai, prueba api.aamy.ai
        return `${url.protocol}//api.${url.hostname.replace(/^www\./, '')}`;
      } catch {}
    }
    return '';
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(joinUrl(API, '/api/stats/voice/minutes'), {
        credentials: 'include',
      });

      // Evita sorpresas con 308/307/302 sin cookies
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }

      const json: Summary = await res.json();
      setData(json);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Error cargando minutos de voz');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = data ? Math.min(100, Math.round((data.used / data.total) * 100)) : 0;

  async function buy(minutes: number) {
    try {
      const res = await fetch(joinUrl(API, '/api/voice/topup'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes, source: 'manual-dashboard' }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }

      await load();
      alert(`Se agregaron ${minutes} minutos.`);
    } catch (e: any) {
      console.error(e);
      alert(`No se pudo completar la compra: ${e?.message || 'Error desconocido'}`);
    }
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 md:p-5">
      <div className="text-lg font-semibold mb-3">Uso de Voz (minutos)</div>

      {loading && <div className="text-sm text-zinc-400">Cargando…</div>}

      {!loading && err && (
        <div className="text-sm text-red-400">
          {err}. Verifica que <code>NEXT_PUBLIC_API_BASE_URL</code> apunte a tu backend (p.ej. <code>https://api.aamy.ai</code>) y que la cookie tenga <code>Domain=.aamy.ai</code>.
        </div>
      )}

      {!loading && !err && data && (
        <>
          <div className="text-sm text-zinc-400 mb-2">
            Incluye <b>{data.included}</b> min/mes {data.bought > 0 && <>+ <b>{data.bought}</b> min comprados</>}
          </div>

          <div className="w-full h-2 bg-zinc-800 rounded">
            <div
              className="h-2 bg-green-500 rounded"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-2 text-sm">
            Usados: <b>{data.used}</b> min · Disponibles: <b>{data.available}</b> / {data.total} min
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => buy(250)}
              className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm"
            >
              +250 min
            </button>
            <button
              onClick={() => buy(500)}
              className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm"
            >
              +500 min
            </button>
            <button
              onClick={() => buy(1000)}
              className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm"
            >
              +1000 min
            </button>
          </div>
        </>
      )}
    </div>
  );
}
