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
          <p>En Aamy.ai, tu privacidad es muy importante para nosotros. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos tu información.</p>
          
          <h2 className="text-xl text-purple-200 font-bold mt-6">1. Información que recopilamos</h2>
          <p>Recopilamos información que nos proporcionas directamente, como nombre, correo electrónico y datos del negocio, así como información de uso dentro de la plataforma.</p>

          <h2 className="text-xl text-purple-200 font-bold mt-6">2. Cómo usamos tu información</h2>
          <p>Utilizamos tu información para ofrecer y mejorar nuestros servicios, comunicarnos contigo, y personalizar tu experiencia en Aamy.ai.</p>

          <h2 className="text-xl text-purple-200 font-bold mt-6">3. Compartir información</h2>
          <p>No compartimos tu información personal con terceros, excepto cuando sea necesario para operar nuestros servicios o cumplir con la ley.</p>

          <h2 className="text-xl text-purple-200 font-bold mt-6">4. Seguridad de los datos</h2>
          <p>Implementamos medidas de seguridad administrativas y técnicas para proteger tu información contra accesos no autorizados.</p>

          <h2 className="text-xl text-purple-200 font-bold mt-6">5. Tus derechos</h2>
          <p>Puedes solicitar acceso, corrección o eliminación de tus datos personales en cualquier momento contactándonos a través de nuestro soporte.</p>

          <h2 className="text-xl text-purple-200 font-bold mt-6">6. Cambios en esta política</h2>
          <p>Nos reservamos el derecho de actualizar esta Política de Privacidad. Te notificaremos de cualquier cambio importante.</p>

          <p className="mt-8">Fecha de última actualización: 23 de abril de 2025.</p>
        </div>
      </div>
    </div>
  );
}
