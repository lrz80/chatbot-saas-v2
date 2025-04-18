import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-white text-center p-10">Cargando...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
