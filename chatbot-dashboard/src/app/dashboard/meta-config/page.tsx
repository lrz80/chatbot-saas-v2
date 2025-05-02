'use client';

import { useEffect, useRef, useState } from 'react';
import Footer from '@/components/Footer';
import PromptGenerator from '@/components/PromptGenerator';
import TrainingHelp from '@/components/TrainingHelp';
import { BACKEND_URL } from '@/utils/api';
import { SiMeta, SiFacebook, SiInstagram, SiBookstack, SiBuffer, SiOpenai, SiMinutemailer } from 'react-icons/si';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function MetaConfigPage() {
  const [connected, setConnected] = useState(false);
  const [facebookPageName, setFacebookPageName] = useState('');
  const [instagramPageName, setInstagramPageName] = useState('');
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
  const [membresiaActiva, setMembresiaActiva] = useState(true);

  const previewRef = useRef<HTMLDivElement | null>(null);

  const fetchConfiguracion = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();

        setPromptMeta(data.prompt_meta || '');
        setBienvenidaMeta(data.bienvenida_meta || '');
        setFuncionesMeta(data.funciones_asistente || '');
        setInfoClaveMeta(data.info_clave || '');
        setFaq(data.faq || []);
        setIntents(data.intents || []);
        setMembresiaActiva(data.membresia_activa);

        if (data.facebook_page_id && data.facebook_access_token) {
          setConnected(true);
          setFacebookPageName(data.facebook_page_name || '');
          setInstagramPageName(data.instagram_page_name || '');
        } else {
          setConnected(false);
          setFacebookPageName('');
          setInstagramPageName('');
        }
      }
    } catch (error) {
      console.error('Error obteniendo configuración de Meta:', error);
    }
  };

  useEffect(() => {
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
          prompt_meta: promptMeta,
          bienvenida_meta: bienvenidaMeta,
          faq,
          intents
        }),
      });

      if (res.ok) {
        alert('✅ Facebook e Instagram desconectados.');
        await fetchConfiguracion();
      } else {
        alert('❌ Error al desconectar.');
      }
    } catch (error) {
      console.error('Error desconectando:', error);
      alert('❌ Error al desconectar.');
    }
  };

  const handlePreviewSend = async () => {
    if (!input.trim()) return;

    const mensajeUsuario = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: mensajeUsuario }]);
    setInput('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: mensajeUsuario, canal: 'preview-meta' }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('❌ Error en vista previa:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Error generando respuesta' }]);
    }
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
        <SiMeta size={36} className="text-sky-400 animate-pulse" /> Configuración de Facebook e Instagram
        </h1>

        {/* Estado de Conexión Facebook / Instagram */}
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/5 border border-white/20 rounded-xl p-4 shadow-md">

        {!connected ? (
          <div className="flex flex-col items-center text-center gap-3 w-full">
            <p className="text-lg font-medium">Conecta tu cuenta de Facebook e Instagram para comenzar.</p>
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
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-green-600/10 border border-green-400 text-green-300 rounded-lg px-4 py-2 text-sm font-medium min-w-[240px]">
              <SiFacebook className="text-blue-500" /> Página conectada: {facebookPageName}
              </div>

              <div className="flex items-center gap-2 bg-green-600/10 border border-green-400 text-green-300 rounded-lg px-4 py-2 text-sm font-medium min-w-[240px]">
              <SiInstagram className="text-pink-500" /> Instagram conectado: @{instagramPageName}
              </div>
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
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-all h-fit"
            >
              Desconectar
            </button>
          </>
        )}
        </div>

        <TrainingHelp context="meta" />

        <div className="bg-white/10 rounded-xl p-6 border border-white/20 shadow-md">
          <h3 className="text-xl font-bold mb-2 text-blue-400 flex items-center gap-2 mt-12">
            <SiOpenai className="animate-pulse" size={24} />
            Entrenamiento por Intención
          </h3>

          {/* Prompt Generator */}
          <PromptGenerator
            infoClave={infoClaveMeta}
            funcionesAsistente={funcionesMeta}
            setInfoClave={setInfoClaveMeta}
            setFuncionesAsistente={setFuncionesMeta}
            idioma="es"
            membresiaActiva={true}
            onPromptGenerated={(nuevoPrompt) => setPromptMeta(nuevoPrompt)}
          />

          {/* Mensaje de bienvenida */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-purple-300 mb-1"> Mensaje de bienvenida</label>
            <input
              list="sugerencias-bienvenida"
              value={bienvenidaMeta}
              onChange={(e) => setBienvenidaMeta(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
              placeholder="Escribe o selecciona una sugerencia"
            />

            <datalist id="sugerencias-bienvenida">
              <option value="Hola 👋 Soy Amy, tu asistente virtual. ¿En qué puedo ayudarte hoy?" />
              <option value="¡Bienvenido a nuestro estudio! ¿En qué te puedo asistir?" />
              <option value="Hola, soy Amy. ¿Te ayudo a reservar una cita o responder preguntas?" />
              <option value="¡Hola! Estoy aquí para ayudarte con precios, horarios y reservas." />
              <option value="Hola, ¿qué servicio te interesa hoy?" />
            </datalist>

          </div>

          {/* Prompt generado */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-purple-300 mb-1"> Instrucciones generadas</label>
            <textarea
              rows={6}
              value={promptMeta}
              onChange={(e) => setPromptMeta(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
              placeholder="Aquí aparecerá el prompt generado por el sistema..."
            />
          </div>

        </div>

        <div className="bg-white/10 rounded-xl p-6 border border-white/20 shadow-md">
          <h3 className="text-xl font-bold mb-2 text-green-400 flex items-center gap-2">
            <SiBookstack className="animate-pulse" size={24} />
            Preguntas Frecuentes
          </h3>
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
          <h3 className="text-xl font-bold mb-2 text-pink-400 flex items-center gap-2">
            <SiBuffer className="animate-pulse" size={24} />
            Flujos Guiados Interactivos
          </h3>
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
          <h3 className="text-xl font-bold mb-2 text-purple-300 flex items-center gap-2">
            <SiMinutemailer className="animate-pulse" size={24} />
            Vista previa del Asistente
          </h3>

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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePreviewSend();
              }
            }}
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

        <div className="flex justify-center mt-8">
        <button
          onClick={handleDesconectar}
          className={`px-4 py-2 rounded ${
            membresiaActiva
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-gray-600 text-white/50 cursor-not-allowed"
          }`}
          disabled={!membresiaActiva}
        >
          Acción restringida por membresía
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
