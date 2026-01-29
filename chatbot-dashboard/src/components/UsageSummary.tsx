// src/components/UsageSummary.tsx

"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/i18n/LanguageProvider";


interface UsoMensual {
  canal: string;
  usados: number;
  limite: number;
}

export default function UsageSummary() {
  const { t } = useI18n();

  const [usos, setUsos] = useState<UsoMensual[]>([]);

  useEffect(() => {
    fetch("/api/usage", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setUsos(data.usos || []);
      })
      .catch(err => console.error(err));
  }, []);

  async function comprarMas(canal: string, cantidad: number) {
    const res = await fetch("/api/uso-mensual/upgrade", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canal, cantidad }),
    });

    if (res.ok) {
      alert(t("usage.addedSuccess"));
      location.reload(); // O actualiza los datos con setUsos
    } else {
      alert(t("usage.addedError"));
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">
        {t("usage.title")}
      </h2>
      {usos.map((uso) => (
        <div
          key={uso.canal}
          className="bg-white/10 p-4 rounded-xl shadow border border-white/20"
        >
          <h3 className="text-white capitalize">
            {t("usage.channel")}: {uso.canal}
          </h3>
          <p className="text-white text-sm mb-1">
            {t("usage.of", { used: uso.usados, limit: uso.limite })}
          </p>
          <Progress value={(uso.usados / uso.limite) * 100} />
          <div className="flex gap-2 mt-3">
            {[500, 1000, 2000].map((extra) => (
              <button
                key={extra}
                onClick={() => comprarMas(uso.canal, extra)}
                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-xl text-sm"
              >
                +{extra}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
