'use client';

import { useEffect, useRef, useState } from 'react';
import Footer from '@/components/Footer';
import PromptGenerator from '@/components/PromptGenerator';
import TrainingHelp from '@/components/TrainingHelp';
import { BACKEND_URL } from '@/utils/api';
import { BotMessageSquare, MessageSquareText, NotebookText, PlusCircle, Settings, Trash2 } from 'lucide-react';
import { FaFacebookSquare } from 'react-icons/fa'; // ✅ ícono oficial de Facebook

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
        const res = await fetch(`${BACKEND_URL}/api/settings`, { credentials: 'include' });
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
      if (res.ok) setSaved(true);
      else alert('❌ Error al guardar configuración.');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('❌ Error al guardar configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    const respuestaBot = `Soy Amy, bienvenido a ${facebookPageName || 'nuestro negocio'}. ¿Cómo puedo ayudarte hoy?`;
    setMessages((prev) => [...prev, { role: 'assistant', content: respuestaBot }]);
    setInput('');
  };

  const agregarFaq = () => setFaq([...faq, { pregunta: '', respuesta: '' }]);
  const eliminarFaq = (index: number) => setFaq(faq.filter((_, i) => i !== index));
  const actualizarFaq = (index: number, campo: string, valor: string) => {
    const nuevasFaq = [...faq];
    (nuevasFaq[index] as any)[campo] = valor;
    setFaq(nuevasFaq);
  };

  const agregarIntent = () => setIntents([...intents, { nombre: '', ejemplos: [], respuesta: '' }]);
  const eliminarIntent = (index: number) => setIntents(intents.filter((_, i) => i !== index));
  const actualizarIntent = (index: number, campo: string, valor: string) => {
    const nuevosIntents = [...intents];
    (nuevosIntents[index] as any)[campo] = valor;
    setIntents(nuevosIntents);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] text-white px-4 py-6 sm:px-6 md:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">

        <h1 className="text-3xl md:text-4xl font-extrabold text-center flex justify-center items-center gap-2 mb-8 text-purple-300">
        <FaFacebookSquare size={36} className="text-blue-500 animate-pulse" />Configuración de Facebook e Instagram
        </h1>

        {/* Estado de Conexión Facebook / Instagram */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/20 shadow-md flex flex-col items-center text-center gap-4 max-w-md mx-auto">
          {!connected ? (
            <>
              <p className="text-lg">Conecta tu cuenta de Facebook e Instagram para comenzar.</p>
              <button
                onClick={() => {
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
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-base transition-all"
              >
                Conectar Facebook / Instagram
              </button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-green-400 font-semibold text-base">✅ Página conectada: {facebookPageName || 'Desconocida'}</p>
                {instagramPageName && (
                  <p className="text-green-400 font-semibold text-base">✅ Instagram conectado: @{instagramPageName}</p>
                )}
              </div>
              <button
                onClick={async () => {
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
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-bold text-base transition-all"
              >
                Desconectar Facebook / Instagram
              </button>
            </>
          )}
        </div>

        <TrainingHelp context="meta" />

        <div className="bg-white/10 rounded-xl p-6 border border-white/20 shadow-md">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Settings size={28} /> Instrucciones</h2>
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

        <div className="bg-white/10 rounded-xl p-6 border border-white/20 shadow-md">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><NotebookText size={28} /> Preguntas Frecuentes</h2>
          {faq.map((item, index) => (
            <div key={index} className="flex flex-col gap-2 mb-4 bg-white/5 p-4 rounded-lg">
              <input
                type="text"
                placeholder="Pregunta"
                value={item.pregunta}
                onChange={(e) => actualizarFaq(index, 'pregunta', e.target.value)}
                className="p-2 bg-white/10 border border-white/20 rounded"
              />
              <input
                type="text"
                placeholder="Respuesta"
                value={item.respuesta}
                onChange={(e) => actualizarFaq(index, 'respuesta', e.target.value)}
                className="p-2 bg-white/10 border border-white/20 rounded"
              />
              <button onClick={() => eliminarFaq(index)} className="text-red-400 text-xs flex items-center gap-1">
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          ))}
          <button onClick={agregarFaq} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg mt-4">
            <PlusCircle /> Agregar Pregunta
          </button>
        </div>

        <div className="bg-white/10 rounded-xl p-6 border border-white/20 shadow-md">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><MessageSquareText size={28} /> Intenciones Personalizadas</h2>
          {intents.map((item, index) => (
            <div key={index} className="flex flex-col gap-2 mb-4 bg-white/5 p-4 rounded-lg">
              <input
                type="text"
                placeholder="Nombre de intención"
                value={item.nombre}
                onChange={(e) => actualizarIntent(index, 'nombre', e.target.value)}
                className="p-2 bg-white/10 border border-white/20 rounded"
              />
              <input
                type="text"
                placeholder="Respuesta"
                value={item.respuesta}
                onChange={(e) => actualizarIntent(index, 'respuesta', e.target.value)}
                className="p-2 bg-white/10 border border-white/20 rounded"
              />
              <button onClick={() => eliminarIntent(index)} className="text-red-400 text-xs flex items-center gap-1">
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          ))}
          <button onClick={agregarIntent} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg mt-4">
            <PlusCircle /> Agregar Intención
          </button>
        </div>

        <div className="bg-white/10 rounded-xl p-6 border border-white/20 shadow-md flex flex-col">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BotMessageSquare size={28} /> Vista previa
          </h2>

          <div className="flex-1 overflow-y-auto bg-white/5 rounded-lg p-4 mb-4 space-y-2" ref={previewRef}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg max-w-xs ${
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

        <div className="flex justify-center mt-10">
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="px-10 py-4 bg-green-600 hover:bg-green-700 text-2xl font-bold rounded-full disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {saved && (
          <div className="text-green-400 text-center mt-4 font-medium">
            ✅ Configuración guardada exitosamente.
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
