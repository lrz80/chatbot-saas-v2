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

  return (
    <div className="mt-4 border rounded-lg p-4 space-y-4 bg-white">
      <h3 className="font-semibold text-sm">
        Selecciona la página de Facebook que quieres conectar a este negocio:
      </h3>

      <div className="space-y-2">
        {pages.map((p) => (
          <label
            key={p.id}
            className="flex items-center gap-3 border rounded-md px-3 py-2 cursor-pointer hover:bg-gray-50"
          >
            <input
              type="radio"
              name="fb-page"
              value={p.id}
              checked={selectedPageId === p.id}
              onChange={() => setSelectedPageId(p.id)}
            />
            {p.pictureUrl && (
              <img
                src={p.pictureUrl}
                alt={p.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div className="flex flex-col text-sm">
              <span className="font-medium">{p.name}</span>
              {p.instagramUsername && (
                <span className="text-xs text-gray-500">
                  IG: @{p.instagramUsername}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={handleConnect}
        disabled={!selectedPageId || saving}
        className="px-4 py-2 text-sm rounded-md bg-black text-white disabled:opacity-60"
      >
        {saving ? 'Conectando...' : 'Conectar página seleccionada'}
      </button>
    </div>
  );
}
