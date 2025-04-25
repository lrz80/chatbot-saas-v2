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
import { MessageSquare, PhoneCall, Facebook, Instagram, MessageCircle } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardHome() {
  const [keywords, setKeywords] = useState<[string, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ total: 0, unicos: 0, hora_pico: null });
  const [chartData, setChartData] = useState<any>(null);
  const [monthlyView, setMonthlyView] = useState<'year' | 'current'>('year');
  const [usage, setUsage] = useState({ used: 0, limit: null, porcentaje: 0, plan: 'free' });
  const [onboardingCompletado, setOnboardingCompletado] = useState<boolean>(true);
  const [canal, setCanal] = useState<string>('todos');
  const [ventasStats, setVentasStats] = useState({ total_intenciones: 0, leads_calientes: 0 });
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [loadingAllMessages, setLoadingAllMessages] = useState(true);

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
          setOnboardingCompletado(data.onboarding_completado ?? true);
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

        const resKpi = await fetch(`${BACKEND_URL}/api/stats/kpis${canal !== 'todos' ? `?canal=${canal}` : ''}`, {
          credentials: 'include',
        });
        if (resKpi.ok) {
          const kpiData = await resKpi.json();
          setKpis(kpiData);
        }

        const resVentas = await fetch(`${BACKEND_URL}/api/sales-intelligence/stats`, {
          credentials: 'include',
        });
        if (resVentas.ok) {
          const data = await resVentas.json();
          setVentasStats(data);
        }

      } catch (err) {
        console.error('❌ Error cargando dashboard:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("success") === "1") {
      setShowSuccess(true);
      fetchData();

      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());

      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    }

    fetchData();
  }, [monthlyView, canal]);

  useEffect(() => {
    const fetchAllMessages = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/messages?limit=50`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error("Error al obtener mensajes");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Formato inválido de mensajes");
        setAllMessages(data);
      } catch (err) {
        console.error("❌ Error cargando mensajes:", err);
      } finally {
        setLoadingAllMessages(false);
      }
    };

    fetchAllMessages();
  }, []);

  const canalIcono = {
    whatsapp: <MessageSquare className="inline-block mr-1 text-green-400" size={16} />,
    voice: <PhoneCall className="inline-block mr-1 text-purple-400" size={16} />,
    facebook: <Facebook className="inline-block mr-1 text-blue-400" size={16} />,
    instagram: <Instagram className="inline-block mr-1 text-pink-400" size={16} />,
    default: <MessageCircle className="inline-block mr-1 text-white/60" size={16} />,
  };

  const mensajesPorCanal = allMessages.reduce((acc: Record<string, any[]>, msg: any) => {
    if (!acc[msg.canal]) acc[msg.canal] = [];
    acc[msg.canal].push(msg);
    return acc;
  }, {});

  if (loading) return <div className="text-white p-10">Cargando...</div>;

  return (
    <div className="p-4 md:p-6 text-white">
      {showSuccess && (
        <div className="bg-green-600/90 border border-green-400 text-white px-4 py-3 rounded mb-6 text-center font-medium">
          ✅ ¡Tu membresía fue activada correctamente!
        </div>
      )}

      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-800/20 to-fuchsia-600/10 border border-purple-600/30">
        <div className="relative w-12 h-12 md:w-16 md:h-16">
          <img src="/avatar-amy.png" alt="Avatar de Amy" className="w-full h-full rounded-full border-2 border-purple-500" />
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-purple-300">Amy AI Dashboard</h1>
      </div>

      {!onboardingCompletado && (
        <div className="bg-yellow-300/10 p-3 rounded text-yellow-300 text-center mb-4 text-sm">
          Aún no has configurado tu negocio. <a href="/dashboard/profile" className="underline hover:text-yellow-200">Hazlo aquí</a>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {['todos', 'whatsapp', 'voice', 'instagram', 'facebook'].map((c) => (
          <button
            key={c}
            onClick={() => setCanal(c)}
            className={`px-3 py-1 text-xs md:text-sm rounded-full ${canal === c ? 'bg-purple-700 text-white' : 'bg-white/10 text-white/70'}`}
          >
            {c === 'todos' ? 'Todos los canales' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 p-3 text-sm md:text-base rounded text-center">Interacciones Totales: {kpis.total}</div>
        <div className="bg-white/10 p-3 text-sm md:text-base rounded text-center">Usuarios Únicos: {kpis.unicos}</div>
        <div className="bg-white/10 p-3 text-sm md:text-base rounded text-center">Hora Pico: {kpis.hora_pico ? `${kpis.hora_pico}:00` : '—'}</div>
        <div className="bg-white/10 p-3 text-sm md:text-base rounded text-center">
          🧠 Intenciones: {ventasStats.total_intenciones}<br />
          🔥 Leads calientes: {ventasStats.leads_calientes}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg md:text-xl font-semibold">Interacciones Mensuales</h2>
          <div className="flex gap-2">
            <button onClick={() => setMonthlyView('year')} className="px-2 py-1 text-xs md:text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full">Año</button>
            <button onClick={() => setMonthlyView('current')} className="px-2 py-1 text-xs md:text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full">Mes</button>
          </div>
        </div>
        {chartData ? (
          <div className="bg-white/10 p-4 rounded h-[300px] md:h-[350px]">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: true, labels: { color: '#fff' } },
                  title: {
                    display: true,
                    text: 'Interacciones por período',
                    color: '#fff',
                    font: { size: 18 },
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
        <h2 className="text-lg md:text-xl mb-4">Historial de Mensajes por Canal</h2>

        {loadingAllMessages ? (
          <p className="text-white/50">Cargando mensajes...</p>
        ) : (
          <div className="space-y-6 max-h-[350px] overflow-y-auto pr-1">
            {canal === 'todos' ? (
              Object.entries(mensajesPorCanal).map(([canalKey, mensajes]: [string, any[]]) => (
                <div key={canalKey}>
                  <h3 className="text-white/80 font-semibold mb-2 text-sm flex items-center gap-1 uppercase">
                    {canalIcono[canalKey as keyof typeof canalIcono] || canalIcono.default}
                    {canalKey}
                  </h3>
                  <div className="space-y-2">
                    {mensajes.map((msg, i) => (
                      <div
                        key={i}
                        className="bg-white/5 p-3 rounded border border-white/10 text-sm"
                      >
                        <div className="flex justify-between text-white/60 text-xs mb-1">
                          <span>{new Date(msg.timestamp).toLocaleString()}</span>
                          <span>{msg.from_number || "anónimo"}</span>
                        </div>
                        <div className="font-medium text-white">
                          {msg.sender === "user" ? "👤 Cliente:" : "🤖 Bot:"} {msg.content}
                        </div>
                        {msg.emotion && (
                          <div className="text-purple-300 text-xs mt-1">
                            Emoción detectada: <span className="font-semibold">{msg.emotion}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div>
                <h3 className="text-white/80 font-semibold mb-2 text-sm flex items-center gap-1 uppercase">
                  {canalIcono[canal as keyof typeof canalIcono] || canalIcono.default}
                  {canal}
                </h3>
                <div className="space-y-2">
                  {(mensajesPorCanal[canal] || []).map((msg, i) => (
                    <div
                      key={i}
                      className="bg-white/5 p-3 rounded border border-white/10 text-sm"
                    >
                      <div className="flex justify-between text-white/60 text-xs mb-1">
                        <span>{new Date(msg.timestamp).toLocaleString()}</span>
                        <span>{msg.from_number || "anónimo"}</span>
                      </div>
                      <div className="font-medium text-white">
                        {msg.sender === "user" ? "👤 Cliente:" : "🤖 Bot:"} {msg.content}
                      </div>
                      {msg.emotion && (
                        <div className="text-purple-300 text-xs mt-1">
                          Emoción detectada: <span className="font-semibold">{msg.emotion}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white/10 p-4 rounded mb-6">
        <h2 className="text-lg md:text-xl mb-2">Palabras clave más frecuentes</h2>
        {keywords.length > 0 ? (
          <ul className="flex flex-wrap gap-3">
            {keywords.map(([word, count]) => (
              <li key={word} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {word} ({count})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-white/50 text-sm">No hay datos aún.</p>
        )}
      </div>
    </div>
  );
}
