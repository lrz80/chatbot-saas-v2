'use client';

import { useEffect, useState } from 'react';
import Footer from '@/components/Footer'; // 👈 Aquí importamos el Footer

export default function MetaConfigPage() {
  const [connected, setConnected] = useState(false);
  const [mensajeBienvenida, setMensajeBienvenida] = useState('');
  const [mensajeFueraHorario, setMensajeFueraHorario] = useState('');
  const [mensajeDefault, setMensajeDefault] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Detectar si el URL tiene el query ?connected=success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'success') {
      setConnected(true);
    }

    fetchConfiguracion();
  }, []);

  const fetchConfiguracion = async () => {
    try {
      const res = await fetch('/api/settings', {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setMensajeBienvenida(data.facebook_mensaje_bienvenida || '');
        setMensajeFueraHorario(data.facebook_mensaje_fuera_horario || '');
        setMensajeDefault(data.facebook_mensaje_default || '');
      }
    } catch (error) {
      console.error('Error obteniendo configuración de Meta:', error);
    }
  };

  const handleGuardar = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          facebook_mensaje_bienvenida: mensajeBienvenida,
          facebook_mensaje_fuera_horario: mensajeFueraHorario,
          facebook_mensaje_default: mensajeDefault,
        }),
      });

      if (res.ok) {
        setSaved(true);
      } else {
        alert('❌ Error al guardar configuración.');
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('❌ Error al guardar configuración.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectFacebook = () => {
    const appId = '672113805196816';
    const redirectUri = 'https://api.aamy.ai/api/facebook/oauth-callback';

    const scopes = [
      'pages_show_list',
      'pages_messaging',
      'instagram_basic',
      'instagram_manage_messages',
      'instagram_manage_comments',
    ].join(',');

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scopes}&response_type=code&auth_type=rerequest`;

    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-8 text-white bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f]">
      <div className="flex flex-col items-center w-full">
        <h1 className="text-3xl font-bold mb-6">Configuración de Meta (Facebook & Instagram)</h1>

        {connected ? (
          <div className="bg-green-500/20 text-green-300 font-semibold py-4 px-6 rounded-lg mb-6">
            ✅ Conectado exitosamente con Facebook / Instagram
          </div>
        ) : (
          <button
            onClick={handleConnectFacebook}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-200 mb-6"
          >
            Conectar Facebook / Instagram
          </button>
        )}

        {/* FORMULARIO DE AUTOMATIZACION */}
        <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-6 mt-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Configuraciones de Automatización</h2>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm mb-1">Mensaje de Bienvenida</label>
              <input
                type="text"
                value={mensajeBienvenida}
                onChange={(e) => setMensajeBienvenida(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                placeholder="¡Hola! ¿En qué podemos ayudarte?"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Mensaje Fuera de Horario</label>
              <input
                type="text"
                value={mensajeFueraHorario}
                onChange={(e) => setMensajeFueraHorario(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                placeholder="Estamos fuera de horario, te responderemos pronto."
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Mensaje por Defecto</label>
              <input
                type="text"
                value={mensajeDefault}
                onChange={(e) => setMensajeDefault(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                placeholder="¿Podrías darnos más detalles?"
              />
            </div>

            <button
              onClick={handleGuardar}
              disabled={loading}
              className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>

            {saved && (
              <div className="text-green-400 font-medium mt-4 text-center">
                ✅ Configuración guardada exitosamente.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 👇 Footer */}
      <Footer />
    </div>
  );
}
