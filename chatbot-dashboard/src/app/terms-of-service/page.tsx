'use client';

import { BriefcaseIcon } from 'lucide-react';
import { useI18n } from "../../i18n/LanguageProvider";

const UPDATED_AT = "2025-04-23"; // ISO para que puedas formatear luego si quieres

type TosSection = { title: string; body: React.ReactNode };

const TOS_CONTENT: Record<"es" | "en", { pageTitle: string; updatedLabel: string; sections: TosSection[] }> = {
  es: {
    pageTitle: "Términos de Servicio",
    updatedLabel: "Actualizado",
    sections: [
      { title: "1. Introducción", body: <>Aamy.ai es una plataforma de automatización de mensajes y asistentes virtuales para negocios. Al usar nuestros servicios, usted acepta estos Términos.</> },
      { title: "2. Uso Aceptable", body: <>Se compromete a utilizar nuestros servicios de manera legal. No está permitido el uso para actividades fraudulentas, spam o violación de la privacidad de terceros.</> },
      { title: "3. Cuenta de Usuario", body: <>Es responsable de mantener la confidencialidad de su cuenta y de todas las actividades realizadas bajo su sesión.</> },
      { title: "4. Propiedad Intelectual", body: <>Todo el contenido y software de Aamy.ai son propiedad exclusiva de Aamy.ai o sus licenciantes.</> },
      {
        title: "5. Datos del Usuario y Privacidad",
        body: (
          <>
            Para más información sobre cómo manejamos sus datos, consulte nuestra{" "}
            <a href="/dashboard/privacy-policy" className="underline text-purple-400">
              Política de Privacidad
            </a>
            .
          </>
        ),
      },
      { title: "6. Limitación de Responsabilidad", body: <>No garantizamos que los servicios estarán libres de errores o interrupciones. No somos responsables de daños indirectos derivados del uso de la plataforma.</> },
      { title: "7. Modificaciones", body: <>Nos reservamos el derecho de actualizar estos Términos. Es su responsabilidad revisarlos periódicamente.</> },
      { title: "8. Cancelación y Terminación", body: <>Puede cancelar su cuenta en cualquier momento. Nos reservamos el derecho de suspender cuentas que incumplan estos Términos.</> },
      { title: "9. Contacto", body: <>Si tiene preguntas sobre estos Términos, contáctenos en <strong>support@aamy.ai</strong>.</> },
    ],
  },
  en: {
    pageTitle: "Terms of Service",
    updatedLabel: "Updated",
    sections: [
      { title: "1. Introduction", body: <>Aamy.ai is a messaging automation and virtual assistant platform for businesses. By using our services, you agree to these Terms.</> },
      { title: "2. Acceptable Use", body: <>You agree to use our services lawfully. Using the platform for fraud, spam, or violations of third-party privacy is not allowed.</> },
      { title: "3. User Account", body: <>You are responsible for keeping your account credentials confidential and for all activities performed under your session.</> },
      { title: "4. Intellectual Property", body: <>All content and software on Aamy.ai are the exclusive property of Aamy.ai or its licensors.</> },
      {
        title: "5. User Data and Privacy",
        body: (
          <>
            For more information on how we handle your data, please see our{" "}
            <a href="/dashboard/privacy-policy" className="underline text-purple-400">
              Privacy Policy
            </a>
            .
          </>
        ),
      },
      { title: "6. Limitation of Liability", body: <>We do not guarantee that the services will be error-free or uninterrupted. We are not liable for indirect damages arising from use of the platform.</> },
      { title: "7. Changes", body: <>We reserve the right to update these Terms. It is your responsibility to review them periodically.</> },
      { title: "8. Cancellation and Termination", body: <>You may cancel your account at any time. We reserve the right to suspend accounts that violate these Terms.</> },
      { title: "9. Contact", body: <>If you have questions about these Terms, contact us at <strong>support@aamy.ai</strong>.</> },
    ],
  },
};

export default function TermsOfServicePage() {
  const { lang } = useI18n();
  const content = TOS_CONTENT[lang];

  return (
    <div className="min-h-screen p-6 md:p-10 text-white max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BriefcaseIcon className="h-8 w-8 text-purple-300" />
        <h1 className="text-3xl md:text-4xl font-bold">{content.pageTitle}</h1>
      </div>

      <p className="text-sm text-gray-300 mb-8">
        {content.updatedLabel}: {UPDATED_AT}
      </p>

      <div className="space-y-8">
        {content.sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-2xl font-semibold text-purple-300 mb-2">{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
