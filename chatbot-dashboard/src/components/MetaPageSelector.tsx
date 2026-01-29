//src/components/MetaPageSelector.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useI18n } from "@/i18n/LanguageProvider";


type MetaPage = {
  id: string;
  name: string;
  pictureUrl: string | null;
  instagramBusinessId: string | null;
  instagramUsername: string | null;
};

type MetaPageSelectorProps = {
  onConnected?: () => void;
};

export function MetaPageSelector({ onConnected }: MetaPageSelectorProps) {
  const { t } = useI18n();

  const searchParams = useSearchParams();
  const router = useRouter();
  const fbSession = searchParams.get('fb_session');

  const [pages, setPages] = useState<MetaPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!fbSession) return;

    const loadPages = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/facebook/oauth-pages?session_id=${fbSession}`,
          {
            credentials: 'include',
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || t("meta.selector.errors.loadPages"));
        }

        const data = await res.json();
        setPages(data.pages || []);
      } catch (e: any) {
        setError(e.message || t("meta.selector.errors.loadPages"));
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, [fbSession]);

  const handleConnect = async () => {
    if (!fbSession || !selectedPageId) return;
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/facebook/select-page`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: fbSession,
            page_id: selectedPageId,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("meta.selector.errors.connectPage"));
      }

      // ✅ ESTE ES EL PUTO LUGAR
      onConnected?.();

      // Limpia el query param y muestra success
      router.replace('/dashboard/meta-config?connected=success');

    } catch (e: any) {
      setError(e.message || t("meta.selector.errors.connectPage"));
    } finally {
      setSaving(false);
    }
  };

  if (!fbSession) return null; // No estamos en flujo de OAuth

  if (loading) return <div>{t("meta.selector.loading")}</div>;
  if (error) return <div className="text-red-500 text-sm">{error}</div>;

  if (!pages.length) {
    return (
      <div className="text-sm">
        {t("meta.selector.empty")}
      </div>
    );
  }

  const renderPage = (page: MetaPage) => {
  const isSelected = selectedPageId === page.id;
  const pic = getPicUrl(page);

  return (
    <label
      key={page.id}
      className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition ${
        isSelected
          ? "border-indigo-500 bg-indigo-500/20"
          : "border-white/20 bg-white/5 hover:bg-white/10"
      }`}
    >
      <input
        type="radio"
        name="selectedPage"
        value={page.id}
        checked={isSelected}
        onChange={() => setSelectedPageId(page.id)}
        className="w-5 h-5 accent-indigo-500"
      />

      <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
        {pic ? (
          <img
            src={pic}
            alt={page.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // si falla la imagen, escondemos el img y queda la letra fallback
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}

        {/* fallback si no hay imagen o falló */}
        <span className="text-xs text-white/70 font-semibold">
          {(page?.name ?? "P").slice(0, 1).toUpperCase()}
        </span>
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-white font-medium truncate">{page.name}</span>
        {page.instagramUsername && (
          <span className="text-sm text-white/60 truncate">
            {t("meta.selector.igPrefix")} @{page.instagramUsername}
          </span>
        )}
      </div>
    </label>
  );
};

const getPicUrl = (p: any): string => {
  // casos típicos: string directo o Graph { data: { url } }
  return (
    p?.picture?.data?.url ||
    p?.picture?.url ||
    p?.picture ||
    p?.profile_picture_url ||
    ""
  );
};

  return (
    <div className="mt-6">
      <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-3">
          {t("meta.selector.title")}
        </h3>

        <p className="text-sm text-white/70 mb-4">
          {t("meta.selector.subtitle")}
        </p>

        {/* 👇 AQUÍ VA LA LISTA */}
        <div className="space-y-3">
          {pages.map(renderPage)}
        </div>

        {/* 👇 BOTÓN */}
        <div className="mt-6 sticky bottom-0 bg-[#1e1e3f] pt-4">
          <button
            onClick={handleConnect}
            disabled={!selectedPageId || saving}
            className={`w-full py-3 rounded-lg font-semibold text-white transition ${
              selectedPageId && !saving
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            {saving ? t("meta.selector.connecting") : t("meta.selector.connect")}
          </button>
        </div>
      </div>
    </div>
  );
}
