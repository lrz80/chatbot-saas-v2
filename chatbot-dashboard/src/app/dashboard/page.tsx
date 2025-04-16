'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardHome() {
  const [keywords, setKeywords] = useState<[string, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ total: 0, usuarios: 0, hora_pico: null });
  const [chartData, setChartData] = useState<any>(null);
  const [monthlyView, setMonthlyView] = useState<'year' | 'current'>('year');
  const [usage, setUsage] = useState({ used: 0, limit: null, porcentaje: 0, plan: 'free' });
  const [negocioCargado, setNegocioCargado] = useState<boolean>(false);

  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔐 Validar sesión
        const resAuth = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: 'include',
        });

        const raw = await resAuth.text();
        let data: any = {};
        try {
          data = JSON.parse(raw);
        } catch (e) {
          console.error('Error parsing settings response:', raw);
        }

        if (resAuth.status === 401) {
          router.push('/login');
          return;
        }

        if (resAuth.ok && data && data.id) {
          setNegocioCargado(true); // tiene datos del negocio
        }

        // ✅ Palabras clave
        const resKeywords = await fetch(`${BACKEND_URL}/api/keywords`, {
          credentials: 'include',
        });
        const text = await resKeywords.text();
        try {
          const data = JSON.parse(text);
          setKeywords(data.keywords || []);
        } catch (err) {
          console.error('Error al parsear keywords:', text);
        }

        // ✅ Uso de plan
        const resUsage = await fetch(`${BACKEND_URL}/api/usage`, {
          credentials: 'include',
        });
        if (resUsage.ok) {
          const data = await resUsage.json();
          setUsage(data);
        }

        // ✅ Estadísticas
        const resChart = await fetch(`${BACKEND_URL}/api/stats/monthly?month=${monthlyView}`, {
          credentials: 'include',
        });
        if (resChart.ok) {
          const data = await resChart.json();
          if (Array.isArray(data)) {
            setChartData({
              labels: data.map((d: any) =>
                monthlyView === 'current'
                  ? new Date(d.dia).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                  : new Date(d.mes).toLocaleDateString('es-ES', { month: 'long' })
              ),
              datasets: [
                {
                  label: 'Interacciones del Chatbot',
                  data: data.map((d: any) => parseInt(d.count)),
                },
              ],
            });
          }
        }

        // ✅ KPIs generales
        const resKpi = await fetch(`${BACKEND_URL}/api/stats/kpis`, {
          credentials: 'include',
        });
        if (resKpi.ok) {
          const kpiData = await resKpi.json();
          setKpis(kpiData);
        }

      } catch (err) {
        console.error('❌ Error cargando dashboard:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [monthlyView]);

  const handleLogout = () => {
    document.cookie = 'token=; Max-Age=0; path=/';
    router.push('/login');
  };

  const mockMessages = [
    { id: 1, sender: 'user', content: '¿Cuáles son los precios?', timestamp: Date.now() - 30000 },
    { id: 2, sender: 'bot', content: 'Nuestros precios dependen del servicio. ¿Qué deseas saber?', timestamp: Date.now() - 20000 },
  ];

  if (loading) return <div className="text-white p-10">Cargando...</div>;

  return (
    <div className="p-6 text-white relative">
      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
      >
        Cerrar sesión
      </button>

      <h1 className="text-3xl font-bold mb-4">Amy AI Dashboard</h1>

      {!negocioCargado && (
        <div className="bg-yellow-300/10 p-4 rounded text-yellow-300 text-center mb-4">
          Aún no has configurado tu negocio.{' '}
          <a href="/dashboard/profile" className="underline hover:text-yellow-200">
            Hazlo aquí
          </a>
        </div>
      )}

      {usage.plan === 'free' && (
        <div className="bg-yellow-500/10 text-yellow-300 p-4 rounded mb-6">
          Estás en el plan gratuito.{' '}
          <a href="/dashboard/profile?upgrade=1" className="underline">
            Activa tu membresía
          </a>{' '}
          para desbloquear funciones.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 p-4 rounded">Interacciones Totales: {kpis.total}</div>
        <div className="bg-white/10 p-4 rounded">Usuarios Únicos: {kpis.usuarios}</div>
        <div className="bg-white/10 p-4 rounded">Hora Pico: {kpis.hora_pico ? `${kpis.hora_pico}:00` : '—'}</div>
      </div>

      <div className="mb-4">
        <button onClick={() => setMonthlyView('year')} className="px-3 py-1 mr-2 bg-indigo-600 text-white rounded">
          Año
        </button>
        <button onClick={() => setMonthlyView('current')} className="px-3 py-1 bg-indigo-600 text-white rounded">
          Mes
        </button>
      </div>

      <div className="bg-white/10 p-4 rounded mb-6">
        <h2 className="text-xl mb-2">Historial de Conversaciones</h2>
        {mockMessages.map((msg) => (
          <div key={msg.id} className="mb-2 p-2 border rounded bg-white/5">
            <strong>{msg.sender === 'user' ? '👤 Cliente' : '🤖 Bot'}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div className="bg-white/10 p-4 rounded mb-6">
        <h2 className="text-xl mb-2">Palabras clave más frecuentes</h2>
        {keywords.length > 0 ? (
          <ul className="flex flex-wrap gap-3">
            {keywords.map(([word, count]) => (
              <li key={word} className="bg-white/20 px-3 py-1 rounded-full">
                {word} ({count})
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay datos aún.</p>
        )}
      </div>
    </div>
  );
}
