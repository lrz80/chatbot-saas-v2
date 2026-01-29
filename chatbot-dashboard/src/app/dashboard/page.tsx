// src/app/dashboard/page.tsx

'use client';

import Footer from '@/components/Footer';
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
import { PhoneCall, MessageCircle } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaInstagram } from 'react-icons/fa';
import KpiCardWithChart from '@/components/KpiCardWithChart';
import { useI18n } from "@/i18n/LanguageProvider";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardHome() {
  const [keywords, setKeywords] = useState<[string, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ total: 0, unicos: 0, hora_pico: null });
  const [chartData, setChartData] = useState<any>(null);
  const [monthlyView, setMonthlyView] = useState<'year' | 'current'>('current');
  const [usage, setUsage] = useState({ used: 0, limit: null, porcentaje: 0, plan: 'free' });
  const [onboardingCompletado, setOnboardingCompletado] = useState<boolean>(true);
  const [canal, setCanal] = useState<string>('todos');
  const [ventasStats, setVentasStats] = useState({ total_intenciones: 0, leads_calientes: 0 });
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [loadingAllMessages, setLoadingAllMessages] = useState(true);
  const [graficoInteracciones, setGraficoInteracciones] = useState<number[]>([]);
  const [graficoUsuarios, setGraficoUsuarios] = useState<number[]>([]);
  const [graficoIntenciones, setGraficoIntenciones] = useState<number[]>([]);
  const [graficoHoraPico, setGraficoHoraPico] = useState<number[]>([]);
  const [horaPico, setHoraPico] = useState<number | null>(null);

  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const [showSuccess, setShowSuccess] = useState(false);

  const { t, lang } = useI18n();

  const locale = lang === "en" ? "en-US" : "es-ES";

  const canalIcono = {
    whatsapp: <FaWhatsapp className="inline-block text-green-500" size={16} />,
    voice: <PhoneCall className="inline-block text-purple-400" size={16} />,
    facebook: <FaFacebook className="inline-block text-blue-500" size={16} />,
    instagram: <FaInstagram className="inline-block text-pink-500" size={16} />,
    default: <MessageCircle className="inline-block text-white/60" size={16} />,
  };  
  
  const canalLabelKey: Record<string, string> = {
    todos: "dashboard.channels.all",
    whatsapp: "dashboard.channels.whatsapp",
    voice: "dashboard.channels.voice",
    instagram: "dashboard.channels.instagram",
    facebook: "dashboard.channels.facebook",
  };

  const mensajesUnicos = Array.from(
    new Map(allMessages.map((m) => [m.id, m])).values()
  );
  
  // Ordenar por timestamp descendente y mostrar solo los últimos 10
  const ultimosMensajes = mensajesUnicos
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);  
  
  const mensajesPorCanal = mensajesUnicos.reduce((acc: Record<string, any[]>, msg: any) => {
  
    if (!acc[msg.canal]) acc[msg.canal] = [];
    acc[msg.canal].push(msg);
    return acc;
  }, {});  

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
                  ? new Date(d.dia).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
                  : new Date(d.mes).toLocaleDateString(locale, { month: 'long' })
              ),
              datasets: [
                {
                  label: t("dashboard.chart.datasetLabel"),
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
          setKpis({
            total: kpiData.total,
            unicos: kpiData.unicos,
            hora_pico: kpiData.hora_pico, // usa esto o renombra como quieras
          });
          setHoraPico(kpiData.hora_pico); // ahora sí se actualiza          
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
  }, [monthlyView, canal, lang]);

  useEffect(() => {
    const fetchAllMessages = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/messages?limit=50${canal !== 'todos' ? `&canal=${canal}` : ''}`,
          { credentials: 'include' }
        );
        if (!res.ok) throw new Error("Error al obtener mensajes");
  
        const data = (await res.json()) as { mensajes: any[] };
  
        setAllMessages(Array.isArray(data.mensajes) ? data.mensajes : []);
      } catch (err) {
        console.error("❌ Error cargando mensajes:", err);
        setAllMessages([]); // ← Evita errores posteriores
      } finally {
        setLoadingAllMessages(false);
      }
    };
  
    fetchAllMessages();
  }, [canal]);  
  
  useEffect(() => {
    const fetchGraficos = async () => {
      try {
        // Hacer todas las peticiones en paralelo
        const [intRes, usrRes, intVentasRes, horaPicoRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/stats/interacciones-por-dia`, { credentials: 'include' }),
          fetch(`${BACKEND_URL}/api/stats/usuarios-por-dia`, { credentials: 'include' }),
          fetch(`${BACKEND_URL}/api/stats/intenciones-por-dia`, { credentials: 'include' }),
          fetch(`${BACKEND_URL}/api/stats/hora-pico`, { credentials: 'include' }),
        ]);
  
        const interacciones = await intRes.json();
        const usuarios = await usrRes.json();
        const intenciones = await intVentasRes.json();
        const horaPicoData = await horaPicoRes.json();
  
        // Asignar datos de los gráficos
        setGraficoInteracciones(interacciones.map((d: any) => parseInt(d.count)));
        setGraficoUsuarios(usuarios.map((d: any) => parseInt(d.count)));
        setGraficoIntenciones(intenciones.map((d: any) => parseInt(d.count)));
  
        // Para el gráfico de hora pico (opcional: puedes hacer mejor gráfico luego si quieres)
        const horas = new Array(24).fill(0);
        interacciones.forEach((d: any) => {
          const hora = new Date(d.dia).getHours();
          horas[hora]++;
        });
        setGraficoHoraPico(horas.slice(0, 10)); // ejemplo, primeras 10 horas del día
  
        // Asignar valor real de hora pico
        if (horaPicoData?.hora_pico !== undefined) {
          setHoraPico(horaPicoData.hora_pico);
        }
  
      } catch (err) {
        console.error("❌ Error al cargar gráficos individuales:", err);
      }
    };
  
    fetchGraficos();
  }, []);
  

  if (loading) return <div className="text-white p-10">{t("dashboard.loading")}</div>;

  return (
    <div className="w-full px-4 md:px-6 py-4 text-white overflow-x-hidden">
      {showSuccess && (
        <div className="bg-green-600/90 border border-green-400 text-white px-4 py-3 rounded mb-6 text-center font-medium">
          {t("dashboard.membershipActivated")}
        </div>
      )}

      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-800/20 to-fuchsia-600/10 border border-purple-600/30">
        <div className="relative w-12 h-12 md:w-16 md:h-16">
          <img src="/avatar-amy.png" alt={t("dashboard.avatarAlt")} className="w-full h-full rounded-full border-2 border-purple-500" />
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-purple-300">{t("dashboard.title")}</h1>
      </div>

      {!onboardingCompletado && (
        <div className="bg-yellow-300/10 p-3 rounded text-yellow-300 text-center mb-4 text-sm">
          {t("dashboard.onboarding.missing")}{" "}
          <a href="/dashboard/profile" className="underline hover:text-yellow-200">
            {t("dashboard.onboarding.cta")}
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 px-4">
        <KpiCardWithChart
          title={t("dashboard.kpis.totalInteractions")}
          value={kpis.total}
          data={graficoInteracciones}
          color="rgba(168, 85, 247, 1)"
        />
        <KpiCardWithChart
          title={t("dashboard.kpis.uniqueUsers")}
          value={kpis.unicos}
          data={graficoUsuarios}
          color="rgba(255, 255, 255, 0.9)"
        />
        <KpiCardWithChart
          title={t("dashboard.kpis.peakHour")}
          value={kpis.hora_pico ? `${kpis.hora_pico}:00` : '—'}
          data={graficoHoraPico}
          color="rgba(255, 180, 100, 1)"
        />
        <KpiCardWithChart
          title={t("dashboard.kpis.salesIntentions")}
          value={ventasStats.total_intenciones}
          data={graficoIntenciones}
          color="rgba(255, 99, 132, 1)"
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg md:text-xl font-semibold">{t("dashboard.monthlyInteractions.title")}</h2>
          <div className="flex gap-2">
            <button onClick={() => setMonthlyView('year')} className="px-2 py-1 text-xs md:text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full">{t("dashboard.monthlyInteractions.year")}</button>
            <button onClick={() => setMonthlyView('current')} className="px-2 py-1 text-xs md:text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full">{t("dashboard.monthlyInteractions.month")}</button>
          </div>
        </div>
        {chartData ? (
          <div className="bg-white/10 p-4 rounded h-[300px] md:h-[350px] overflow-x-auto">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: true, labels: { color: '#fff' } },
                  title: {
                    display: true,
                    text: t("dashboard.chart.title"),
                    color: '#fff',
                    font: { size: 18 },
                  },
                },
              }}
            />
          </div>
        ) : (
          <p className="text-white/50">{t("dashboard.chart.noData")}</p>
        )}
      </div>

      <div className="bg-white/10 p-4 rounded mb-6">
      <div className="mb-4 flex flex-wrap gap-2 overflow-x-auto">
        {['todos', 'whatsapp', 'voice', 'instagram', 'facebook'].map((c) => (
          <button
            key={c}
            onClick={() => setCanal(c)}
            className={`flex items-center gap-2 px-3 py-1 text-xs md:text-sm rounded-full ${
              canal === c ? 'bg-purple-700 text-white' : 'bg-white/10 text-white/70'
            }`}
          >
            {canalIcono[c as keyof typeof canalIcono] || canalIcono.default}
            {t(canalLabelKey[c] || "dashboard.channels.other")}
          </button>
        ))}
      </div>

        <h2 className="text-lg md:text-xl mb-4">{t("dashboard.messagesByChannel.title")}</h2>

        {loadingAllMessages ? (
          <p className="text-white/50">{t("dashboard.messagesByChannel.loading")}</p>
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
                  {ultimosMensajes
                    .filter(msg => msg.canal === canalKey)
                    .map((msg, i) => (
                      <div
                        key={i}
                        className="bg-white/5 p-3 rounded border border-white/10 text-sm"
                      >
                        <div className="flex justify-between text-white/60 text-xs mb-1">
                          <span>{new Date(msg.timestamp).toLocaleString(locale)}</span>
                          <span>{msg.from_number || t("dashboard.messagesByChannel.anonymous")}</span>
                        </div>
                        <div className="font-medium text-white break-words">
                          {msg.role === "user"
                            ? t("dashboard.messagesByChannel.clientLabel")
                            : t("dashboard.messagesByChannel.assistantLabel")}{" "}
                          {msg.content}
                        </div>
                        {msg.emotion && (
                          <div className="text-purple-300 text-xs mt-1">
                            {t("dashboard.messagesByChannel.emotionDetected")}{" "}
                            <span className="font-semibold">{msg.emotion}</span>
                          </div>
                        )}
                        {msg.intencion && (
                          <div className="text-green-400 text-xs mt-1">
                            {t("dashboard.messagesByChannel.intentDetected")}{" "}
                            <span className="font-semibold">{msg.intencion}</span>{" "}
                            {t("dashboard.messagesByChannel.intentLevel", { level: msg.nivel_interes })}
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
                        <span>{new Date(msg.timestamp).toLocaleString(locale)}</span>
                        <span>{msg.from_number || t("dashboard.messagesByChannel.anonymous")}</span>
                      </div>
                      <div className="font-medium text-white break-words">
                      {msg.role === "user"
                        ? t("dashboard.messagesByChannel.clientLabel")
                        : t("dashboard.messagesByChannel.assistantLabel")}{" "}
                      {msg.content}
                      </div>
                      {msg.emotion && (
                        <div className="text-purple-300 text-xs mt-1">
                          {t("dashboard.messagesByChannel.emotionDetected")}{" "}
                          <span className="font-semibold">{msg.emotion}</span>
                        </div>
                      )}
                      {msg.intencion && (
                        <div className="text-green-400 text-xs mt-1">
                          {t("dashboard.messagesByChannel.intentDetected")}{" "}
                          <span className="font-semibold">{msg.intencion}</span>{" "}
                          {t("dashboard.messagesByChannel.intentLevel", { level: msg.nivel_interes })}
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
        <h2 className="text-lg md:text-xl mb-2">{t("dashboard.keywords.title")}</h2>
        {keywords.length > 0 ? (
          <ul className="flex flex-wrap gap-3 overflow-x-auto max-w-full">
            {keywords.map(([word, count]) => (
              <li key={word} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {word} ({count})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-white/50 text-sm">{t("dashboard.keywords.noData")}</p>
        )}
      </div>
      <Footer />
    </div>
  );
}
