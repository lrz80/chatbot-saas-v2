// src/utils/checkout.ts
import { BACKEND_URL } from "@/utils/api";

/** Abre Stripe Checkout para el price_id seleccionado. */
export async function openCheckout(price_id: string) {
  const res = await fetch(`${BACKEND_URL}/api/stripe/checkout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price_id }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error creando la sesión de Stripe");
  }

  const data = await res.json();
  if (!data?.url) throw new Error("Stripe no devolvió URL de checkout");
  window.location.href = data.url;
}
