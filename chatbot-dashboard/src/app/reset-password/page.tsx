import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";
import { useI18n } from "../../i18n/LanguageProvider";

export default function Page() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <p className="text-white text-center p-10">
          {t("common.loading")}
        </p>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
