'use client';

import { useEffect, useRef, useState } from 'react';
import Footer from '@/components/Footer';
import PromptGenerator from '@/components/PromptGenerator';
import TrainingHelp from '@/components/TrainingHelp';
import { BACKEND_URL } from '@/utils/api';
import { BotMessageSquare, MessageSquareText, NotebookText, Save, Settings } from 'lucide-react';

export default function MetaConfigPage() {
  const [connected, setConnected] = useState(false);
  const [facebookPageName, setFacebookPageName] = useState('');
  const [instagramPageName, setInstagramPageName] = useState('');
  const [mensajeBienvenida, setMensajeBienvenida] = useState('');
  const [mensajeFueraHorario, setMensajeFueraHorario] = useState('');
  const [mensajeDefault, setMensajeDefault] = useState('');
  const [promptMeta, setPromptMeta] = useState('');
  const [bienvenidaMeta, setBienvenidaMeta] = useState('');
  const [faq, setFaq] = useState<{ pregunta: string; respuesta: string }[]>([]);
  const [intents, setIntents] = useState<{ nombre: string; ejemplos: string[]; respuesta: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [infoClaveMeta, setInfoClaveMeta] = useState('');
  const [funcionesMeta, setFuncionesMeta] = useState('');

  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchConfiguracion = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/settings`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setMensajeBienvenida(data.facebook_mensaje_bienvenida || '');
          setMensajeFueraHorario(data.facebook_mensaje_fuera_horario || '');
          setMensajeDefault(data.facebook_mensaje_default || '');
          setPromptMeta(data.prompt_meta || '');
          setBienvenidaMeta(data.bienvenida_meta || '');
          setFaq(data.faq || []);
          setIntents(data.intents || []);

          if (data.facebook_page_id && data.facebook_access_token) {
            setConnected(true);
            setFacebookPageName(data.facebook_page_name || '');
            setInstagramPageName(data.instagram_page_name || '');
          } else {
            setConnected(false);
          }
        }
      } catch (error) {
        console.error('Error obteniendo configuración de Meta:', error);
      }
    };

    fetchConfiguracion();
  }, []);

  const handleGuardar = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          facebook_mensaje_bienvenida: mensajeBienvenida,
          facebook_mensaje_fuera_horario: mensajeFueraHorario,
          facebook_mensaje_default: mensajeDefault,
          prompt_meta: promptMeta,
          bienvenida_meta: bienvenidaMeta,
          faq,
          intents,
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
      setSaving(false);
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

  const handleDesconectar = async () => {
    if (!confirm('¿Seguro que deseas desconectar Facebook e Instagram?')) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          facebook_page_id: null,
          facebook_page_name: null,
          facebook_access_token: null,
          instagram_business_account_id: null,
          instagram_page_id: null,
          instagram_page_name: null,
        }),
      });

      if (res.ok) {
        alert('✅ Facebook e Instagram desconectados.');
        location.reload();
      } else {
        alert('❌ Error al desconectar.');
      }
    } catch (error) {
      console.error('Error desconectando:', error);
      alert('❌ Error al desconectar.');
    }
  };

  const handlePreviewSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    const respuestaBot = `Soy Amy, bienvenido a ${facebookPageName || 'nuestro negocio'}. ¿Cómo puedo ayudarte hoy?`;
    setMessages((prev) => [...prev, { role: 'assistant', content: respuestaBot }]);
    setInput('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-8 text-white bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f]">
      <div className="flex flex-col items-center w-full">

        <h1 className="text-3xl font-bold mb-6">Configuración de Meta (Facebook & Instagram)</h1>

        {connected ? (
          <div className="bg-green-500/20 text-green-300 font-semibold py-4 px-6 rounded-lg mb-6 text-center">
            <p>✅ Página conectada: {facebookPageName || 'Desconocido'}</p>
            {instagramPageName && (
              <p>✅ Instagram conectado: @{instagramPageName}</p>
            )}
            <button
              onClick={handleDesconectar}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all duration-200"
            >
              Desconectar Facebook/Instagram
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectFacebook}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-200 mb-6"
          >
            Conectar Facebook / Instagram
          </button>
        )}

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">

          {/* Entrenamiento */}
          <div className="flex flex-col gap-6">

          <TrainingHelp context="meta" />

            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Settings size={28} /> Instrucciones para el asistente
              </h2>
              <PromptGenerator
                infoClave={infoClaveMeta}
                funcionesAsistente={funcionesMeta}
                setInfoClave={setInfoClaveMeta}
                setFuncionesAsistente={setFuncionesMeta}
                idioma="es"
                membresiaActiva={true}
                onPromptGenerated={(nuevoPrompt) => setPromptMeta(nuevoPrompt)}
              />

            </div>

            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <NotebookText size={28} /> Preguntas frecuentes
              </h2>

              {/* Aquí podrías agregar FAQs */}
              {/* ... */}
            </div>

            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <MessageSquareText size={28} /> Intenciones personalizadas
              </h2>

              {/* Aquí podrías agregar intents */}
              {/* ... */}
            </div>

          </div>

          {/* Vista previa */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 flex flex-col">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BotMessageSquare size={28} /> Vista previa
            </h2>

            <div className="flex-1 flex flex-col overflow-y-auto bg-white/5 rounded-lg p-4 mb-4" ref={previewRef}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 my-2 rounded-lg max-w-xs ${
                    msg.role === 'user' ? 'bg-blue-500/20 ml-auto' : 'bg-green-500/20 mr-auto'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                placeholder="Escribe un mensaje..."
              />
              <button
                onClick={handlePreviewSend}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all duration-200"
              >
                Enviar
              </button>
            </div>
          </div>

        </div>

        <button
          onClick={handleGuardar}
          disabled={saving}
          className="mt-10 px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-xl disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>

        {saved && (
          <div className="text-green-400 font-medium mt-4 text-center">
            ✅ Configuración guardada exitosamente.
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
