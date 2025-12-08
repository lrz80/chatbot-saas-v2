'use client';

export default function AccountDeletionPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-center">Eliminación de Cuenta</h1>

      <p className="text-white/80 mb-6 text-sm md:text-base leading-relaxed">
        En Aamy.ai, respetamos tu derecho a eliminar tu cuenta y tus datos personales en cualquier momento.
      </p>

      <h2 className="text-2xl font-bold mt-8 mb-4">¿Cómo eliminar tu cuenta?</h2>
      <ol className="list-decimal list-inside space-y-4 text-white/80 text-sm md:text-base">
        <li>
          Inicia sesión en tu cuenta de Aamy.ai utilizando tu correo electrónico y contraseña.
        </li>
        <li>
          Dirígete a la sección <strong>Perfil del Negocio</strong> en el panel de control.
        </li>
        <li>
          Envía una solicitud de eliminación escribiendo a nuestro equipo de soporte a través del correo:{' '}
          <a href="mailto:support@aamy.ai" className="underline hover:text-purple-400">support@aamy.ai</a>.
        </li>
        <li>
          Nuestro equipo confirmará la solicitud y eliminará permanentemente tu cuenta y todos los datos asociados
          dentro de un plazo máximo de 7 días hábiles.
        </li>
      </ol>

      <h2 className="text-2xl font-bold mt-8 mb-4">¿Qué sucede después de eliminar tu cuenta?</h2>
      <p className="text-white/80 mb-6 text-sm md:text-base leading-relaxed">
        Una vez que tu cuenta sea eliminada, toda tu información personal, configuraciones, mensajes y datos asociados serán
        eliminados de forma permanente y no podrán ser recuperados.
      </p>

      <p className="text-white/80 text-sm md:text-base leading-relaxed">
        Si tienes alguna duda adicional sobre el proceso, puedes contactarnos en cualquier momento a{' '}
        <a href="mailto:support@aamy.ai" className="underline hover:text-purple-400">support@aamy.ai</a>.
      </p>
    </div>
  );
}
