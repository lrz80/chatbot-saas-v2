'use client';

import { useEffect, useState } from 'react';

type Summary = {
  cycle_start: string;
  included: number;
  bought: number;
  used: number;
  total: number;
  available: number;
};

export default function VoiceMinutesCard() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch('/api/stats/voice/minutes', { credentials: 'include' });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const pct = data ? Math.min(100, Math.round((data.used / data.total) * 100)) : 0;

  async function buy(minutes: number) {
    // 🔑 Aquí puedes redirigir a Stripe en lugar de este POST simple
    await fetch('/api/voice/topup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes, source: 'manual-dashboard' })
    });
    await load();
    alert(`Se agregaron ${minutes} minutos.`);
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 md:p-5">
      <div className="text-lg font-semibold mb-3">Uso de Voz (minutos)</div>

      {loading && <div className="text-sm text-zinc-400">Cargando…</div>}

      {!loading && data && (
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
