import { Suspense } from "react";
import RedirectClient from "./RedirectClient";

export const dynamic = "force-dynamic";

export default function WhatsappRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050516] text-white">
          <p className="text-lg">Conectando tu WhatsApp con Aamy...</p>
        </div>
      }
    >
      <RedirectClient />
    </Suspense>
  );
}
