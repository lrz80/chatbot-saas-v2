// src/app/dashboard/meta-config/page.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import Footer from '@/components/Footer';
import PromptGenerator from '@/components/PromptGenerator';
import TrainingHelp from '@/components/TrainingHelp';
import { BACKEND_URL } from '@/utils/api';
import { SiMeta, SiFacebook, SiInstagram, SiBookstack, SiBuffer, SiOpenai, SiMinutemailer } from 'react-icons/si';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const [isTyping, setIsTyping] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [usoMeta, setUsoMeta] = useState<any>(null);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // 🔄 fetchConfiguracion simplificado:
  const fetchConfiguracion = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/meta-config`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPromptMeta(data.prompt || '');
        setBienvenidaMeta(data.bienvenida || '');
        setFuncionesMeta(data.funciones_asistente || '');
        setInfoClaveMeta(data.info_clave || '');
        setMembresiaActiva(true); // Si la membresía viene de otro lado, ponlo aquí
        setMessages([{ role: 'assistant', content: data.bienvenida || '¡Hola! ¿En qué puedo ayudarte hoy?' }]);
      }
    } catch (error) {
      console.error('Error obteniendo configuración de Meta:', error);
    }
  };

  // 🔄 handleGuardar solo envía los campos correctos:
  const handleGuardar = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/meta-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          funciones_asistente: funcionesMeta,
          info_clave: infoClaveMeta,
          prompt: promptMeta,
          bienvenida: bienvenidaMeta,
          idioma: 'es', // O usa un selector si es dinámico
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
          intents,
          canal: 'facebook',
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
    setIsTyping(true);
  
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  
    try {
      const res = await fetch(`${BACKEND_URL}/api/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: mensajeUsuario, canal: 'preview-meta' }),
      });
  
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response || '...' }]);
    } catch (error) {
      console.error('❌ Error en vista previa:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Error generando respuesta' }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
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

  const router = useRouter();

  function requerirMembresia(callback: () => void) {
    if (!membresiaActiva) {
      router.push('/upgrade');
    } else {
      callback();
    }
  }

  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);
  
  useEffect(() => {
    const fetchUsos = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/usage`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUsoMeta(data.usos.find((u: any) => u.canal === 'meta'));
        }
      } catch (error) {
        console.error("Error obteniendo uso:", error);
      }
    };
    fetchUsos();
  }, []);

  const calcularPorcentaje = (usados: number, limite: number) => (usados / limite) * 100;
  const colorBarra = (porcentaje: number) => {
    if (porcentaje > 80) return "bg-red-500";
    if (porcentaje > 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const comprarMas = async (canal: string, cantidad: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout-credit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal,
          cantidad,
          redirectPath: "/dashboard/meta-config",
        }),
      });
  
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;  // Redirige a Stripe Checkout
      } else {
        alert("❌ Error al iniciar la compra.");
      }
    } catch (error) {
      console.error("❌ Error al procesar la compra:", error);
      alert("❌ Error al procesar la compra.");
    }
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
          <> 
            <p className="text-purple-300 font-medium">Conecta tu cuenta de Facebook e Instagram para comenzar.</p>
            <button
              onClick={() =>
                requerirMembresia(() => {
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
                })
              }
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition"
            >
              Conectar Facebook / Instagram
            </button>
          </>
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
              onClick={handleDesconectar}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-all h-fit"
            >
              Desconectar
            </button>

          </>
        )}
        </div>

        <TrainingHelp context="meta" />

        {usoMeta && (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <SiMeta /> Uso de Meta (FB & IG)
            </h3>
            <p className="text-white text-sm mb-2">
              {usoMeta.usados ?? 0} de {usoMeta.limite} mensajes utilizados (incluye créditos extra)
            </p>
            {usoMeta.limite > 500 && (
              <p className="text-green-300 text-sm">
                Incluye {usoMeta.limite - 500} mensajes extra comprados.
              </p>
            )}
            <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
              <div
                className={`h-full ${colorBarra(calcularPorcentaje(usoMeta.usados, usoMeta.limite))} transition-all duration-500`}
                style={{ width: `${calcularPorcentaje(usoMeta.usados, usoMeta.limite)}%` }}
              />
            </div>
            <div className="flex gap-2">
              {[500, 1000, 2000].map((extra) => (
                <button
                  key={extra}
                  onClick={() => comprarMas("meta", extra)}
                  className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
                >
                  +{extra}
                </button>
              ))}
            </div>
          </div>
        )}

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
            membresiaActiva={membresiaActiva}
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
          <button onClick={() => requerirMembresia(agregarFaq)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg mt-4">
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
          <button onClick={() => requerirMembresia(agregarIntent)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg mt-4">
            <PlusCircle /> Agregar Intención
          </button>
        </div>

        <div ref={previewRef} className="bg-[#0f0f25]/60 p-4 rounded max-h-[50vh] min-h-[200px] overflow-y-auto flex flex-col gap-3 mb-4 border border-white/10">
        <h3 className="text-xl font-bold mb-2 text-purple-300 flex items-center gap-2">
          <SiMinutemailer className="animate-pulse" size={24} />
          Vista previa del Asistente
        </h3>

          <div
            ref={chatContainerRef}
            style={{ height: '400px', overflowY: 'auto' }}
            className="bg-white/5 rounded-lg p-4 mb-4 space-y-2"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] p-3 rounded-lg text-sm flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-indigo-400/30 self-end text-right"
                    : "bg-green-400/30 self-start text-left"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className="max-w-[80%] bg-green-400/20 self-start text-left text-sm text-white px-4 py-2 rounded-lg italic animate-pulse">
                El asistente está escribiendo...
              </div>
            )}
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-2">
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
              className="w-full sm:flex-1 p-3 rounded-lg bg-white/10 border border-white/20 text-white"
              placeholder="Escribe un mensaje..."
            />

            <button
              onClick={() => requerirMembresia(handlePreviewSend)}
              className="w-full sm:w-auto px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all duration-200"
            >
              Enviar
            </button>
          </div>
        </div>

        <div className="flex justify-center mt-8">
        <button
          onClick={handleGuardar}
          className={`px-6 py-2 rounded-md font-semibold transition-all ${
            membresiaActiva
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-600 text-white/50 cursor-not-allowed"
          }`}
          disabled={!membresiaActiva}
        >
          {membresiaActiva ? "Guardar Configuración" : "Acción restringida por membresía"}
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
