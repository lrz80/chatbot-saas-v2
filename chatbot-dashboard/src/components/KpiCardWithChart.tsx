// components/KpiCardWithChart.tsx
'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

type Props = {
  title: string;
  value: number | string;
  data: number[];
  color?: string;
};

export default function KpiCardWithChart({ title, value, data, color = 'rgba(168, 85, 247, 1)' }: Props) {
  return (
    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 shadow-sm text-white w-full">
      <div className="text-sm text-white/70 mb-1">{title}</div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="h-[60px]">
        <Line
          data={{
            labels: data.map((_, i) => i.toString()),
            datasets: [
              {
                data,
                borderColor: color,
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.3
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { display: false } },
          }}
        />
      </div>
    </div>
  );
}
