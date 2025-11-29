"use client";

type Props = {
  disabled?: boolean;
  tenantId?: string;   // <- lo volvemos a declarar como opcional
};

export default function ConnectWhatsAppButton({ disabled }: Props) {
  const handleClick = () => {
    if (disabled) return;

    const width = 1000;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const url = "/meta/whatsapp-redirect";

    console.log("[WA META] Abriendo popup de Embedded Signup:", url);

    window.open(
      url,
      "wa-meta-onboard",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="mt-4 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      Conectar número oficial de WhatsApp
    </button>
  );
}
