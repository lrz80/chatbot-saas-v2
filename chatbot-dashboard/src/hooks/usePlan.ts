// frontend/src/hooks/usePlan.ts
import useSWR from 'swr';
import { BACKEND_URL } from '@/utils/api';

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then(r => r.json());

type Features = { whatsapp: boolean; meta: boolean; voice: boolean; sms: boolean; email: boolean; };

export function useFeatures() {
  const { data, error } = useSWR(`${BACKEND_URL}/api/tenants/me`, fetcher);
  const loading = !data && !error;

  const plan: string = data?.plan ?? 'starter';
  const active: boolean = !!data?.membresia_activa;
  const esTrial: boolean = !!data?.es_trial;

  // matriz de habilitación por plan
  const matrix: Record<string, Features> = {
    trial:     { whatsapp: true, meta: false, voice: false, sms: true,  email: true  },
    starter:   { whatsapp: true, meta: false, voice: false, sms: true,  email: true  },
    pro:       { whatsapp: true, meta: true,  voice: false, sms: true,  email: true  },
    business:  { whatsapp: true, meta: true,  voice: true,  sms: true,  email: true  },
  };
  const base = matrix[plan] ?? matrix.starter;

  // Si la membresía no está activa, bloquea todos los canales excepto ver WhatsApp
  const features: Features = active ? base : { ...base, meta:false, voice:false, sms:false, email:false };

  return { loading, features, plan, active, esTrial };
}
