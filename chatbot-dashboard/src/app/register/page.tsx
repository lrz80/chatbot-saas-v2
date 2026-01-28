"use client";

import Footer from '@/components/Footer';
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaRobot,
  FaChartBar,
  FaWhatsapp,
  FaFacebookMessenger,
  FaInstagram,
  FaMicrophoneAlt,
  FaBullhorn,
} from "react-icons/fa";
import { BACKEND_URL } from "@/utils/api";
import { track } from '@/lib/metaPixel';
import { useI18n } from "../../i18n/LanguageProvider";

const nodos = [
  { Icon: FaRobot, color: "#a855f7", titleKey: "register.nodes.attention.title", descKey: "register.nodes.attention.desc", posClass: "top-[5%] left-[10%]", x: 10, y: 5 },
  { Icon: FaChartBar, color: "#6366f1", titleKey: "register.nodes.stats.title", descKey: "register.nodes.stats.desc", posClass: "top-[5%] right-[10%]", x: 90, y: 5 },
  { Icon: FaWhatsapp, color: "#25D366", titleKey: "register.nodes.whatsapp.title", descKey: "register.nodes.whatsapp.desc", posClass: "top-[50%] left-[2%]", x: 2, y: 50 },
  { Icon: FaFacebookMessenger, color: "#0084FF", titleKey: "register.nodes.facebook.title", descKey: "register.nodes.facebook.desc", posClass: "top-[50%] right-[2%]", x: 98, y: 50 },
  { Icon: FaInstagram, color: "#E1306C", titleKey: "register.nodes.instagram.title", descKey: "register.nodes.instagram.desc", posClass: "bottom-[20%] left-[15%]", x: 15, y: 80 },
  { Icon: FaMicrophoneAlt, color: "#6366f1", titleKey: "register.nodes.voice.title", descKey: "register.nodes.voice.desc", posClass: "bottom-[20%] right-[15%]", x: 85, y: 80 },
  { Icon: FaBullhorn, color: "#facc15", titleKey: "register.nodes.campaigns.title", descKey: "register.nodes.campaigns.desc", posClass: "bottom-[5%] left-[40%]", x: 40, y: 95 },
];

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // 👉 Detecta timezone del navegador (IANA)
  const timezoneGuess = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      // 1) Registro con timezone incluida
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          timezone: timezoneGuess, // 👈 se envía al backend de registro
        }),
      });

      const contentType = res.headers.get("Content-Type") || "";
      let data: any = null;
      if (contentType.includes("application/json")) {
        data = await res.json();
      }
      if (!res.ok) {
        const msg = data?.error || t("register.errors.failed");
        throw new Error(msg);
      }

      // ✅ Meta Pixel: registro completado
      track("CompleteRegistration", {
        content_name: "Aamy AI Register",
        status: "success",
      });

      // 2) Fallback: intenta fijar timezone en el tenant (por si /auth/register no la guarda)
      try {
        await fetch(`${BACKEND_URL}/tenants/timezone`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ timezone: timezoneGuess }),
        });
      } catch (e) {
        // No bloquea el flujo si falla; solo log
        console.warn("No se pudo fijar timezone vía PATCH /tenants/timezone:", e);
      }

      setSuccess(true);
      // Si quieres redirigir a onboarding:
      // router.push("/onboarding");
    } catch (error: any) {
      console.error("❌ Error al registrar:", error);
      setError(error?.message || t("register.errors.unknown"));
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black text-white px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/30 to-black z-0" />

      <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {nodos.map((nodo, index) => (
          <line
            key={index}
            x1="50%"
            y1="50%"
            x2={`${nodo.x}%`}
            y2={`${nodo.y}%`}
            stroke="white"
            strokeOpacity="0.15"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="absolute inset-0 z-10">
        {nodos.map((nodo, index) => {
          const Icon = nodo.Icon;
          return (
            <div
              key={index}
              className={`absolute ${nodo.posClass} ${index > 3 ? "hidden sm:block" : ""} bg-white/5 border border-white/10 p-3 rounded-xl w-48 md:w-60 max-w-[90vw] backdrop-blur-md shadow-lg hover:scale-105 transition-transform text-sm`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon size={36} style={{ color: nodo.color }} />
                <span className="text-white text-base font-semibold">{t(nodo.titleKey)}</span>
              </div>
              <p className="text-sm text-white/60">{t(nodo.descKey)}</p>
            </div>
          );
        })}
      </div>

      {!success ? (
        <form onSubmit={handleRegister} className="relative z-20 w-full max-w-md bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-2xl p-8 shadow-2xl space-y-4">
          <h2 className="text-2xl font-bold text-center text-purple-300">{t("register.title")}</h2>

          {error && <p className="bg-red-100 text-red-700 p-2 rounded text-sm text-center">{error}</p>}

          <div className="flex gap-4">
            <input
              name="nombre"
              type="text"
              placeholder={t("register.form.firstName")}
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
            />
            <input
              name="apellido"
              type="text"
              placeholder={t("register.form.lastName")}
              value={formData.apellido}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
            />
          </div>

          <input
            name="email"
            type="email"
            placeholder={t("register.form.email")}
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
          />

          <input
            name="telefono"
            type="tel"
            placeholder={t("register.form.phone")}
            value={formData.telefono}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
          />

          <input
            name="password"
            type="password"
            placeholder={t("register.form.password")}
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded bg-white/10 placeholder-white/70 border border-white/20"
          />

          {/* 👇 Solo informativo; si prefieres, ocúltalo */}
          <div className="hidden">
            {t("register.debug.timezone")}: <span className="text-white/80 font-mono">{timezoneGuess}</span>
          </div>

          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-semibold transition duration-200">
            {t("register.form.submit")}
          </button>

          <p className="text-center text-sm text-white/60 mt-2">
            {t("register.links.haveAccount")}{" "}
            <a href="/login" className="text-purple-400 hover:text-purple-300 underline">
              {t("register.links.login")}
            </a>
          </p>
          <Footer />
        </form>
      ) : (
        <div className="relative z-20 w-full max-w-md bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-2xl p-8 shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-purple-300 mb-4">{t("register.success.title")}</h2>
          <p className="text-white/80 text-sm">{t("register.success.subtitle")}</p>
        </div>
      )}
    </div>
  );
}
