"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
  const [keywords, setKeywords] = useState<[string, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ total: 0, usuarios: 0, hora_pico: null });
  const [chartData, setChartData] = useState<any>(null);
  const [monthlyView, setMonthlyView] = useState<"year" | "current">("year");
  const [usage, setUsage] = useState({ used: 0, limit: null, porcentaje: 0, plan: "free" });

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resAuth = await fetch("/api/settings");
        if (!resAuth.ok) {
          router.push("/login");
          return;
        }

        const resKeywords = await fetch("/api/keywords");
        const text = await resKeywords.text();
        try {
          const data = JSON.parse(text);
          setKeywords(data.keywords || []);
        } catch (err) {
          console.error("Error al parsear keywords:", text);
        }

        const resUsage = await fetch("/api/usage");
        if (resUsage.ok) {
          const data = await resUsage.json();
          setUsage(data);
        }

        const resChart = await fetch(`/api/stats/monthly?month=${monthlyView}`);
        if (resChart.ok) {
          const data = await resChart.json();
          if (Array.isArray(data)) {
            setChartData({
              labels: data.map((d: any) =>
                monthlyView === "current"
                  ? new Date(d.dia).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
                  : new Date(d.mes).toLocaleDateString("es-ES", { month: "long" })
              ),
              datasets: [
                {
                  label: "Interacciones del Chatbot",
                  data: data.map((d: any) => parseInt(d.count)),
                },
              ],
            });
          }
        }

        const resKpi = await fetch("/api/stats/kpis");
        if (resKpi.ok) {
          const kpiData = await resKpi.json();
          setKpis(kpiData);
        }
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [monthlyView, router]);

  const mockMessages = [
    { id: 1, sender: "user", content: "¿Cuáles son los precios?", timestamp: Date.now() - 30000 },
    { id: 2, sender: "bot", content: "Nuestros precios dependen del servicio. ¿Qué deseas saber?", timestamp: Date.now() - 20000 },
  ];

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Amy AI Dashboard</h1>

      {usage.plan === "free" && (
        <div className="bg-yellow-500/10 text-yellow-300 p-4 rounded mb-6">
          Estás en el plan gratuito. <a href="/dashboard/profile?upgrade=1" className="underline">Activa tu membresía</a> para desbloquear funciones.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 p-4 rounded">Interacciones Totales: {kpis.total}</div>
        <div className="bg-white/10 p-4 rounded">Usuarios Únicos: {kpis.usuarios}</div>
        <div className="bg-white/10 p-4 rounded">Hora Pico: {kpis.hora_pico ? `${kpis.hora_pico}:00` : "—"}</div>
      </div>

      <div className="mb-4">
        <button onClick={() => setMonthlyView("year")} className="px-3 py-1 mr-2 bg-indigo-600 text-white rounded">
          Año
        </button>
        <button onClick={() => setMonthlyView("current")} className="px-3 py-1 bg-indigo-600 text-white rounded">
          Mes
        </button>
      </div>

      <div className="bg-white/10 p-4 rounded mb-6">
        <h2 className="text-xl mb-2">Historial de Conversaciones</h2>
        {mockMessages.map((msg) => (
          <div key={msg.id} className="mb-2 p-2 border rounded bg-white/5">
            <strong>{msg.sender === "user" ? "👤 Cliente" : "🤖 Bot"}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div className="bg-white/10 p-4 rounded mb-6">
        <h2 className="text-xl mb-2">Palabras clave más frecuentes</h2>
        {keywords.length > 0 ? (
          <ul className="flex flex-wrap gap-3">
            {keywords.map(([word, count]) => (
              <li key={word} className="bg-white/20 px-3 py-1 rounded-full">{word} ({count})</li>
            ))}
          </ul>
        ) : (
          <p>No hay datos aún.</p>
        )}
      </div>
    </div>
  );
}
