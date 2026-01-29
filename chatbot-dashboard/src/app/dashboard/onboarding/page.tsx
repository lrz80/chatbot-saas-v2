'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BACKEND_URL } from '@/utils/api';
import { useI18n } from "@/i18n/LanguageProvider";


export default function OnboardingPage() {
  const { t } = useI18n();

  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);

  const [form, setForm] = useState({
    name: '',
    categoria: '',
    idioma: 'es',
    prompt: 'Eres un asistente útil.',
  });

  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.onboarding_completado) {
            router.push('/dashboard');
            return;
          }
          setUser(data);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('❌ Error cargando usuario:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
        }),
      });

      if (!res.ok) {
        console.error('❌ Error guardando negocio:', await res.text());
        alert('Hubo un error guardando los datos.');
        setSaving(false);
        return;
      }

      setFinished(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('❌ Error al enviar:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center p-6">{t("onboarding.loading")}</p>;

  return (
    <div className="max-w-xl mx-auto bg-white p-8 shadow rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-indigo-600">
        {t("onboarding.title")}
      </h2>

      {finished ? (
        <div className="text-center">
          <p className="text-xl mb-2">{t("onboarding.finished.title")}</p>
          <p className="text-gray-600">{t("onboarding.finished.redirect")}</p>
        </div>
      ) : step === 1 ? (
        <div>
          <label className="block font-medium mb-1">{t("onboarding.field.name")}</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-4"
          />

          <label className="block font-medium mb-1">{t("onboarding.field.category")}</label>
          <input
            type="text"
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-4"
          />

          <label className="block font-medium mb-1">{t("onboarding.field.language")}</label>
          <select
            name="idioma"
            value={form.idioma}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-6"
          >
            <option value="es">{t("onboarding.lang.es")}</option>
            <option value="en">{t("onboarding.lang.en")}</option>
          </select>

          <button
            onClick={() => setStep(2)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            {t("onboarding.button.next")}
          </button>
        </div>
      ) : (
        <div>
          {t("onboarding.field.prompt")}
          <textarea
            name="prompt"
            value={form.prompt}
            onChange={handleChange}
            rows={4}
            className="w-full p-3 border rounded mb-4"
          />

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-indigo-600 hover:underline"
            >
              {t("onboarding.button.back")}
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {saving ? t("onboarding.button.saving") : t("onboarding.button.finish")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
