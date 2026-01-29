"use client";

import { useState, useMemo } from "react";
import { BACKEND_URL } from "@/utils/api";
import { SiOpenai, SiDatabricks } from "react-icons/si";
import { useI18n } from "../i18n/LanguageProvider";

interface PromptGeneratorProps {
  infoClave: string;
  funcionesAsistente: string;
  setInfoClave: (value: string) => void;
  setFuncionesAsistente: (value: string) => void;
  idioma: string; // tu idioma actual del tenant (si lo usas en backend)
  membresiaActiva: boolean;
  onPromptGenerated: (prompt: string) => void;
}

export default function PromptGenerator({
  infoClave,
  funcionesAsistente,
  setInfoClave,
  setFuncionesAsistente,
  idioma,
  membresiaActiva,
  onPromptGenerated,
}: PromptGeneratorProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  // Template y placeholder traducibles (flat keys)
  const infoTemplate = useMemo(() => t("promptGen.infoTemplate"), [t]);

  const funcionesPlaceholder = useMemo(
    () => t("promptGen.funciones.placeholder"),
    [t]
  );

  const handleGenerate = async () => {
    if (!membresiaActiva) {
      alert(t("promptGen.alert.membershipRequired"));
      return;
    }

    if (!funcionesAsistente.trim()) {
      alert(t("promptGen.alert.missingFunciones"));
      return;
    }

    if (!infoClave.trim()) {
      alert(t("promptGen.alert.missingInfo"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/generar-prompt`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: funcionesAsistente,
          informacion: infoClave,
          idioma, // se mantiene igual
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (data?.prompt) {
        onPromptGenerated(data.prompt);
      } else {
        alert(t("promptGen.alert.couldNotGenerate"));
      }
    } catch (err) {
      console.error("❌ Error generando prompt:", err);
      alert(t("promptGen.alert.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <label className="block font-medium mb-1 flex items-center gap-2 text-pink-300">
        <SiOpenai size={18} />
        {t("promptGen.funciones.label")}
      </label>

      <textarea
        placeholder={funcionesPlaceholder}
        value={funcionesAsistente}
        onChange={(e) => setFuncionesAsistente(e.target.value)}
        rows={4}
        className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white placeholder-white/50 font-mono"
      />

      <label className="block font-medium mb-1 flex items-center gap-2 text-teal-300">
        <SiDatabricks size={18} />
        {t("promptGen.infoClave.label")}
      </label>

      <textarea
        value={infoClave}
        placeholder={infoTemplate}
        onChange={(e) => setInfoClave(e.target.value)}
        rows={8}
        className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white font-mono placeholder-white/40"
        style={{ whiteSpace: "pre-line" }}
      />

      <button
        onClick={handleGenerate}
        disabled={!membresiaActiva || loading}
        className={`mt-2 px-4 py-2 rounded font-semibold ${
          membresiaActiva
            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
            : "bg-gray-600 text-white/50 cursor-not-allowed"
        }`}
      >
        {loading ? t("promptGen.button.loading") : t("promptGen.button.idle")}
      </button>
      {!membresiaActiva && (
        <p className="text-xs text-red-400 mt-2">
          {t("promptGen.membershipRequiredMessage")}
        </p>
      )}
    </div>
  );
}
