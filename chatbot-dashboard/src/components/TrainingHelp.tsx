// src/components/TrainingHelp.tsx
"use client";

import { useState } from "react";
import { Mic, Megaphone, ChevronDown, ChevronUp } from "lucide-react";
import { SiMeta, SiWhatsapp } from "react-icons/si";

interface Props {
  context: "training" | "meta" | "voice" | "campaign";
}

export default function TrainingHelp({ context }: Props) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen(!open);

  const contextTitles: Record<Props["context"], string> = {
    training: "¿Cómo entrenar tu asistente?",
    meta: "¿Cómo funciona la integración con Facebook e Instagram?",
    voice: "¿Cómo configurar tu asistente por voz?",
    campaign: "¿Cómo crear una campaña automatizada?",
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
          {context === "campaign" && <Megaphone className="text-pink-400" />}
          {contextTitles[context]}
        </span>
        {open ? <ChevronUp /> : <ChevronDown />}
      </button>

      {open && (
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white space-y-3">
          {context === "training" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>¿Qué debe hacer tu asistente?</strong> Describe sus funciones principales de tu asistente.</li>
              <li><strong>Información que el Asistente debe conocer:</strong> Cuales son tus servicios, precios, links, etc. Asegurate de colocar toda informacion que creas relevante.</li>
              <li><strong>Instrucciones:</strong> Instrucción que el Asistente usa para saber cómo debe hablar, qué información tiene sobre tu negocio (horario, servicios, tono de atención) y cómo responder a tus clientes.</li>
              <li><strong>Mensaje de bienvenida:</strong> El primer mensaje que ve el usuario.</li>
              <li><strong>Información del negocio:</strong> Datos esenciales que el Asistente puede usar.</li>
              <li><strong>Preguntas frecuentes:</strong> Respuestas automáticas a dudas comunes.</li>
              <li><strong>Entrenamiento por intención:</strong> Enséñale a responder frases específicas.</li>
              <li><strong>Flujos guiados Interactivos:</strong> Conversaciones paso a paso donde el chatbot guía al usuario con botones o preguntas predefinidas, en lugar de esperar que el usuario escriba libremente. Ejemplo: 
                Bot: ¿Qué deseas hacer hoy?
                🔘 Agendar cita
                🔘 Consultar precios
                🔘 Ver servicios

                Usuario: 🔘 Agendar cita

                Bot: ¿Para qué servicio quieres la cita?
                🔘 Facial
                🔘 Depilación
                🔘 Uñas

                Usuario: 🔘 Uñas

                Bot: Perfecto. ¿Qué día prefieres? (y así sigue...)</li>
              <li><strong>Vista previa:</strong> Prueba el comportamiento del Asistente en tiempo real.</li>
            </ul>
          )}

          {context === "meta" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Conexión:</strong> Vincula tu página de Facebook e Instagram Business.</li>
              <li><strong>Entrenamiento por intención:</strong> Enséñale a reconocer lo que quiere el usuario, incluso si lo dice con diferentes palabras. Ejemplo: Intención: Pedir precios. Frases de entrenamiento:
              ¿Cuánto cuesta?
              ¿Me puedes dar los precios?
              ¿Qué vale ese servicio?
              ¿Tienen tarifas?</li>
              <li><strong>Información que el Asistente debe conocer:</strong> Cuales son tus servicios, precios, links, etc. Asegurate de colocar toda informacion que creas relevante.</li>
              <li><strong>Mensaje de bienvenida:</strong> Respuesta automática al iniciar conversación.</li>
              <li><strong>Instrucciones Generadas:</strong> Instrucción que el Asistente usa para saber cómo debe hablar, qué información tiene sobre tu negocio (horario, servicios, tono de atención) y cómo responder a tus clientes.</li>
              <li><strong>Preguntas frecuentes:</strong> Respuestas automáticas a dudas comunes.</li>
              <li><strong>Flujos guiados Interactivos:</strong> Conversaciones paso a paso donde el chatbot guía al usuario con botones o preguntas predefinidas, en lugar de esperar que el usuario escriba libremente. Ejemplo: 
                Bot: ¿Qué deseas hacer hoy?
                🔘 Agendar cita
                🔘 Consultar precios
                🔘 Ver servicios

                Usuario: 🔘 Agendar cita

                Bot: ¿Para qué servicio quieres la cita?
                🔘 Facial
                🔘 Depilación
                🔘 Uñas

                Usuario: 🔘 Uñas

                Bot: Perfecto. ¿Qué día prefieres? (y así sigue...)</li>
              <li><strong>Vista previa:</strong> Prueba el comportamiento del Asistente en tiempo real.</li>
            </ul>
          )}

          {context === "voice" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Idioma:</strong> Idioma principal para llamadas.</li>
              <li><strong>Instrucciones del sistema:</strong> Instrucción que el Asistente usa para saber cómo debe hablar, qué información tiene sobre tu negocio (horario, servicios, tono de atención) y cómo responder a tus clientes.</li>
              <li><strong>Mensaje de bienvenida:</strong> Introducción cuando el usuario llama.</li>
              <li><strong>Voz de Twilio:</strong> Selección de voz que se usará en las llamadas.</li>
              <li><strong>Hints:</strong> Palabras clave que debe entender con claridad.</li>
              <li><strong>Escuchar Voz:</strong> Haz una Llamada de prueba a tu numero asignado para escuchar la voz.</li>
            </ul>
          )}

          {context === "campaign" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Contactos Cargados:</strong> Muestra cuántos contactos has subido para usar en tus campañas de marketing (WhatsApp, SMS o Email). Los contactos deben incluir: Nombre, Teléfono, Email, Segmento</li>
              <li><strong>Nombre de la Campaña:</strong> Identifica tu campaña fácilmente.</li>
              <li><strong>Canal:</strong> WhatsApp, Email o SMS.</li>
              <li><strong>Contenido del Mensaje:</strong> Contenido que se enviará automáticamente.</li>
              <li><strong>Imagen:</strong> Si deseas cargar una imagen a tu Campaña.</li>
              <li><strong>Fecha y Hora de envio:</strong> Define cuándo lanzar la campaña.</li>
              <li><strong>Elegir Segmentos:</strong> A quién se le enviará (clientes, leads, etc.).</li>
              <li><strong>Estadísticas:</strong> Visualiza resultados y conversiones.</li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
