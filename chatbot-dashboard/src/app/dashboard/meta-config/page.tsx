'use client';

import { useEffect, useState } from 'react';

export default function MetaConfigPage() {
  const [connected, setConnected] = useState(false);

  // Detectar si el URL tiene el query ?connected=success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'success') {
      setConnected(true);
    }
  }, []);

  const handleConnectFacebook = () => {
    const appId = '672113805196816';
    const redirectUri = 'https://api.aamy.ai/api/facebook/oauth-callback';

    const scopes = [
      'pages_show_list',
      'pages_messaging',
      'instagram_basic',
      'instagram_manage_messages',
      'instagram_messaging',
    ].join(',');

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scopes}&response_type=code&auth_type=rerequest`;

    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f]">
      <h1 className="text-3xl font-bold mb-6">Configuración de Meta (Facebook & Instagram)</h1>

      {connected ? (
        <div className="bg-green-500/20 text-green-300 font-semibold py-4 px-6 rounded-lg mb-6">
          ✅ Conectado exitosamente con Facebook / Instagram
        </div>
      ) : (
        <button
          onClick={handleConnectFacebook}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-200"
        >
          Conectar Facebook / Instagram
        </button>
      )}

      {/* Aquí más adelante agregamos los formularios de automatización */}
    </div>
  );
}
