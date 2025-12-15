//src/components/MetaPageSelector.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

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
          throw new Error(data.error || 'Error al cargar páginas');
        }

        const data = await res.json();
        setPages(data.pages || []);
      } catch (e: any) {
        setError(e.message || 'Error al cargar páginas');
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
        throw new Error(data.error || 'Error al conectar la página');
      }

      // ✅ ESTE ES EL PUTO LUGAR
      onConnected?.();

      // Limpia el query param y muestra success
      router.replace('/dashboard/meta-config?connected=success');

    } catch (e: any) {
      setError(e.message || 'Error al conectar la página');
    } finally {
      setSaving(false);
    }
  };

  if (!fbSession) return null; // No estamos en flujo de OAuth

  if (loading) return <div>Cargando páginas de Facebook...</div>;
  if (error) return <div className="text-red-500 text-sm">{error}</div>;

  if (!pages.length) {
    return (
      <div className="text-sm">
        No se encontraron páginas disponibles para conectar.
      </div>
    );
  }

  const renderPage = (page: any) => {
  const isSelected = selectedPageId === page.id;

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

      <img
        src={page.picture || "/avatar-placeholder.png"}
        alt={page.name}
        className="w-12 h-12 rounded-full object-cover border border-white/20"
      />

      <div className="flex flex-col">
        <span className="text-white font-medium">{page.name}</span>
        {page.instagram_username && (
          <span className="text-sm text-white/60">
            IG: @{page.instagram_username}
          </span>
        )}
      </div>
    </label>
  );
};

  return (
    <div className="mt-6">
      <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-3">
          Selecciona la página a conectar
        </h3>

        <p className="text-sm text-white/70 mb-4">
          Elige la página de Facebook o Instagram que deseas conectar con tu asistente.
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
            {saving ? "Conectando..." : "Conectar página seleccionada"}
          </button>
        </div>
      </div>
    </div>
  );
}
