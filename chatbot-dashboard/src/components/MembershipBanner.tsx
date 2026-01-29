"use client";
import { useRouter } from "next/navigation";
import { useI18n } from "../i18n/LanguageProvider";


type Props = {
  membresia_activa: boolean;
  trial_activo?: boolean;
  trial_disponible?: boolean;
  estado_texto?: string;
};

export default function MembershipBanner({ membresia_activa, trial_activo, trial_disponible, estado_texto }: Props) {
  const { t } = useI18n();

  const router = useRouter();
  if (membresia_activa) return null;

  const showTrialCta = !membresia_activa && trial_disponible;
  const text = showTrialCta
    ? t("membership.banner.trialText")
    : (estado_texto || t("membership.banner.inactiveText"));

  const btn = showTrialCta
    ? t("membership.banner.tryNow")
    : t("membership.banner.activate");

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
