"use client";
import { useState } from "react";
import { toast } from "react-toastify";
import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/i18n/LanguageProvider"; // ✅ ADD

interface Props {
  idioma: string;
  categoria: string;
  funciones: string;
  infoClave: string;
  onGenerate: (prompt: string, bienvenida: string) => void;
  disabled?: boolean;
}

export default function VoicePromptGenerator({
  idioma,
  categoria,
  funciones,
  infoClave,
  onGenerate,
  disabled = false,
}: Props) {
  const { t } = useI18n(); // ✅ ADD
  const [loading, setLoading] = useState(false);
  const [modoResumenSMS, setModoResumenSMS] = useState(true);

  const handleGenerate = async () => {
    if (!funciones.trim() || !infoClave.trim()) {
      toast.warn(t("voicePromptGen.warn.fillBoth")); // ✅ i18n
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/voice-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idioma,
          categoria,
          funciones_asistente: funciones.trim(),
          info_clave: infoClave.trim(),
          modo_resumen_sms: modoResumenSMS,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onGenerate(data.prompt, data.bienvenida);
        toast.success(t("voicePromptGen.toast.success")); // ✅ i18n
      } else {
        toast.error(data.error || t("voicePromptGen.toast.error.generate")); // ✅ i18n fallback
      }
    } catch (err) {
      toast.error(t("voicePromptGen.toast.error.server")); // ✅ i18n
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={modoResumenSMS}
          onChange={(e) => setModoResumenSMS(e.target.checked)}
          disabled={disabled}
        />
        {t("voicePromptGen.toggle.label")} {/* ✅ i18n */}
      </label>

      <button
        onClick={handleGenerate}
        disabled={loading || disabled}
        className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t("voicePromptGen.button.loading") : t("voicePromptGen.button.idle")} {/* ✅ i18n */}
      </button>
    </div>
  );
}
