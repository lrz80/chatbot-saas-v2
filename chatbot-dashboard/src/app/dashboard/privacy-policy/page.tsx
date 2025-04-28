'use client';

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] text-white px-6 py-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-md">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 mb-6"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-8 text-purple-300">
          Política de Privacidad
        </h1>

        <div className="space-y-6 text-sm md:text-base text-gray-300 leading-relaxed">
          <p>En Aamy.ai, tu privacidad es nuestra prioridad. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos la información que manejamos en nuestra plataforma de automatización de comunicaciones.</p>

          <h2 className="text-xl text-purple-200 font-bold mt-6">1. Información que recopilamos</h2>
          <p>Recopilamos datos proporcionados por nuestros usuarios y sus clientes, como:</p>
          <ul className="list-disc list-inside ml-4">
            <li>Nombre</li>
            <li>Correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Mensajes de texto enviados a través de WhatsApp, Facebook Messenger, Instagram, SMS o Voz</li>
            <li>Información del negocio registrada en la plataforma</li>
          </ul>

          <h2 className="text-xl text-purple-200 font-bold mt-6">2. Cómo usamos tu información</h2>
          <p>Utilizamos la información para:</p>
          <ul className="list-disc list-inside ml-4">
            <li>Facilitar la automatización de conversaciones</li>
            <li>Programar y enviar mensajes automáticos personalizados</li>
            <li>Optimizar y mejorar nuestros servicios</li>
            <li>Analizar interacciones para ofrecer mejores experiencias</li>
          </ul>

          <h2 className="text-xl text-purple-200 font-bold mt-6">3. Compartir información</h2>
          <p>No vendemos ni compartimos tu información personal. Solo la compartimos:</p>
          <ul className="list-disc list-inside ml-4">
            <li>Con proveedores tecnológicos confiables para la operación del servicio</li>
            <li>Cuando sea requerido por ley o autoridades competentes</li>
          </ul>

          <h2 className="text-xl text-purple-200 font-bold mt-6">4. Seguridad de los datos</h2>
          <p>Implementamos medidas de seguridad administrativas, técnicas y físicas para proteger tu información de accesos no autorizados, pérdida o alteración.</p>

          <h2 className="text-xl text-purple-200 font-bold mt-6">5. Integraciones de terceros</h2>
          <p>Podemos interactuar con servicios externos como WhatsApp, Facebook Messenger, Instagram Direct y SMS. Cada servicio externo tiene su propia política de privacidad.</p>

          <h2 className="text-xl text-purple-200 font-bold mt-6">6. Tus derechos</h2>
          <p>Puedes solicitar acceso, rectificación o eliminación de tus datos personales en cualquier momento escribiéndonos a nuestro correo de soporte.</p>

          <h2 className="text-xl text-purple-200 font-bold mt-6">7. Cambios en esta política</h2>
          <p>Nos reservamos el derecho de modificar esta Política de Privacidad. Publicaremos los cambios en esta página.</p>

          <h2 className="text-xl text-purple-200 font-bold mt-6">8. Contacto</h2>
          <p>Si tienes preguntas o deseas ejercer tus derechos, puedes contactarnos en:</p>
          <ul className="list-none ml-4 mt-2">
            <li>📧 Correo: <a href="mailto:noreply@aamy.ai" className="text-purple-400 underline">noreply@aamy.ai</a></li>
            <li>🌐 Web: <a href="https://aamy.ai" className="text-purple-400 underline">https://aamy.ai</a></li>
          </ul>

          <p className="mt-8 text-sm text-gray-400">Fecha de última actualización: 27 de abril de 2025.</p>
        </div>
      </div>
    </div>
  );
}
