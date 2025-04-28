'use client';

import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] text-white p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-md p-8">
        <h1 className="text-4xl font-bold mb-6 text-center text-indigo-300">Política de Privacidad</h1>
        
        <p className="mb-4 text-gray-300">
          En Aamy.ai, valoramos tu privacidad. Esta política explica cómo recopilamos, usamos y protegemos tu información personal.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-indigo-200">1. Información que recopilamos</h2>
        <p className="mb-4 text-gray-300">
          Recopilamos datos de registro como nombre, correo electrónico y detalles del negocio para configurar tu cuenta y brindarte nuestros servicios de automatización de mensajería.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-indigo-200">2. Uso de la información</h2>
        <p className="mb-4 text-gray-300">
          Utilizamos la información para operar Aamy.ai, personalizar tu experiencia, enviar comunicaciones importantes y mejorar nuestros servicios.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-indigo-200">3. Compartir datos</h2>
        <p className="mb-4 text-gray-300">
          No compartimos tu información personal con terceros, excepto cuando sea necesario para brindar el servicio o cumplir con requisitos legales.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-indigo-200">4. Seguridad de la información</h2>
        <p className="mb-4 text-gray-300">
          Protegemos tus datos mediante prácticas de seguridad estándares de la industria para evitar accesos no autorizados o pérdidas de información.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-indigo-200">5. Cambios en esta política</h2>
        <p className="mb-4 text-gray-300">
          Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios importantes por medio del dashboard o por correo electrónico.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-indigo-200">6. Contacto</h2>
        <p className="mb-6 text-gray-300">
          Si tienes preguntas sobre esta política, contáctanos a <strong>soporte@aamy.ai</strong>.
        </p>

        <div className="text-center mt-8">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
