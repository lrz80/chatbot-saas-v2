"use client";

import { useEffect, useMemo, useState } from "react";
import { Mic, ChevronDown, ChevronUp, Check, Copy, Search, Sparkles, Link2, Info } from "lucide-react";
import { SiMeta, SiWhatsapp } from "react-icons/si";
import { FaSms, FaEnvelope } from "react-icons/fa";
import { useI18n } from "@/i18n/LanguageProvider";

interface Props {
  context: "training" | "meta" | "voice" | "campaign-sms" | "campaign-email";
  defaultOpen?: boolean;
}

const ICONS = {
  training: <SiWhatsapp className="text-green-400" />,
  meta: <SiMeta className="text-blue-500" />,
  voice: <Mic className="text-purple-400" />,
  "campaign-sms": <FaSms className="text-yellow-400" />,
  "campaign-email": <FaEnvelope className="text-teal-300" />,
} as const;

type Bullet =
  | string
  | {
      label: string;
      body: string;
    };

type Section = { title: string; bullets: Bullet[] };

// ⚠️ Mantén esta lista sincronizada con CTASection.tsx
const ALLOWED_INTENTS = [
  "global",
  "precio",
  "horario",
  "ubicacion",
  "reservar",
  "comprar",
  "confirmar",
  "interes_clases",
];

function CopyButton({ text, label }: { text: string; label?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const aria = label ? t("trainingHelp.copy.ariaWithLabel", { label }) : t("trainingHelp.copy.aria");
  const title = copied ? t("trainingHelp.copy.copiedTitle") : (label ?? t("trainingHelp.copy.defaultLabel"));

  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20"
      aria-label={aria}
      title={title}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? t("trainingHelp.copy.copiedLabel") : (label ?? t("trainingHelp.copy.defaultLabel"))}
    </button>
  );
}

export default function TrainingHelp({ context, defaultOpen = false }: Props) {
  const { t } = useI18n();

  const storageKey = `traininghelp:${context}`;
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");

  const titles: Record<Props["context"], string> = useMemo(
    () => ({
      training: t("trainingHelp.title.training"),
      meta: t("trainingHelp.title.meta"),
      voice: t("trainingHelp.title.voice"),
      "campaign-sms": t("trainingHelp.title.campaignSms"),
      "campaign-email": t("trainingHelp.title.campaignEmail"),
    }),
    [t]
  );

  const common = useMemo(
    () => ({
      writingTips: [
        t("trainingHelp.common.writingTips.1"),
        t("trainingHelp.common.writingTips.2"),
        t("trainingHelp.common.writingTips.3"),
        t("trainingHelp.common.writingTips.4"),
      ],
      faqTips: [
        t("trainingHelp.common.faqTips.1"),
        t("trainingHelp.common.faqTips.2"),
      ],
      template: t("trainingHelp.common.template"),
    }),
    [t]
  );

  const ctaExplanation = useMemo(
    () => [
      t("trainingHelp.cta.explanation.1"),
      t("trainingHelp.cta.explanation.2"),
      t("trainingHelp.cta.explanation.3"),
      t("trainingHelp.cta.explanation.4"),
      t("trainingHelp.cta.explanation.5"),
    ],
    [t]
  );

  const sectionsByContext: Record<Props["context"], Section[]> = useMemo(
    () => ({
      training: [
        {
          title: t("trainingHelp.sections.training.quickSteps.title"),
          bullets: [
            t("trainingHelp.sections.training.quickSteps.1"),
            t("trainingHelp.sections.training.quickSteps.2"),
            t("trainingHelp.sections.training.quickSteps.3"),
            t("trainingHelp.sections.training.quickSteps.4"),
            t("trainingHelp.sections.training.quickSteps.5"),
            t("trainingHelp.sections.training.quickSteps.6"),
            t("trainingHelp.sections.training.quickSteps.7"),
          ],
        },
        { title: t("trainingHelp.sections.training.whatToWrite.title"), bullets: common.writingTips },
        { title: t("trainingHelp.sections.training.faqsEffective.title"), bullets: common.faqTips },
        {
          title: t("trainingHelp.sections.training.infoTemplate.title"),
          bullets: [{ label: t("trainingHelp.sections.training.infoTemplate.label"), body: common.template }],
        },
        {
          title: t("trainingHelp.sections.training.ctaByIntent.title"),
          bullets: [
            t("trainingHelp.sections.training.ctaByIntent.step1"),
            ...ctaExplanation,
            {
              label: t("trainingHelp.sections.training.ctaByIntent.allowedIntentsLabel"),
              body: ALLOWED_INTENTS.join(", "),
            },
            {
              label: t("trainingHelp.sections.training.ctaByIntent.baseTemplateLabel"),
              body: t("trainingHelp.cta.template"),
            },
            {
              label: t("trainingHelp.sections.training.ctaByIntent.examplesFitnessLabel"),
              body: t("trainingHelp.cta.examplesFitness"),
            },
            {
              label: t("trainingHelp.sections.training.ctaByIntent.examplesBeautyLabel"),
              body: t("trainingHelp.cta.examplesBeauty"),
            },
          ],
        },
        {
          title: t("trainingHelp.sections.training.commonMistakes.title"),
          bullets: [
            t("trainingHelp.sections.training.commonMistakes.1"),
            t("trainingHelp.sections.training.commonMistakes.2"),
            t("trainingHelp.sections.training.commonMistakes.3"),
            t("trainingHelp.sections.training.commonMistakes.4"),
            t("trainingHelp.sections.training.commonMistakes.5"),
          ],
        },
      ],

      meta: [
        {
          title: t("trainingHelp.sections.meta.quickSteps.title"),
          bullets: [
            t("trainingHelp.sections.meta.quickSteps.1"),
            t("trainingHelp.sections.meta.quickSteps.2"),
            t("trainingHelp.sections.meta.quickSteps.3"),
            t("trainingHelp.sections.meta.quickSteps.4"),
          ],
        },
        { title: t("trainingHelp.sections.meta.whatToWrite.title"), bullets: common.writingTips },
        {
          title: t("trainingHelp.sections.meta.faqsAndIntents.title"),
          bullets: [...common.faqTips, t("trainingHelp.sections.meta.faqsAndIntents.extra")],
        },
        {
          title: t("trainingHelp.sections.meta.infoTemplate.title"),
          bullets: [{ label: t("trainingHelp.sections.meta.infoTemplate.label"), body: common.template }],
        },
      ],

      voice: [
        {
          title: t("trainingHelp.sections.voice.quickSteps.title"),
          bullets: [
            t("trainingHelp.sections.voice.quickSteps.1"),
            t("trainingHelp.sections.voice.quickSteps.2"),
            t("trainingHelp.sections.voice.quickSteps.3"),
            t("trainingHelp.sections.voice.quickSteps.4"),
            t("trainingHelp.sections.voice.quickSteps.5"),
          ],
        },
        {
          title: t("trainingHelp.sections.voice.bestPractices.title"),
          bullets: [
            ...common.writingTips,
            t("trainingHelp.sections.voice.bestPractices.hintsTip"),
          ],
        },
        {
          title: t("trainingHelp.sections.voice.infoTemplate.title"),
          bullets: [{ label: t("trainingHelp.sections.voice.infoTemplate.label"), body: common.template }],
        },
      ],

      "campaign-sms": [
        {
          title: t("trainingHelp.sections.campaignSms.quickSteps.title"),
          bullets: [
            t("trainingHelp.sections.campaignSms.quickSteps.1"),
            t("trainingHelp.sections.campaignSms.quickSteps.2"),
            t("trainingHelp.sections.campaignSms.quickSteps.3"),
            t("trainingHelp.sections.campaignSms.quickSteps.4"),
          ],
        },
        {
          title: t("trainingHelp.sections.campaignSms.tips.title"),
          bullets: [
            t("trainingHelp.sections.campaignSms.tips.1"),
            t("trainingHelp.sections.campaignSms.tips.2"),
          ],
        },
      ],

      "campaign-email": [
        {
          title: t("trainingHelp.sections.campaignEmail.quickSteps.title"),
          bullets: [
            t("trainingHelp.sections.campaignEmail.quickSteps.1"),
            t("trainingHelp.sections.campaignEmail.quickSteps.2"),
            t("trainingHelp.sections.campaignEmail.quickSteps.3"),
            t("trainingHelp.sections.campaignEmail.quickSteps.4"),
          ],
        },
        {
          title: t("trainingHelp.sections.campaignEmail.tips.title"),
          bullets: [
            t("trainingHelp.sections.campaignEmail.tips.1"),
            t("trainingHelp.sections.campaignEmail.tips.2"),
          ],
        },
      ],
    }),
    [t, common, ctaExplanation]
  );

  const sections = useMemo(() => sectionsByContext[context] ?? [], [sectionsByContext, context]);

  // Load persisted open state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) setOpen(saved === "1");
      else setOpen(defaultOpen);
    } catch {
      setOpen(defaultOpen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  // Save persisted open state
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, open ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [open, storageKey]);

  // Filter by search query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;

    return sections
      .map((sec) => {
        const matchTitle = sec.title.toLowerCase().includes(q);
        const bullets = sec.bullets.filter((b) => {
          if (typeof b === "string") return b.toLowerCase().includes(q);
          return b.label.toLowerCase().includes(q) || b.body.toLowerCase().includes(q);
        });

        if (matchTitle || bullets.length > 0) {
          return {
            ...sec,
            bullets: bullets.length > 0 || matchTitle ? (bullets.length ? bullets : sec.bullets) : [],
          };
        }
        return null;
      })
      .filter(Boolean) as Section[];
  }, [sections, query]);

  // Collect copyable bodies from current view
  const allTemplatesText = useMemo(() => {
    const lines: string[] = [];
    for (const sec of filtered) {
      for (const b of sec.bullets) {
        if (typeof b !== "string" && b.body) {
          lines.push(`// ${b.label}\n${b.body}`);
        }
      }
    }
    return lines.join("\n\n");
  }, [filtered]);

  const goToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const panelTitle = titles[context];

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`help-panel-${context}`}
        className="flex items-center justify-between w-full bg-white/10 text-white px-4 py-3 rounded-md font-semibold hover:bg-white/20 transition border border-white/20"
      >
        <span className="flex items-center gap-2">
          {ICONS[context]}
          {panelTitle}
        </span>
        {open ? <ChevronUp /> : <ChevronDown />}
      </button>

      <div
        id={`help-panel-${context}`}
        role="region"
        aria-label={panelTitle}
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          open ? "max-h-[1600px] opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
      >
        {open && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white space-y-4">
            {context === "training" && (
              <div className="flex items-start gap-2 text-white/80">
                <Info size={16} className="mt-0.5" />
                <p>
                  {t("trainingHelp.training.note.prefix")}{" "}
                  <b>{t("trainingHelp.training.note.bold1")}</b>,{" "}
                  <b>{t("trainingHelp.training.note.bold2")}</b>,{" "}
                  <b>{t("trainingHelp.training.note.bold3")}</b>,{" "}
                  <b>{t("trainingHelp.training.note.bold4")}</b>{" "}
                  {t("trainingHelp.training.note.suffix")}
                </p>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5" size={16} />
                  <input
                    placeholder={t("trainingHelp.search.placeholder")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-8 pr-3 py-2 rounded bg-white/10 border border-white/20 w-full md:w-64"
                    aria-label={t("trainingHelp.search.aria")}
                  />
                </div>
                {allTemplatesText && (
                  <CopyButton text={allTemplatesText} label={t("trainingHelp.copyAllTemplates")} />
                )}
              </div>

              {context === "training" && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => goToAnchor("bienvenida")}
                    className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1"
                    title={t("trainingHelp.shortcuts.welcome.title")}
                  >
                    <Link2 size={14} /> {t("trainingHelp.shortcuts.welcome.label")}
                  </button>

                  <button
                    type="button"
                    onClick={() => goToAnchor("prompt")}
                    className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1"
                    title={t("trainingHelp.shortcuts.prompt.title")}
                  >
                    <Link2 size={14} /> {t("trainingHelp.shortcuts.prompt.label")}
                  </button>

                  <button
                    type="button"
                    onClick={() => goToAnchor("faqs")}
                    className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1"
                    title={t("trainingHelp.shortcuts.faqs.title")}
                  >
                    <Link2 size={14} /> {t("trainingHelp.shortcuts.faqs.label")}
                  </button>

                  <button
                    type="button"
                    onClick={() => goToAnchor("intents")}
                    className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1"
                    title={t("trainingHelp.shortcuts.intents.title")}
                  >
                    <Link2 size={14} /> {t("trainingHelp.shortcuts.intents.label")}
                  </button>

                  <button
                    type="button"
                    onClick={() => goToAnchor("ctas")}
                    className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1"
                    title={t("trainingHelp.shortcuts.cta.title")}
                  >
                    <Link2 size={14} /> {t("trainingHelp.shortcuts.cta.label")}
                  </button>

                  <button
                    type="button"
                    onClick={() => goToAnchor("preview")}
                    className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1"
                    title={t("trainingHelp.shortcuts.preview.title")}
                  >
                    <Link2 size={14} /> {t("trainingHelp.shortcuts.preview.label")}
                  </button>
                </div>
              )}
            </div>

            {filtered.length === 0 ? (
              <p className="text-white/70 italic">
                {t("trainingHelp.search.noResults", { query })}
              </p>
            ) : (
              filtered.map((sec, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-md p-3">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Sparkles size={16} /> {sec.title}
                  </h4>
                  <ul className="list-disc list-inside space-y-2">
                    {sec.bullets.map((b, i) =>
                      typeof b === "string" ? (
                        <li key={i}>{b}</li>
                      ) : (
                        <li key={i}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{b.label}</span>
                            <CopyButton text={b.body} />
                          </div>
                          <div className="mt-1 font-mono text-xs bg-black/20 border border-white/10 rounded p-2 whitespace-pre-wrap">
                            {b.body}
                          </div>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
