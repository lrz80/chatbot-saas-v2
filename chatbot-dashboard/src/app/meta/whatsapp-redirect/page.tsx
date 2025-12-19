import { Suspense } from "react";
import RedirectClient from "./RedirectClient";

export default function WhatsAppRedirectPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Procesando…</div>}>
      <RedirectClient />
    </Suspense>
  );
}
