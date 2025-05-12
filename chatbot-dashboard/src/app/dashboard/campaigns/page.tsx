// src/app/dashboard/campaigns/page.tsx

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CampaignsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/campaigns/sms");
  }, [router]);

  return null;
}
