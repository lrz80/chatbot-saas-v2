'use client';

import { motion } from 'framer-motion';
import { Store, ShoppingBag, Dumbbell, Brain, CalendarCheck, Languages, Target } from 'lucide-react';
import { useI18n } from "../i18n/LanguageProvider";

const targetList = [
  {
    icon: <Store size={36} />,
    titleKey: "whofor.targets.1.title",
    descKey: "whofor.targets.1.desc",
  },
  {
    icon: <ShoppingBag size={36} />,
    titleKey: "whofor.targets.2.title",
    descKey: "whofor.targets.2.desc",
  },
  {
    icon: <Dumbbell size={36} />,
    titleKey: "whofor.targets.3.title",
    descKey: "whofor.targets.3.desc",
  },
];

const advancedPoints = [
  {
    icon: <Brain className="w-5 h-5 text-purple-300" />,
    titleKey: "whofor.advanced.1.title",
    descKey: "whofor.advanced.1.desc",
  },
  {
    icon: <Languages className="w-5 h-5 text-purple-300" />,
    titleKey: "whofor.advanced.2.title",
    descKey: "whofor.advanced.2.desc",
  },
  {
    icon: <CalendarCheck className="w-5 h-5 text-purple-300" />,
    titleKey: "whofor.advanced.3.title",
    descKey: "whofor.advanced.3.desc",
  },
  {
    icon: <Target className="w-5 h-5 text-purple-300" />,
    titleKey: "whofor.advanced.4.title",
    descKey: "whofor.advanced.4.desc",
  },
];

export default function ParaQuienEsAmy() {
  const { t } = useI18n();
  return (
    <section className="mt-20 px-6 py-12 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 max-w-6xl mx-auto shadow-xl">
      <h2 className="text-3xl md:text-4xl font-extrabold text-purple-300 text-center mb-6">
        {t("whofor.title")} <span className="text-purple-300">Aamy</span>?
      </h2>

      <p className="text-center text-gray-300 text-base md:text-lg mb-10 max-w-4xl mx-auto">
        {t("whofor.subtitle.before")}{" "}
        <span className="text-white font-semibold">{t("whofor.subtitle.highlight")}</span>{" "}
        {t("whofor.subtitle.after")}
      </p>

      {/* Puntos “IA avanzada” (sube percepción de valor antes del filtro) */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-5xl mx-auto">
        {advancedPoints.map((p, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{p.icon}</div>
              <div>
                <h4 className="text-white font-semibold mb-1">{t(p.titleKey)}</h4>
                <p className="text-sm text-gray-300">{t(p.descKey)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fit / Not fit */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-4xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-2">{t("whofor.fit.good.title")}</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• {t("whofor.fit.good.1")}</li>
            <li>• {t("whofor.fit.good.2")}</li>
            <li>• {t("whofor.fit.good.3")}</li>
            <li>• {t("whofor.fit.good.4")}</li>
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h4 className="text-white font-semibold mb-2">{t("whofor.fit.bad.title")}</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• {t("whofor.fit.bad.1")}</li>
            <li>• {t("whofor.fit.bad.2")}</li>
            <li>• {t("whofor.fit.bad.3")}</li>
          </ul>
        </div>
      </div>

      {/* Verticales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {targetList.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.2 }}
            viewport={{ once: true }}
            className="bg-white/10 p-6 rounded-xl border border-white/20 text-center hover:bg-white/20 transition"
          >
            <div className="flex justify-center mb-4 text-purple-300">{item.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">{t(item.titleKey)}</h3>
            <p className="text-sm text-gray-300">{t(item.descKey)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
