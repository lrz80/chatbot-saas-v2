"use client";

import { useEffect, useMemo, useState } from "react";
import { Mic, ChevronDown, ChevronUp, Check, Copy, Search, Sparkles, Link2 } from "lucide-react";
import { SiMeta, SiWhatsapp } from "react-icons/si";
import { FaSms, FaEnvelope } from "react-icons/fa";

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

const COMMON = {
  writingTips: [
    "Sé específico sobre lo que debe hacer el asistente (vender, agendar, segmentar, etc.).",
    "Pega la información clave como texto corrido. Evita listas con guiones.",
    "No pongas “ver más en nuestra web”: el asistente no abre enlaces externos.",
    "Incluye precios, horarios, ubicación, políticas y promociones vigentes.",
  ],
  faqTips: [
    "Escribe las preguntas como lo haría un cliente (p. ej., “¿Cuánto cuesta?”).",
    "Responde de forma completa y amable; evita “depende” o “consúltanos”.",
  ],
  template: `Servicios y precios: ...
Ubicación: ...
Horarios: ...
Políticas: ...
Promociones vigentes: ...
Links internos o de pago: ...`,
};

const SECTIONS: Record<Props["context"], Section[]> = {
  training: [
    {
      title: "Pasos rápidos",
      bullets: [
        "Completa “¿Qué debe hacer tu asistente?”.",
        "Llena “Información que debe conocer”.",
        "Personaliza el “Mensaje de bienvenida”.",
        "Añade Preguntas Frecuentes (FAQs).",
        "Configura Entrenamiento por Intención (frases + respuesta).",
        "Prueba todo en la vista previa.",
      ],
    },
    { title: "Qué escribir", bullets: COMMON.writingTips },
    { title: "FAQs efectivas", bullets: COMMON.faqTips },
    {
      title: "Plantilla de información (copiar/pegar)",
      bullets: [{ label: "Usa este esquema:", body: COMMON.template }],
    },
    {
      title: "Errores comunes",
      bullets: [
        "Poner solo enlaces (“ver web”).",
        "Respuestas vagas (“depende”).",
        "Información en bullets que se omite en el generador.",
      ],
    },
  ],
  meta: [
    {
      title: "Pasos rápidos",
      bullets: [
        "Conecta tu Facebook/Instagram en Integraciones.",
        "Completa la información del negocio y el mensaje de bienvenida.",
        "Añade FAQs e Intenciones por canal “meta”.",
        "Prueba en la vista previa de Meta.",
      ],
    },
    { title: "Qué escribir", bullets: COMMON.writingTips },
    {
      title: "FAQs e Intenciones",
      bullets: [...COMMON.faqTips, "Usa ejemplos reales de tus DMs."],
    },
    {
      title: "Plantilla de información (copiar/pegar)",
      bullets: [{ label: "Usa este esquema:", body: COMMON.template }],
    },
  ],
  voice: [
    {
      title: "Pasos rápidos",
      bullets: [
        "Elige idioma y voz.",
        "Define qué debe lograr (agendar, calificar, cobrar, etc.).",
        "Rellena la información clave.",
        "Añade Hints (frases clave separadas por comas).",
        "Haz una llamada de prueba.",
      ],
    },
    {
      title: "Buenas prácticas",
      bullets: [
        ...COMMON.writingTips,
        "En Hints, usa frases cortas y comunes (p. ej., “quiero reservar, precio de clases, dirección”).",
      ],
    },
    {
      title: "Plantilla de información (copiar/pegar)",
      bullets: [{ label: "Usa este esquema:", body: COMMON.template }],
    },
  ],
  "campaign-sms": [
    {
      title: "Pasos rápidos",
      bullets: [
        "Carga contactos (CSV).",
        "Escribe el contenido del SMS (puedes incluir un link).",
        "Programa fecha y hora de envío.",
        "Revisa campañas programadas y estadísticas.",
      ],
    },
    {
      title: "Consejos",
      bullets: [
        "Sé breve y claro; incluye una llamada a la acción.",
        "Segmenta para mejorar la conversión.",
      ],
    },
  ],
  "campaign-email": [
    {
      title: "Pasos rápidos",
      bullets: [
        "Carga contactos (CSV) y selecciona segmentos.",
        "Escribe Asunto y Mensaje; agrega imagen si quieres.",
        "Programa fecha y hora.",
        "Monitorea aperturas, clics y conversiones.",
      ],
    },
    { title: "Consejos", bullets: ["Asuntos cortos y directos.", "Incluye un CTA claro."] },
  ],
};

const TITLES: Record<Props["context"], string> = {
  training: "¿Cómo entrenar tu asistente?",
  meta: "¿Cómo funciona la integración con Facebook e Instagram?",
  voice: "¿Cómo configurar tu asistente por voz?",
  "campaign-sms": "¿Cómo enviar campañas por SMS?",
  "campaign-email": "¿Cómo enviar campañas por Email?",
};

function CopyButton({ text, label }: { text: string; label?: string }) {
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

  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20"
      aria-label={label ? `Copiar ${label}` : "Copiar contenido"}
      title={copied ? "¡Copiado!" : label ?? "Copiar"}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copiado" : label ?? "Copiar"}
    </button>
  );
}

export default function TrainingHelp({ context, defaultOpen = false }: Props) {
  const storageKey = `traininghelp:${context}`;
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");

  // Cargar estado persistido
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

  // Guardar estado persistido
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, open ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [open, storageKey]);

  const sections = useMemo(() => SECTIONS[context] ?? [], [context]);

  // Filtrado por buscador
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((sec) => {
        const matchTitle = sec.title.toLowerCase().includes(q);
        const bullets = sec.bullets.filter((b) => {
          if (typeof b === "string") return b.toLowerCase().includes(q);
          return (
            b.label.toLowerCase().includes(q) ||
            b.body.toLowerCase().includes(q)
          );
        });
        if (matchTitle || bullets.length > 0) {
          return { ...sec, bullets: bullets.length > 0 || matchTitle ? bullets.length ? bullets : sec.bullets : [] };
        }
        return null;
      })
      .filter(Boolean) as Section[];
  }, [sections, query]);

  // Recolectar todos los "body" copiables de la vista actual
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

  // Atajos de navegación (solo hace scroll si el elemento existe)
  const goToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
          {TITLES[context]}
        </span>
        {open ? <ChevronUp /> : <ChevronDown />}
      </button>

      {/* Panel con animación de colapso */}
      <div
        id={`help-panel-${context}`}
        role="region"
        aria-label={TITLES[context]}
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          open ? "max-h-[1200px] opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
      >
        {open && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white space-y-4">
            {/* Toolbar de utilidades */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5" size={16} />
                  <input
                    placeholder="Buscar en la ayuda…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-8 pr-3 py-2 rounded bg-white/10 border border-white/20 w-full md:w-64"
                    aria-label="Buscar en la ayuda"
                  />
                </div>
                {allTemplatesText && (
                  <CopyButton text={allTemplatesText} label="Copiar todas las plantillas" />
                )}
              </div>

              {/* Atajos (no rompen si no existen IDs en la página) */}
              {context === "training" && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => goToAnchor("bienvenida")}
                    className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1"
                    title="Ir a Bienvenida"
                  >
                    <Link2 size={14} /> Bienvenida
                  </button>
                  <button
                    type="button"
                    onClick={() => goToAnchor("prompt")}
                    className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1"
                    title="Ir a Prompt del sistema"
                  >
                    <Link2 size={14} /> Prompt
                  </button>
                  <button
                    type="button"
                    onClick={() => goToAnchor("faqs")}
                    className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1"
                    title="Ir a FAQs"
                  >
                    <Link2 size={14} /> FAQs
                  </button>
                  <button
                    type="button"
                    onClick={() => goToAnchor("intents")}
                    className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1"
                    title="Ir a Intenciones"
                  >
                    <Link2 size={14} /> Intenciones
                  </button>
                  <button
                    type="button"
                    onClick={() => goToAnchor("preview")}
                    className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1"
                    title="Ir a Vista previa"
                  >
                    <Link2 size={14} /> Vista previa
                  </button>
                </div>
              )}
            </div>

            {/* Contenido */}
            {filtered.length === 0 ? (
              <p className="text-white/70 italic">No hay resultados para “{query}”.</p>
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
