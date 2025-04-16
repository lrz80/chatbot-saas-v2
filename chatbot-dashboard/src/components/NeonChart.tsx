'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function NeonChart({ data }: { data: any }) {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#c084fc',
          font: { size: 14 }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#a3a3a3' },
        grid: { color: '#27272a' }
      },
      y: {
        ticks: { color: '#a3a3a3' },
        grid: { color: '#27272a' }
      }
    }
  };

  const neonData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Interacciones del Chatbot',
        data: data.datasets[0].data,
        fill: false,
        borderColor: '#c084fc',
        backgroundColor: '#c084fc',
        tension: 0.4,
        pointBackgroundColor: '#a855f7',
        pointBorderColor: '#c084fc',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#c084fc'
      }
    ]
  };

  return (
    <div className="bg-white/5 p-6 rounded-xl shadow-lg border border-purple-600/20">
      <h2 className="text-2xl font-bold text-purple-300 mb-4 drop-shadow-[0_0_8px_#c084fc]">
        Interacciones por Mes
      </h2>
      <Line data={neonData} options={options} />
    </div>
  );
}
