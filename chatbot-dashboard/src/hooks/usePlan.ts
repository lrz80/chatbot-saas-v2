import useSWR from 'swr';
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());

export function usePlan() {
  const { data } = useSWR('/api/tenants/me', fetcher);
  const plan = data?.plan ?? 'trial';
  const active = !!data?.membresia_activa;
  const esTrial = !!data?.es_trial;
  const trialEndsAt = data?.trial_ends_at ?? null;
  return { plan, active, esTrial, trialEndsAt, tenant: data ?? null };
}

// ⬇️ permisos listos para usar por canal
export function useFeatures() {
  const { data } = useSWR('/api/tenants/features', fetcher);
  // features: { whatsapp, meta, voice, sms, email }
  return {
    loading: !data,
    plan: data?.plan ?? 'trial',
    active: !!data?.membresia_activa,
    esTrial: !!data?.es_trial,
    trialEndsAt: data?.trial_ends_at ?? null,
    features: data?.features ?? { whatsapp: false, meta: false, voice: false, sms: false, email: false },
  };
}
