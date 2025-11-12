"use client";
import { useRouter } from "next/navigation";

type Props = {
  membresia_activa: boolean;
  trial_activo?: boolean;
  trial_disponible?: boolean;
  estado_texto?: string;
};

export default function MembershipBanner({ membresia_activa, trial_activo, trial_disponible, estado_texto }: Props) {
  const router = useRouter();
  if (membresia_activa) return null;

  const showTrialCta = !membresia_activa && trial_disponible;
  const text =
    showTrialCta
      ? "¿Primera vez? Prueba gratis por 14 días."
      : (estado_texto || "Tu membresía está inactiva.");

  const btn = showTrialCta ? "Probar ahora" : "Activar membresía";

  return (
    <div className="mb-4 p-4 rounded-lg border border-yellow-400 bg-yellow-500/10 text-yellow-200 flex items-center justify-between">
      <span>{text}</span>
      <button
        onClick={() => router.push("/upgrade")}
        className="ml-4 px-3 py-1 rounded bg-yellow-400 text-black hover:bg-yellow-300"
      >
        {btn}
      </button>
    </div>
  );
}
