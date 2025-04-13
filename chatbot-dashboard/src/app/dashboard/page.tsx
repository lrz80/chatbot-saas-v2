"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardHome() {
  const [keywords, setKeywords] = useState<[string, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ total: 0, usuarios: 0, hora_pico: null });
  const [chartData, setChartData] = useState<any>(null);
  const [monthlyView, setMonthlyView] = useState<"year" | "current">("year");
  const { messages: lastMessages } = useLastMessages(3);
  const [user, setUser] = useState<any>(null);

  const [usage, setUsage] = useState({
    used: 0,
    limit: null,
    porcentaje: 0,
    plan: "free",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
      //  window.location.href = "/login"; // 🔒 Redirige si no está logueado
        return;
      }    

      try {
        const res = await fetch("/api/keywords");
        const text = await res.text();

        try {
          const data = JSON.parse(text);
          setKeywords(data.keywords || []);
          console.log("✅ Palabras clave:", data.keywords);
        } catch (err) {
          console.error("❌ No es JSON válido (puede ser HTML de error):", text);
        }

        const resUsage = await fetch(`/api/usage`);
        if (resUsage.ok) {
          const usageData = await resUsage.json();
          setUsage(usageData);
        }

        const resChart = await fetch(`/api/stats/monthly?month=${monthlyView}`);

        if (!resChart.ok) {
          console.error("❌ Error al obtener stats/monthly");
          return;
        }

        const chart = await resChart.json();

        if (!Array.isArray(chart)) {
          console.error("❌ Datos inválidos en chart:", chart);
          return;
        }

        setChartData({
          labels: chart.map((d: any) =>
            monthlyView === "current"
              ? new Date(d.dia).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
              : new Date(d.mes).toLocaleDateString("es-ES", { month: "long" })
          ),
          datasets: [
            {
              label: "Interacciones del Chatbot",
              data: chart.map((d: any) => parseInt(d.count)),
              backgroundColor: "rgba(162, 89, 255, 0.5)", // Neon púrpura (coherente con Amy)
              borderColor: "rgba(162, 89, 255, 1)",       // Contorno brillante
              borderWidth: 2,
              borderRadius: 8,                            // Bordes redondeados
              barThickness: 22,
              hoverBackgroundColor: "rgba(162, 89, 255, 0.8)",
              hoverBorderColor: "#fff",
            }
          ]
        });        

        const resKpi = await fetch(`/api/stats/kpis`);

        if (!resKpi.ok) {
          console.error("❌ Error en stats/kpis:", await resKpi.text());
          return;
        }
      
        const dataKpi = await resKpi.json();
        setKpis(dataKpi);
      } catch (e) {
        console.error("💥 Error en dashboard useEffect:", e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [monthlyView]);

  return (
    <div className="relative min-h-screen text-white font-sans">
      {/* Fondo visual */}
      <img
        src="/bg-futurista.jpg"
        alt="Fondo dashboard"
        className="absolute inset-0 w-full h-full object-cover opacity-10 z-0 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0e0e2c]/80 to-[#1e1e3f]/90 z-0" />

      <div className="relative z-10 p-6 max-w-7xl mx-auto">

        {/* Header con branding */}
        <header className="flex items-center justify-between mb-8">
          {/* Avatar de Amy */}
          <div className="flex items-center gap-4">
            <img
              src="/avatar-amy.png"
              alt="Amy AI Avatar"
              className="w-14 h-14 rounded-full border-2 border-indigo-500 shadow-md hover:scale-105 transition-transform duration-300"
            />
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="text-white">Amy</span>{" "}
              <span className="text-indigo-400">AI Dashboard</span>
            </h1>
          </div>

          {/* Lema opcional */}
          <span className="text-sm text-white/60 hidden md:inline">
            Tu asistente inteligente 24/7
          </span>
        </header>

        {usage.plan === "free" && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-400 text-yellow-200 rounded-lg text-center font-medium">
            🚫 Algunas funciones están limitadas. <a href="/dashboard/profile?upgrade=1" className="underline">Activa tu membresía</a> para desbloquear todo el potencial de Amy AI.
          </div>
        )}

        {/* Estado del plan / uso */}
        {usage.plan === "free" && usage.limit !== null && (
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-2xl shadow-[0_0_30px_rgba(132,94,247,0.2)] mb-6">
            <h4 className="text-sm text-white/70 mb-1">📊 Mensajes usados este mes</h4>
            <p className="text-2xl font-bold text-indigo-300">{usage.used} / {usage.limit}</p>
            <div className="w-full h-3 bg-white/10 rounded mt-3 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${usage.porcentaje}%` }}
              />
            </div>
            {usage.porcentaje >= 80 && (
              <p className="text-sm mt-2 text-red-400">⚠️ Estás cerca de tu límite mensual. Considera actualizar tu plan.</p>
            )}
            <p className="text-xs text-white/60 mt-2">🔄 Se reinicia el 1 de cada mes</p>
          </div>
        )}

        {usage.plan === "pro" && (
          <div className="bg-green-500/10 border border-green-300 text-green-200 p-4 rounded-xl text-sm mb-6 shadow">
            🌟 Estás en el <strong>Plan Pro</strong>: mensajes ilimitados.
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[["Interacciones Totales", kpis.total], ["Usuarios Únicos", kpis.usuarios], ["Hora Pico", kpis.hora_pico ? `${kpis.hora_pico}:00 h` : "—"]].map(([label, value], i) => (
            <div key={i} className="bg-white/5 backdrop-blur-lg p-4 rounded-2xl shadow-xl border border-white/10">
              <h4 className="text-sm text-white/70">{label}</h4>
              <p className="text-2xl font-bold text-indigo-200 animate-pulse">{value}</p>
            </div>
          ))}
        </div>

        {/* Filtros de gráfico */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setMonthlyView("year")}
            className={`px-3 py-1 rounded-l transition-all duration-200 ${monthlyView === "year" ? "bg-indigo-600 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
          >
            Año
          </button>
          <button
            onClick={() => setMonthlyView("current")}
            className={`px-3 py-1 rounded-r transition-all duration-200 ${monthlyView === "current" ? "bg-indigo-600 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
          >
            Mes
          </button>
        </div>

        {/* Gráfico y mensajes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10">
            {loading ? (
              <p className="text-center text-white/70">Cargando datos...</p>
            ) : (
              <ChartWidget title="📊 Estadísticas del Chatbot" chartData={chartData} />
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2 text-white">🕓 Historial de Conversaciones</h3>
              <p className="text-white/70">Consulta las últimas interacciones en tiempo real.</p>
              <div className="mt-4 flex flex-col gap-3 text-sm max-h-40 overflow-y-auto pr-1">
                {lastMessages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col p-3 rounded-md shadow-sm ${msg.sender === "user" ? "bg-indigo-500/10 border border-indigo-400/30" : "bg-green-500/10 border border-green-400/30"}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-semibold ${msg.sender === "user" ? "text-indigo-200" : "text-green-200"}`}>
                        {msg.sender === "user" ? "👤 Cliente" : "🤖 Bot"}
                      </span>
                      <span className="text-[11px] text-white/60">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-white/90 text-sm line-clamp-2 hover:line-clamp-none">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-right">
              <a href="/dashboard/history" className="text-indigo-400 hover:underline font-semibold">Ver historial →</a>
            </div>
          </div>
        </div>

        {/* Palabras clave */}
        <div className="mt-8 bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10">
          <h3 className="text-lg font-bold text-indigo-300 mb-2">🔍 Palabras clave más relevantes</h3>
          <ul className="flex flex-wrap gap-3">
            {Array.isArray(keywords) && keywords.length > 0 ? (
              keywords.map(([word, count]) => (
                <li key={word} className="bg-white/10 border border-white/10 px-3 py-1 rounded-full text-sm text-white/80 hover:scale-105 transition">
                  <span className="font-semibold text-white">{word}</span> ({count})
                </li>
              ))
            ) : (
              <li className="text-white/50 text-sm">No hay palabras clave todavía.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
