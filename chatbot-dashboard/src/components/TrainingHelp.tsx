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
              <li>
              <strong>¿Qué debe hacer tu asistente?</strong> Describe con claridad las funciones principales del asistente, como responder dudas, agendar citas, vender servicios o detectar intención de compra.
              <br />
              💡 <em>Consejo:</em> Sé lo más específico posible. En lugar de escribir “Atender clientes”, escribe: “Responder preguntas sobre servicios, agendar clases, promover las membresías y ofrecer seguimiento si el cliente no responde”.
              </li>
              <li>
              <strong>Información que el Asistente debe conocer:</strong> Describe todos los detalles clave que el bot debe saber, incluyendo servicios, precios, ubicación, horarios, links, políticas, etc. 
              <br />
              ✳️ <em>Importante:</em> Escribe la información como texto corrido, sin usar listas con guiones o viñetas, ya que el generador puede ignorar contenido en formato de lista. 
              Por ejemplo, escribe: “Las clases cuestan $20 cada una, el plan mensual cuesta $99 e incluye acceso ilimitado...” en lugar de usar bullets.
              </li>
              <li>
                💡 <strong>Consejo adicional:</strong> Asegúrate de escribir directamente toda la información importante. No pongas “Ver más en nuestra web”, ya que el asistente no puede acceder a enlaces externos. Todo debe estar explícito en el texto.
              </li>
              <li>
              <strong>Mensaje de bienvenida:</strong> Primer mensaje que verá el usuario.
              <br />
              💬 <em>Consejo:</em> Usa un tono cálido y profesional. Puedes incluir una breve presentación del negocio y una pregunta directa para iniciar la conversación, como: 
              “Hola 👋 Soy Amy, bienvenida a Spinzone. ¿Te gustaría agendar una clase gratuita?”.
              </li>
              <li>
              <strong>Instrucciones:</strong> Explica cómo debe hablar y comportarse el asistente.
              <br />
              💬 <em>Ejemplo:</em> “Debe responder de forma clara, amable, profesional y siempre como si fuera parte del equipo. Si no tiene información, debe decir: ‘Lo siento, no tengo esa información disponible en este momento’”.
              <br />
              ⚠️ <strong>Consejo:</strong> Evita instrucciones genéricas como “sé amable” o “actúa como humano”. Sé específico: define si debe vender, agendar, guiar, hacer preguntas estratégicas, etc.
              </li>
              <li>
              <strong>Preguntas frecuentes:</strong> Añade respuestas claras y completas a las dudas más comunes de tus clientes.
              <br />
              💡 <em>Consejo:</em> Redacta las preguntas como lo haría un cliente real (por ejemplo: “¿Cuánto cuesta la clase?” o “¿Puedo asistir con mi hijo?”), y asegúrate de que la respuesta sea precisa, amable y coherente con tu negocio.
              <br />
              ✳️ <em>Tip:</em> No uses respuestas genéricas como “depende” o “consúltanos”, ya que el bot necesita respuestas completas para automatizar bien.
              </li>
              <li>
              <strong>Entrenamiento por intención:</strong> Enseña al asistente frases específicas que suelen escribir tus clientes y cómo debe responder.
              <br />
              💡 <em>Consejo:</em> Usa frases reales o comunes que te escriben en redes sociales o WhatsApp, como “¿Tienen clases hoy?”, “Quiero agendar”, o “¿Cuánto cuesta?”. Así el bot podrá responder con precisión antes de usar inteligencia artificial.
              </li>
              <li>
              <strong>Flujos guiados:</strong> Conversaciones paso a paso con botones para guiar al cliente.
              <br />
              💡 <em>Consejo:</em> Usa flujos para resolver dudas frecuentes, ofrecer presupuestos, agendar clases o calificar leads. Piensa en cada flujo como un mini embudo con botones que llevan al cliente hacia una acción clara.
              </li>
              <li><strong>Vista previa:</strong> Prueba el comportamiento del asistente.</li>
            </ul>
          )}

          {context === "meta" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Conexión:</strong> Vincula tu página de Facebook e Instagram.</li>
              <li>
              <strong>Entrenamiento por intención:</strong> Enseña al asistente frases específicas que suelen escribir tus clientes y cómo debe responder.
              <br />
              💡 <em>Consejo:</em> Usa frases reales o comunes que te escriben en redes sociales o WhatsApp, como “¿Tienen clases hoy?”, “Quiero agendar”, o “¿Cuánto cuesta?”. Así el bot podrá responder con precisión antes de usar inteligencia artificial.
              </li>
              <li>
              <strong>Información que el Asistente debe conocer:</strong> Describe todos los detalles clave que el bot debe saber, incluyendo servicios, precios, ubicación, horarios, links, políticas, etc. 
              <br />
              ✳️ <em>Importante:</em> Escribe la información como texto corrido, sin usar listas con guiones o viñetas, ya que el generador puede ignorar contenido en formato de lista. 
              Por ejemplo, escribe: “Las clases cuestan $20 cada una, el plan mensual cuesta $99 e incluye acceso ilimitado...” en lugar de usar bullets.
              </li>
              <li>
                💡 <strong>Consejo adicional:</strong> Asegúrate de escribir directamente toda la información importante. No pongas “Ver más en nuestra web”, ya que el asistente no puede acceder a enlaces externos. Todo debe estar explícito en el texto.
              </li>
              <li>
              <strong>Mensaje de bienvenida:</strong> Primer mensaje que verá el usuario.
              <br />
              💬 <em>Consejo:</em> Usa un tono cálido y profesional. Puedes incluir una breve presentación del negocio y una pregunta directa para iniciar la conversación, como: 
              “Hola 👋 Soy Amy, bienvenida a Spinzone. ¿Te gustaría agendar una clase gratuita?”.
              </li>
              <li>
              <strong>Instrucciones:</strong> Explica cómo debe hablar y comportarse el asistente.
              <br />
              💬 <em>Ejemplo:</em> “Debe responder de forma clara, amable, profesional y siempre como si fuera parte del equipo. Si no tiene información, debe decir: ‘Lo siento, no tengo esa información disponible en este momento’”.
              <br />
              ⚠️ <strong>Consejo:</strong> Evita instrucciones genéricas como “sé amable” o “actúa como humano”. Sé específico: define si debe vender, agendar, guiar, hacer preguntas estratégicas, etc.
              </li>
              <li>
              <strong>Preguntas frecuentes:</strong> Añade respuestas claras y completas a las dudas más comunes de tus clientes.
              <br />
              💡 <em>Consejo:</em> Redacta las preguntas como lo haría un cliente real (por ejemplo: “¿Cuánto cuesta la clase?” o “¿Puedo asistir con mi hijo?”), y asegúrate de que la respuesta sea precisa, amable y coherente con tu negocio.
              <br />
              ✳️ <em>Tip:</em> No uses respuestas genéricas como “depende” o “consúltanos”, ya que el bot necesita respuestas completas para automatizar bien.
              </li>
              <li>
              <strong>Flujos guiados:</strong> Conversaciones paso a paso con botones para guiar al cliente.
              <br />
              💡 <em>Consejo:</em> Usa flujos para resolver dudas frecuentes, ofrecer presupuestos, agendar clases o calificar leads. Piensa en cada flujo como un mini embudo con botones que llevan al cliente hacia una acción clara.
              </li>
              <li><strong>Vista previa:</strong> Prueba cómo responde tu asistente.</li>
            </ul>
          )}

          {context === "voice" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Idioma:</strong> Idioma principal para llamadas.</li>
              <li>
              <strong>¿Qué debe hacer tu asistente?</strong> Describe con claridad las funciones principales del asistente, como responder dudas, agendar citas, vender servicios o detectar intención de compra.
              <br />
              💡 <em>Consejo:</em> Sé lo más específico posible. En lugar de escribir “Atender clientes”, escribe: “Responder preguntas sobre servicios, agendar clases, promover las membresías y ofrecer seguimiento si el cliente no responde”.
              </li>
              <li>
              <strong>Información que el Asistente debe conocer:</strong> Describe todos los detalles clave que el bot debe saber, incluyendo servicios, precios, ubicación, horarios, links, políticas, etc. 
              <br />
              ✳️ <em>Importante:</em> Escribe la información como texto corrido, sin usar listas con guiones o viñetas, ya que el generador puede ignorar contenido en formato de lista. 
              Por ejemplo, escribe: “Las clases cuestan $20 cada una, el plan mensual cuesta $99 e incluye acceso ilimitado...” en lugar de usar bullets.
              </li>
              <li>
                💡 <strong>Consejo adicional:</strong> Asegúrate de escribir directamente toda la información importante. No pongas “Ver más en nuestra web”, ya que el asistente no puede acceder a enlaces externos. Todo debe estar explícito en el texto.
              </li>
              <li>
              <strong>Instrucciones:</strong> Explica cómo debe hablar y comportarse el asistente.
              <br />
              💬 <em>Ejemplo:</em> “Debe responder de forma clara, amable, profesional y siempre como si fuera parte del equipo. Si no tiene información, debe decir: ‘Lo siento, no tengo esa información disponible en este momento’”.
              <br />
              ⚠️ <strong>Consejo:</strong> Evita instrucciones genéricas como “sé amable” o “actúa como humano”. Sé específico: define si debe vender, agendar, guiar, hacer preguntas estratégicas, etc.
              </li>
              <li>
              <strong>Mensaje de bienvenida:</strong> Primer mensaje que verá el usuario.
              <br />
              💬 <em>Consejo:</em> Usa un tono cálido y profesional. Puedes incluir una breve presentación del negocio y una pregunta directa para iniciar la conversación, como: 
              “Hola 👋 Soy Amy, bienvenida a Spinzone. ¿Te gustaría agendar una clase gratuita?”.
              </li>
              <li><strong>Voz del asistente:</strong> Selección de voz.</li>
              <li>
              <strong>Hints:</strong> Palabras clave que los clientes podrían decir y que el asistente debe reconocer fácilmente.
              <br />
              💡 <em>Consejo:</em> Escribe frases o palabras comunes que ayuden al asistente a entender la intención del usuario en llamadas de voz, por ejemplo: “quiero reservar”, “precio de clases”, “dónde están ubicados”, “primera clase gratis”, etc. 
              <br />
              👉 Separa cada frase con comas. No uses viñetas ni saltos de línea.
              </li>
              <li><strong>Escuchar voz:</strong> Haz una llamada de prueba.</li>
              <li><strong>Links utiles:</strong> Links con informacion para enviar por sms.</li>
              <li><strong>Historial de llamadas:</strong> Historial de las llamadas entrantes.</li>
            </ul>
          )}

          {context === "campaign-sms" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Uso mensual de sms:</strong> SMS disponibles.</li>
              <li><strong>Contactos:</strong> Carga contactos en formato CSV.</li>
              <li><strong>Nombre de la Campana:</strong> Identifica tu Campana.</li>
              <li><strong>Contenido del SMS:</strong> Escribe el texto que se enviará, puedes incluir un Link.</li>
              <li><strong>Fecha de Envio:</strong> Elige fecha y hora de envío.</li>
              <li><strong>Segmentos:</strong> Define el público objetivo.</li>
              <li><strong>Campañas programadas/enviadas:</strong> Revisa el rendimiento de la campaña.</li>
            </ul>
          )}

          {context === "campaign-email" && (
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Contactos:</strong> Carga Contactos en formato CSV.</li>
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
