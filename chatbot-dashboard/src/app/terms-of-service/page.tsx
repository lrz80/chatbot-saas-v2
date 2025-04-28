'use client';

import { BriefcaseIcon } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen p-6 md:p-10 text-white max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BriefcaseIcon className="h-8 w-8 text-purple-300" />
        <h1 className="text-3xl md:text-4xl font-bold">Términos de Servicio</h1>
      </div>

      <p className="text-sm text-gray-300 mb-8">Actualizado: 23 de abril de 2025</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-purple-300 mb-2">1. Introducción</h2>
          <p>Aamy.ai es una plataforma de automatización de mensajes y asistentes virtuales para negocios. Al usar nuestros servicios, usted acepta estos Términos.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-purple-300 mb-2">2. Uso Aceptable</h2>
          <p>Se compromete a utilizar nuestros servicios de manera legal. No está permitido el uso para actividades fraudulentas, spam o violación de la privacidad de terceros.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-purple-300 mb-2">3. Cuenta de Usuario</h2>
          <p>Es responsable de mantener la confidencialidad de su cuenta y de todas las actividades realizadas bajo su sesión.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-purple-300 mb-2">4. Propiedad Intelectual</h2>
          <p>Todo el contenido y software de Aamy.ai son propiedad exclusiva de Aamy.ai o sus licenciantes.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-purple-300 mb-2">5. Datos del Usuario y Privacidad</h2>
          <p>Para más información sobre cómo manejamos sus datos, consulte nuestra <a href="/dashboard/privacy-policy" className="underline text-purple-400">Política de Privacidad</a>.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-purple-300 mb-2">6. Limitación de Responsabilidad</h2>
          <p>No garantizamos que los servicios estarán libres de errores o interrupciones. No somos responsables de daños indirectos derivados del uso de la plataforma.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-purple-300 mb-2">7. Modificaciones</h2>
          <p>Nos reservamos el derecho de actualizar estos Términos. Es su responsabilidad revisarlos periódicamente.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-purple-300 mb-2">8. Cancelación y Terminación</h2>
          <p>Puede cancelar su cuenta en cualquier momento. Nos reservamos el derecho de suspender cuentas que incumplan estos Términos.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-purple-300 mb-2">9. Contacto</h2>
          <p>Si tiene preguntas sobre estos Términos, contáctenos en <strong>support@aamy.ai</strong>.</p>
        </section>
      </div>
    </div>
  );
}
