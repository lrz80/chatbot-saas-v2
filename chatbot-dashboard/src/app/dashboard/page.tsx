'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardHome() {
  const [keywords, setKeywords] = useState<[string, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ total: 0, usuarios: 0, hora_pico: null });
  const [chartData, setChartData] = useState<any>(null);
  const [monthlyView, setMonthlyView] = useState<'year' | 'current'>('year');
  const [usage, setUsage] = useState({ used: 0, limit: null, porcentaje: 0, plan: 'free' });
  const [onboardingCompletado, setOnboardingCompletado] = useState<boolean>(true);

  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resAuth = await fetch(`${BACKEND_URL}/api/settings`, { credentials: 'include' });
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
  
        if (resAuth.ok && data) {
          setOnboardingCompletado(data.onboarding_completado ?? true); // fallback true para evitar errores
        }        
  
        const resKeywords = await fetch(`${BACKEND_URL}/api/keywords`, { credentials: 'include' });
        const text = await resKeywords.text();
        try {
          const data = JSON.parse(text);
          setKeywords(data.keywords || []);
        } catch (err) {
          console.error('Error al parsear keywords:', text);
        }
  
        const resUsage = await fetch(`${BACKEND_URL}/api/usage`, { credentials: 'include' });
        if (resUsage.ok) {
          const data = await resUsage.json();
          setUsage(data);
        }
  
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
                  backgroundColor: 'rgba(168, 85, 247, 0.5)',
                  borderRadius: 8,
                },
              ],
            });
          }
        }
  
        const resKpi = await fetch(`${BACKEND_URL}/api/stats/kpis`, { credentials: 'include' });
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
  
    // 👇 Detectar ?success=1 y mostrar banner temporal
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("success") === "1") {
      setShowSuccess(true);
      fetchData(); // 🔄 Actualiza datos del dashboard
  
      // ✅ Elimina el parámetro de la URL
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
  
      // ⏱ Oculta el banner después de 5 segundos
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    }
  
    fetchData();
  }, [monthlyView]);
  

  if (loading) return <div className="text-white p-10">Cargando...</div>;

  const mockMessages = [
    { id: 1, sender: 'user', content: '¿Cuáles son los precios?', timestamp: Date.now() - 30000 },
    { id: 2, sender: 'bot', content: 'Nuestros precios dependen del servicio. ¿Qué deseas saber?', timestamp: Date.now() - 20000 },
  ];
  
  return (
    <div className="p-6 text-white relative">
      {showSuccess && (
        <div className="bg-green-600/90 border border-green-400 text-white px-4 py-3 rounded mb-6 shadow-lg text-center font-medium">
          ✅ ¡Tu membresía fue activada correctamente!
        </div>
      )}
      <div className="flex items-center gap-4 mb-6 bg-gradient-to-r from-purple-800/20 to-fuchsia-600/10 p-4 rounded-xl shadow-lg border border-purple-600/30 backdrop-blur-md">
        <div className="relative w-16 h-16">
          <img
            src="/avatar-amy.png"
            alt="Avatar de Amy"
            className="w-full h-full rounded-full border-2 border-purple-500 shadow-xl animate-pulse-glow"
          />
          <div className="absolute inset-0 rounded-full border-2 border-purple-500 blur-md opacity-70 animate-glow" />
        </div>
        <h1 className="text-4xl font-extrabold text-purple-300 drop-shadow-[0_0_12px_rgba(168,85,247,0.9)] tracking-wider">
          Amy AI Dashboard
        </h1>
      </div>

      {!onboardingCompletado && (
        <div className="bg-yellow-300/10 p-4 rounded text-yellow-300 text-center mb-4">
          Aún no has configurado tu negocio.{' '}
          <a href="/dashboard/profile" className="underline hover:text-yellow-200">
            Hazlo aquí
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 p-4 rounded">Interacciones Totales: {kpis.total}</div>
        <div className="bg-white/10 p-4 rounded">Usuarios Únicos: {kpis.usuarios}</div>
        <div className="bg-white/10 p-4 rounded">Hora Pico: {kpis.hora_pico ? `${kpis.hora_pico}:00` : '—'}</div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Interacciones Mensuales</h2>
          <div>
            <button onClick={() => setMonthlyView('year')} className="px-3 py-1 mr-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full">
              Año
            </button>
            <button onClick={() => setMonthlyView('current')} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full">
              Mes
            </button>
          </div>
        </div>
        {chartData ? (
          <div className="bg-white/10 p-4 rounded">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    labels: {
                      color: '#fff',
                    },
                  },
                  title: {
                    display: true,
                    text: 'Interacciones por período',
                    color: '#fff',
                    font: {
                      size: 18,
                    },
                  },
                },
              }}
            />
          </div>
        ) : (
          <p className="text-white/50">No hay datos suficientes para mostrar.</p>
        )}
      </div>

      <div className="bg-white/10 p-4 rounded mb-6">
        <h2 className="text-xl mb-2">Historial de Conversaciones</h2>
        {mockMessages.map((msg) => (
          <div key={msg.id} className="mb-2 p-2 border rounded bg-white/5">
            <strong>{msg.sender === 'user' ? '👤 Cliente' : '🤖 Bot'}:</strong> {msg.content}
          </div>
        ))}
        <div className="mt-4 text-center">
          <a href="/dashboard/history" className="inline-block bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2 rounded-full shadow">
            Ver historial completo
          </a>
        </div>
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
