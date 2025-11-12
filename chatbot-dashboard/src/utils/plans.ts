import { BACKEND_URL } from "@/utils/api";

export type PlanStripe = {
  price_id: string;
  product_id: string;
  name: string;
  description: string;
  interval?: "month" | "year";
  interval_count?: number;
  unit_amount?: number; // cents
  currency: string;
  metadata: Record<string, string>;
};

export async function fetchStripePlans(): Promise<PlanStripe[]> {
  const res = await fetch(`${BACKEND_URL}/api/stripe/plans`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudieron cargar los planes");
  const data = await res.json();
  return data.plans as PlanStripe[];
}
