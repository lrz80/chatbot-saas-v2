import { BACKEND_URL } from "@/utils/api";

/**
 * Abre Stripe Checkout para el price indicado.
 * - Si `trial_disponible` es true, el backend pondrá trial de 14 días.
 * - Si es false, lo crea sin trial.
 */
export async function openCheckout(price_id: string) {
  const res = await fetch(`${BACKEND_URL}/api/stripe/checkout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price_id }),
  });
  const data = await res.json();
  if (!res.ok || !data?.url) {
    throw new Error(data?.error || "No fue posible iniciar el pago");
  }
  window.location.href = data.url;
}
