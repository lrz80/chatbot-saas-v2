// src/components/TrainingHelp.tsx
"use client";

import { useState } from "react";
import { Mic, ChevronDown, ChevronUp, Check, Copy } from "lucide-react";
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

type Section = { title: string; bullets: (string | { label: string; body: string })[] };

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
  flowsTip:
    "Usa flujos con botones para guiar al cliente hacia una acción (agendar, cotizar, calificar leads).",
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
        "Crea Flujos guiados con botones.",
        "Prueba todo en la vista previa.",
      ],
    },
    { title: "Qué escribir", bullets: COMMON.writingTips },
    { title: "FAQs efectivas", bullets: COMMON.faqTips },
    { title: "Flujos guiados", bullets: [COMMON.flowsTip] },
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
        "Crea Flujos con botones y prueba en la vista previa de Meta.",
      ],
    },
    { title: "Qué escribir", bullets: COMMON.writingTips },
    {
      title: "FAQs e Intenciones",
      bullets: [...COMMON.faqTips, "Usa ejemplos reales de tus DMs."],
    },
    { title: "Flujos guiados", bullets: [COMMON.flowsTip] },
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // opcional: manejar error (toast/log)
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20"
      aria-label="Copiar contenido"
      title={copied ? "¡Copiado!" : "Copiar"}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

export default function TrainingHelp({ context, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);

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

      {open && (
        <div
          id={`help-panel-${context}`}
          className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white space-y-4"
        >
          {SECTIONS[context].map((sec, idx) => (
            <div key={idx}>
              <h4 className="font-semibold text-white mb-2">{sec.title}</h4>
              <ul className="list-disc list-inside space-y-2">
                {sec.bullets.map((b, i) =>
                  typeof b === "string" ? (
                    <li key={i}>{b}</li>
                  ) : (
                    <li key={i}>
                      <div className="flex items-center justify-between">
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
          ))}
        </div>
      )}
    </div>
  );
}
