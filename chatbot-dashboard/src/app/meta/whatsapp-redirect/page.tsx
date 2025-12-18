import { Suspense } from "react";
import RedirectClient from "./RedirectClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RedirectClient />
    </Suspense>
  );
}
