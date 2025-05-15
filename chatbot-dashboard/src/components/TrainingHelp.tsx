// src/components/TrainingHelp.tsx
"use client";

import { useState } from "react";
import { Mic, ChevronDown, ChevronUp } from "lucide-react";
import { SiMeta, SiWhatsapp } from "react-icons/si";
import { FaSms, FaEnvelope } from "react-icons/fa";

interface Props {
  context: "training" | "meta" | "voice" | "campaign-sms" | "campaign-email";
}

export default function TrainingHelp({ context }: Props) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen(!open);

  const contextTitles: Record<Props["context"], string> = {
    training: "¿Cómo entrenar tu asistente?",
    meta: "¿Cómo funciona la integración con Facebook e Instagram?",
    voice: "¿Cómo configurar tu asistente por voz?",
    "campaign-sms": "¿Cómo enviar campañas por SMS?",
    "campaign-email": "¿Cómo enviar campañas por Email?",
  };

  return (
    <div className="mb-6">
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full bg-white/10 text-white px-4 py-3 rounded-md font-semibold hover:bg-white/20 transition border border-white/20"
      >
        <span className="flex items-center gap-2">
          {context === "training" && <SiWhatsapp className="text-green-400" />}
          {context === "meta" && <SiMeta className="text-blue-500" />}
          {context === "voice" && <Mic className="text-purple-400" />}
          {context === "campaign-sms" && <FaSms className="text-yellow-400" />}
          {context === "campaign-email" && (
            <FaEnvelope className="text-teal-300" />
          )}
          {contextTitles[context]}
        </span>
        {open ? <ChevronUp /> : <ChevronDown />}
      </button>

      {open && (
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white space-y-3">
          {context === "training" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>¿Qué debe hacer tu asistente?</strong> Describe sus funciones principales.</li>
              <li><strong>Información que el Asistente debe conocer:</strong> Servicios, precios, links, etc.</li>
              <li><strong>Mensaje de bienvenida:</strong> Primer mensaje que verá el usuario.</li>
              <li><strong>Instrucciones:</strong> Cómo debe hablar y responder el asistente.</li>
              <li><strong>Preguntas frecuentes:</strong> Respuestas a dudas comunes.</li>
              <li><strong>Entrenamiento por intención:</strong> Enseña al asistente frases específicas.</li>
              <li><strong>Flujos guiados:</strong> Conversaciones paso a paso con botones.</li>
              <li><strong>Vista previa:</strong> Prueba el comportamiento del asistente.</li>
            </ul>
          )}

          {context === "meta" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Conexión:</strong> Vincula tu página de Facebook e Instagram.</li>
              <li><strong>Entrenamiento por intención:</strong> Frases de entrenamiento para reconocer intenciones.</li>
              <li><strong>Información que el Asistente debe conocer:</strong> Servicios, precios, links, etc.</li>
              <li><strong>Mensaje de bienvenida:</strong> Primer mensaje automático.</li>
              <li><strong>Instrucciones:</strong> Cómo responder y qué tono usar.</li>
              <li><strong>Preguntas frecuentes:</strong> Respuestas automáticas.</li>
              <li><strong>Flujos guiados:</strong> Conversaciones guiadas con botones.</li>
              <li><strong>Vista previa:</strong> Prueba cómo responde tu asistente.</li>
            </ul>
          )}

          {context === "voice" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Idioma:</strong> Idioma principal para llamadas.</li>
              <li><strong>¿Qué debe hacer tu asistente?</strong> Describe sus funciones principales.</li>
              <li><strong>Información clave sobre tu negocio:</strong> Servicios, precios, links, etc.</li>
              <li><strong>Instrucciones del sistema:</strong> Cómo responder y qué debe saber el asistente.</li>
              <li><strong>Mensaje de bienvenida:</strong> Introducción cuando llaman.</li>
              <li><strong>Voz del asistente:</strong> Selección de voz.</li>
              <li><strong>Hints:</strong> Palabras clave importantes.</li>
              <li><strong>Escuchar voz:</strong> Haz una llamada de prueba.</li>
              <li><strong>Links utiles:</strong> Links con informacion para enviar por sms.</li>
              <li><strong>Historial de llamadas:</strong> Historial de las llamadas entrantes.</li>
            </ul>
          )}

          {context === "campaign-sms" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Uso mensual de sms:</strong> SMS disponibles.</li>
              <li><strong>Contactos:</strong> Carga contactos con nombre y número.</li>
              <li><strong>Nombre de la Campana:</strong> Identifica tu Campana.</li>
              <li><strong>Contenido del SMS:</strong> Escribe el texto que se enviará, puedes incluir un Link.</li>
              <li><strong>Fecha de Envio:</strong> Elige fecha y hora de envío.</li>
              <li><strong>Segmentos:</strong> Define el público objetivo.</li>
              <li><strong>Campañas programadas/enviadas:</strong> Revisa el rendimiento de la campaña.</li>
            </ul>
          )}

          {context === "campaign-email" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Contactos:</strong> Carga nombre y correo electrónico.</li>
              <li><strong>Segmentos:</strong> Selecciona a quién le enviarás el correo.</li>
              <li><strong>Asunto:</strong> Título atractivo del email.</li>
              <li><strong>Mensaje:</strong> Redacta el contenido del email.</li>
              <li><strong>Imagen (opcional):</strong> Puedes incluir una imagen.</li>
              <li><strong>Programación:</strong> Fecha y hora del envío.</li>
              <li><strong>Estadísticas:</strong> Tasa de apertura, clics y conversiones.</li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
