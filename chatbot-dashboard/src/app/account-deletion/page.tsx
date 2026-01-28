'use client';

import { useI18n } from "../../i18n/LanguageProvider";

const DELETION_CONTENT = {
  es: {
    title: "Eliminación de Cuenta",
    intro:
      "En Aamy.ai, respetamos tu derecho a eliminar tu cuenta y tus datos personales en cualquier momento.",
    howTitle: "¿Cómo eliminar tu cuenta?",
    steps: [
      "Inicia sesión en tu cuenta de Aamy.ai utilizando tu correo electrónico y contraseña.",
      "Dirígete a la sección Perfil del Negocio en el panel de control.",
      "Envía una solicitud de eliminación escribiendo a nuestro equipo de soporte a través del correo: support@aamy.ai.",
      "Nuestro equipo confirmará la solicitud y eliminará permanentemente tu cuenta y todos los datos asociados dentro de un plazo máximo de 7 días hábiles.",
    ],
    afterTitle: "¿Qué sucede después de eliminar tu cuenta?",
    after:
      "Una vez que tu cuenta sea eliminada, toda tu información personal, configuraciones, mensajes y datos asociados serán eliminados de forma permanente y no podrán ser recuperados.",
    footer:
      "Si tienes alguna duda adicional sobre el proceso, puedes contactarnos en cualquier momento a support@aamy.ai.",
  },

  en: {
    title: "Account Deletion",
    intro:
      "At Aamy.ai, we respect your right to delete your account and personal data at any time.",
    howTitle: "How to delete your account?",
    steps: [
      "Log in to your Aamy.ai account using your email and password.",
      "Go to the Business Profile section in your dashboard.",
      "Send a deletion request to our support team via email: support@aamy.ai.",
      "Our team will confirm the request and permanently delete your account and all associated data within a maximum of 7 business days.",
    ],
    afterTitle: "What happens after your account is deleted?",
    after:
      "Once your account is deleted, all your personal information, settings, messages, and associated data will be permanently removed and cannot be recovered.",
    footer:
      "If you have any additional questions about the process, feel free to contact us at support@aamy.ai.",
  }
};

export default function AccountDeletionPage() {
  const { lang } = useI18n();
  const c = DELETION_CONTENT[lang];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-center">
        {c.title}
      </h1>

      <p className="text-white/80 mb-6 text-sm md:text-base leading-relaxed">
        {c.intro}
      </p>

      <h2 className="text-2xl font-bold mt-8 mb-4">{c.howTitle}</h2>
      <ol className="list-decimal list-inside space-y-4 text-white/80 text-sm md:text-base">
        {c.steps.map((s, i) => (
          <li key={i}>
            {s.includes("support@aamy.ai") ? (
              <>
                {s.replace("support@aamy.ai", "")}
                <a
                  href="mailto:support@aamy.ai"
                  className="underline hover:text-purple-400"
                >
                  support@aamy.ai
                </a>
                .
              </>
            ) : (
              s
            )}
          </li>
        ))}
      </ol>

      <h2 className="text-2xl font-bold mt-8 mb-4">{c.afterTitle}</h2>
      <p className="text-white/80 mb-6 text-sm md:text-base leading-relaxed">
        {c.after}
      </p>

      <p className="text-white/80 text-sm md:text-base leading-relaxed">
        {c.footer.replace("support@aamy.ai", "")}
        <a
          href="mailto:support@aamy.ai"
          className="underline hover:text-purple-400"
        >
          support@aamy.ai
        </a>
        .
      </p>
    </div>
  );
}
