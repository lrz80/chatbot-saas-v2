// src/app/meta/whatsapp-redirect/page.tsx
"use client";

import { Suspense } from "react";
import RedirectClient from "./RedirectClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Procesando conexión de WhatsApp…</div>}>
      <RedirectClient />
    </Suspense>
  );
}
