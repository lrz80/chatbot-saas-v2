'use client';

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../../i18n/LanguageProvider";

const UPDATED_AT = "2025-04-27";

const PRIVACY_CONTENT = {
  es: {
    back: "Volver",
    title: "Política de Privacidad",
    intro:
      "En Aamy.ai, tu privacidad es nuestra prioridad. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos la información que manejamos en nuestra plataforma de automatización de comunicaciones.",
    sections: [
      {
        title: "1. Información que recopilamos",
        body: (
          <>
            <p>Recopilamos datos proporcionados por nuestros usuarios y sus clientes, como:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Nombre</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Mensajes enviados por WhatsApp, Facebook Messenger, Instagram, SMS o Voz</li>
              <li>Información del negocio registrada en la plataforma</li>
            </ul>
          </>
        ),
      },
      {
        title: "2. Cómo usamos tu información",
        body: (
          <>
            <p>Utilizamos la información para:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Facilitar la automatización de conversaciones</li>
              <li>Programar y enviar mensajes automáticos personalizados</li>
              <li>Optimizar y mejorar nuestros servicios</li>
              <li>Analizar interacciones para ofrecer mejores experiencias</li>
            </ul>
          </>
        ),
      },
      {
        title: "3. Compartir información",
        body: (
          <>
            <p>No vendemos ni compartimos tu información personal. Solo la compartimos:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Con proveedores tecnológicos confiables para operar el servicio</li>
              <li>Cuando sea requerido por ley o autoridades competentes</li>
            </ul>
          </>
        ),
      },
      {
        title: "4. Seguridad de los datos",
        body: (
          <p>
            Implementamos medidas de seguridad administrativas, técnicas y físicas para proteger tu
            información de accesos no autorizados, pérdida o alteración.
          </p>
        ),
      },
      {
        title: "5. Integraciones de terceros",
        body: (
          <p>
            Podemos interactuar con servicios externos como WhatsApp, Facebook Messenger, Instagram
            Direct y SMS. Cada servicio externo tiene su propia política de privacidad.
          </p>
        ),
      },
      {
        title: "6. Tus derechos",
        body: (
          <p>
            Puedes solicitar acceso, rectificación o eliminación de tus datos personales en cualquier
            momento escribiéndonos a nuestro correo de soporte.
          </p>
        ),
      },
      {
        title: "7. Cambios en esta política",
        body: (
          <p>
            Nos reservamos el derecho de modificar esta Política de Privacidad. Publicaremos los
            cambios en esta página.
          </p>
        ),
      },
      {
        title: "8. Contacto",
        body: (
          <>
            <p>Si tienes preguntas o deseas ejercer tus derechos, puedes contactarnos en:</p>
            <ul className="list-none ml-4 mt-2">
              <li>
                📧 Correo:{" "}
                <a href="mailto:noreply@aamy.ai" className="text-purple-400 underline">
                  noreply@aamy.ai
                </a>
              </li>
              <li>
                🌐 Web:{" "}
                <a href="https://aamy.ai" className="text-purple-400 underline">
                  https://aamy.ai
                </a>
              </li>
            </ul>
          </>
        ),
      },
    ],
  },

  en: {
    back: "Back",
    title: "Privacy Policy",
    intro:
      "At Aamy.ai, your privacy is our priority. This Privacy Policy explains how we collect, use, and protect the information handled within our communication automation platform.",
    sections: [
      {
        title: "1. Information We Collect",
        body: (
          <>
            <p>We collect information provided by our users and their customers, such as:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Name</li>
              <li>Email</li>
              <li>Phone number</li>
              <li>Messages sent through WhatsApp, Facebook Messenger, Instagram, SMS, or Voice</li>
              <li>Business information registered in the platform</li>
            </ul>
          </>
        ),
      },
      {
        title: "2. How We Use Your Information",
        body: (
          <>
            <p>We use the information to:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Enable automated conversations</li>
              <li>Schedule and send personalized automated messages</li>
              <li>Optimize and improve our services</li>
              <li>Analyze interactions to improve experiences</li>
            </ul>
          </>
        ),
      },
      {
        title: "3. Information Sharing",
        body: (
          <>
            <p>
              We do not sell or share your personal information. We only share it with:
            </p>
            <ul className="list-disc list-inside ml-4">
              <li>Trusted technology providers used to operate the service</li>
              <li>When required by law or authorities</li>
            </ul>
          </>
        ),
      },
      {
        title: "4. Data Security",
        body: (
          <p>
            We implement administrative, technical, and physical safeguards to protect your data from
            unauthorized access, loss, or alteration.
          </p>
        ),
      },
      {
        title: "5. Third-Party Integrations",
        body: (
          <p>
            We may interact with external services such as WhatsApp, Facebook Messenger, Instagram
            Direct, and SMS. Each external service has its own privacy policy.
          </p>
        ),
      },
      {
        title: "6. Your Rights",
        body: (
          <p>
            You can request access, correction, or deletion of your personal data anytime by
            contacting our support team.
          </p>
        ),
      },
      {
        title: "7. Changes to This Policy",
        body: (
          <p>
            We reserve the right to modify this Privacy Policy. Updates will be posted on this page.
          </p>
        ),
      },
      {
        title: "8. Contact",
        body: (
          <>
            <p>If you have questions or wish to exercise your rights, contact us at:</p>
            <ul className="list-none ml-4 mt-2">
              <li>
                📧 Email:{" "}
                <a href="mailto:noreply@aamy.ai" className="text-purple-400 underline">
                  noreply@aamy.ai
                </a>
              </li>
              <li>
                🌐 Web:{" "}
                <a href="https://aamy.ai" className="text-purple-400 underline">
                  https://aamy.ai
                </a>
              </li>
            </ul>
          </>
        ),
      },
    ],
  },
};

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const content = PRIVACY_CONTENT[lang];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] text-white px-6 py-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-md">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 mb-6"
        >
          <ArrowLeft size={20} />
          {content.back}
        </button>

        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-8 text-purple-300">
          {content.title}
        </h1>

        <div className="space-y-6 text-sm md:text-base text-gray-300 leading-relaxed">

          <p>{content.intro}</p>

          {content.sections.map((sec, idx) => (
            <div key={idx}>
              <h2 className="text-xl text-purple-200 font-bold mt-6">{sec.title}</h2>
              {sec.body}
            </div>
          ))}

          <p className="mt-8 text-sm text-gray-400">
            {lang === "es" ? "Fecha de última actualización" : "Last updated"}: {UPDATED_AT}
          </p>
        </div>
      </div>
    </div>
  );
}

