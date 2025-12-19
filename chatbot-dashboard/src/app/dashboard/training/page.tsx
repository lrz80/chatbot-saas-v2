"use client";

import Footer from '@/components/Footer';
import { useEffect, useRef, useState } from "react";
import TrainingHelp from "@/components/TrainingHelp";
import PromptGenerator from "@/components/PromptGenerator";
import { useRouter } from "next/navigation";
import { Save, } from "lucide-react";
import { BACKEND_URL } from "@/utils/api";
import { SiWhatsapp, SiMinutemailer } from 'react-icons/si';
import { MdWhatsapp } from "react-icons/md";
import FaqSection from "@/components/FaqSection";
import type { FaqSugerida } from "@/components/FaqSection";
import IntentSection, { Intent } from "@/components/IntentSection";
import CTASection from "@/components/CTASection";
import ChannelStatus from "@/components/ChannelStatus";
import MembershipBanner from "@/components/MembershipBanner";
import ConnectWhatsAppButton from "@/components/ConnectWhatsAppButton";
import ConnectWhatsAppEmbeddedSignupButton from "@/components/ConnectWhatsAppEmbeddedSignupButton";

const canal = 'whatsapp'; // o 'facebook', 'instagram', 'voz'

type SettingsState = {
  name: string;
  categoria: string;
  prompt: string;
  bienvenida: string;
  informacion_negocio: string;
  funciones_asistente: string;
  info_clave: string;
  idioma: string;
  cta_text: string;
  cta_url: string;
  membresia_activa: boolean;
  can_edit: boolean;
  trial_disponible: boolean;
  trial_activo: boolean;
  estado_membresia_texto: string;
  // 👇 ya lo tenías
  tenant_id?: string;
  // 👇 NUEVOS
  whatsapp_status?: string | null;
  whatsapp_phone_number_id?: string | null;
  whatsapp_phone_number?: string | null;
};

export default function TrainingPage() {
  const router = useRouter();
  type ChannelState = {
    enabled: boolean;              // pasa gates (plan + toggle)
    maintenance: boolean;          // bandera real de mantenimiento
    plan_enabled: boolean;         // plan permite WhatsApp
    settings_enabled: boolean;     // toggle global/tenant
    maintenance_message?: string | null;
  };

  const [channelState, setChannelState] = useState<ChannelState | null>(null);

  const bloquearSiNoMembresia = async (
    callback: () => Promise<void> | void
  ): Promise<void> => {
    if (!settings.can_edit) {
      router.push("/upgrade");
      return;
    }

    await callback();
  };
  const previewRef = useRef<HTMLDivElement | null>(null);
  const waPopupOpenedRef = useRef(false);
  const waConnectPendingRef = useRef(false);
  const [input, setInput] = useState("");
  type AssistantStructured =
  | string
  | {
      text?: string;
      mensaje?: string; // compat
      opciones?: Array<{ texto: string; respuesta?: string; submenu?: any }>;
    };

  type ChatMsg = { role: "user" | "assistant"; content: AssistantStructured };

  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [usoWhatsapp, setUsoWhatsapp] = useState<any>(null);
  
  const [intents, setIntents] = useState<Intent[]>([]);

  type WhatsAppNumberOption = {
    // viene del "aplanado"
    waba_id: string;
    waba_name: string | null;

    phone_number_id: string;
    display_phone_number: string;

    verified_name: string | null;
    code_verification_status?: string | null;
  };

  const [waAccounts, setWaAccounts] = useState<any[] | null>(null);

  const [waLoading, setWaLoading] = useState(false);
  const [waSaving, setWaSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  type Faq = {
    id?: number;
    pregunta: string;
    respuesta: string;
  };

  const [faq, setFaq] = useState<Faq[]>([]); // Usa el tipo importado de FaqSection si prefieres
  const [faqSugeridas, setFaqSugeridas] = useState<FaqSugerida[]>([]);
  
  const [settings, setSettings] = useState<SettingsState>({
    name: "",
    categoria: "",
    prompt: "Eres un asistente útil.",
    bienvenida: "¡Hola! ¿En qué puedo ayudarte hoy?",
    informacion_negocio: "",
    funciones_asistente: "",
    info_clave: "",
    idioma: "es",
    cta_text: "",
    cta_url: "",
    membresia_activa: false,
    can_edit: false,
    trial_disponible: false,
    trial_activo: false,
    estado_membresia_texto: "",
    tenant_id: undefined,
    whatsapp_status: null,
    whatsapp_phone_number_id: null,
    whatsapp_phone_number: null,
  });

  const isMembershipActive = Boolean(
    settings.membresia_activa || settings.trial_activo
  );
  const membershipInactive =
  !settings.membresia_activa && !settings.trial_activo;
  
  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);
  
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, faqRes, intentsRes, sugeridasRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/settings?canal=whatsapp`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/faqs?canal=whatsapp`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/intents?canal=whatsapp`, { credentials: "include" }),
          fetch(`${BACKEND_URL}/api/faqs/sugeridas?canal=whatsapp`, { credentials: "include" }),
        ]);
  
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings((prev) => ({
            ...prev,
            name: data.name || prev.name,
            categoria: data.categoria || prev.categoria,
            prompt: data.prompt || prev.prompt,
            bienvenida: data.bienvenida || prev.bienvenida,
            informacion_negocio: data.informacion_negocio || prev.informacion_negocio,
            funciones_asistente: data.funciones_asistente || prev.funciones_asistente,
            info_clave: data.info_clave || prev.info_clave,
            // ⬇️  claves de membresía/trial nuevas
            membresia_activa: !!data.membresia_activa,
            idioma: data.idioma || prev.idioma,
            cta_text: data.cta_text ?? prev.cta_text,
            cta_url:  data.cta_url  ?? prev.cta_url,

            trial_disponible: !!data.trial_disponible,
            trial_activo: !!(data.trial_vigente || data.trial_activo),
            can_edit: !!(data.can_edit ?? data.membresia_activa ?? data.trial_vigente),
            estado_membresia_texto: data.estado_membresia_texto || '',
            tenant_id: data.tenant_id || data.id || prev.tenant_id,
            // 👇 WhatsApp (Cloud API)
            whatsapp_status: data.whatsapp_status ?? prev.whatsapp_status ?? null,

            // ✅ ID REAL (lo que guardas en DB como whatsapp_phone_number_id)
            whatsapp_phone_number_id:
              data.whatsapp_phone_number_id ??
              data.whatsapp_phoneNumberId ??
              data.phoneNumberId ??
              prev.whatsapp_phone_number_id ??
              null,

            // ✅ Texto bonito (si el backend lo manda)
            whatsapp_phone_number:
              data.whatsapp_phone_number ??
              data.display_phone_number ??
              prev.whatsapp_phone_number ??
              null,
          }));
          setMessages([
            {
              role: "assistant",
              content: data.bienvenida ?? "¡Hola! ¿Cómo puedo ayudarte?",
            },
          ]);
        }

        if (faqRes.ok) setFaq(await faqRes.json());
        if (intentsRes.ok) {
          const arr = await intentsRes.json();
          const parsed: Intent[] = Array.isArray(arr)
            ? arr.map((x: any) => ({
                id: x?.id || (globalThis.crypto?.randomUUID?.() ?? String(Math.random())),
                nombre: x?.nombre ?? "",
                ejemplos: Array.isArray(x?.ejemplos) ? x.ejemplos : [],
                respuesta: x?.respuesta ?? "",
              }))
            : [];
          setIntents(parsed);
        }

        if (sugeridasRes.ok) setFaqSugeridas(await sugeridasRes.json());
  
      } catch (err) {
        console.error("❌ Error cargando configuración:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAll();
  }, []);  
  
  const handleChange = (e: any) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const canWhats = channelState?.enabled === true && !channelState?.maintenance;
  const disabledAll = !isMembershipActive || !canWhats;

  const canConnectWhatsApp =
    !!settings.can_edit && (channelState?.plan_enabled ?? true);

  const loadWhatsAppAccounts = async () => {
    console.log("[WA UI] loadWhatsAppAccounts() CLICK");

    try {
      setWaLoading(true);

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      const url = `${base}/api/meta/whatsapp/phone-numbers`;

      console.log("[WA UI] base:", base);
      console.log("[WA UI] GET:", url);

      const r = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      console.log("[WA UI] status:", r.status);

      const data = await r.json().catch(() => ({}));
      console.log("[WA UI] body:", data);

      // Ajusta este mapping según tu backend
      // Si tu backend responde { ok:true, accounts:[...] }
      const accounts = Array.isArray((data as any)?.accounts) ? (data as any).accounts : [];

      // ✅ APLANAR accounts -> phone_numbers para que tu UI haga map() de números
      const flat: WhatsAppNumberOption[] = accounts.flatMap((acc: any) => {
        const numbers = Array.isArray(acc?.phone_numbers) ? acc.phone_numbers : [];
        return numbers.map((p: any) => ({
          waba_id: String(acc?.waba_id),
          waba_name: acc?.waba_name ?? null,

          phone_number_id: String(p?.phone_number_id),
          display_phone_number: String(p?.display_phone_number),

          verified_name: p?.verified_name ?? null,
          code_verification_status: p?.code_verification_status ?? null,
        }));
      });

      console.log("[WA UI] flat numbers length:", flat.length);
      setWaAccounts(flat);

      // ✅ Si settings no trae phone_number_id desde /api/settings,
      // usa el primer número encontrado solo para reflejar conexión en UI.
      setSettings((prev) => {
        if (prev.whatsapp_phone_number_id || prev.whatsapp_phone_number) return prev;
        if (!flat.length) return prev;

        return {
          ...prev,
          whatsapp_status: "connected",
          whatsapp_phone_number_id: flat[0].phone_number_id,
          whatsapp_phone_number: flat[0].display_phone_number,
        };
      });

    } catch (err) {
      console.error("[WA UI] loadWhatsAppAccounts ERROR:", err);
      setWaAccounts([]);
    } finally {
      setWaLoading(false);
    }
  };

  useEffect(() => {
    // Si ya hay conexión (por ID o por phone visible), auto-carga números
    if (!settings.tenant_id) return;

    const connected =
      !!settings.whatsapp_phone_number_id || !!settings.whatsapp_phone_number;

    if (!connected) return;

    // Si aún no cargó waAccounts, los carga automáticamente
    if (waAccounts === null) {
      loadWhatsAppAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.tenant_id, settings.whatsapp_phone_number_id, settings.whatsapp_phone_number]);

  const handleSelectWhatsAppNumber = async (opt: WhatsAppNumberOption) => {
    if (!opt) return;

    if (
      !window.confirm(
        `Do you want to assign number ${opt.display_phone_number} (${
          opt.verified_name || "Unverified name"
        }) to this business?`

      )
    ) {
      return;
    }

    try {
      setWaSaving(true);

      // 1) Guardar selección del número en el tenant
      const res = await fetch(`${BACKEND_URL}/api/meta/whatsapp/select-number`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wabaId: opt.waba_id,
          phoneNumberId: opt.phone_number_id,
          displayPhoneNumber: opt.display_phone_number,
        }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.ok) {
        console.error("[WA META] Error saving WA number:", data);
        alert(data?.error || "Unable to save the selected number.");
        return;
      }

      // 2) AHORA (CRÍTICO): finalizar onboarding y guardar:
      // whatsapp_system_user_id, whatsapp_system_user_token, whatsapp_business_manager_id
      const res2 = await fetch(
        `${BACKEND_URL}/api/meta/whatsapp/onboard-complete`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wabaId: opt.waba_id,
            phoneNumberId: opt.phone_number_id,
          }),
        }
      );

      const data2 = await res2.json().catch(() => ({} as any));
      if (!res2.ok || !data2?.ok) {
        console.error("[WA META] Error onboard-complete:", data2);
        alert(
          data2?.error ||
            "Se guardó el número, pero falló el onboarding completo (System User/Token)."
        );
        return;
      }

      console.log("[WA META] onboard-complete OK:", data2);

      // ✅ 3) Actualiza UI local de inmediato (sin esperar /api/settings)
      setSettings((prev) => ({
        ...prev,
        whatsapp_status: "connected",
        whatsapp_phone_number_id: opt.phone_number_id,
        whatsapp_phone_number: opt.display_phone_number,
      }));

      alert("WhatsApp conectado correctamente ✅");

      // ✅ 4) Cargar números automáticamente para que se vean sin botón
      await loadWhatsAppAccounts();

    } catch (err) {
      console.error("[WA META] Error saving WA number:", err);
      alert("Error while saving the WhatsApp number.");
    } finally {
      setWaSaving(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (
      !window.confirm(
        "Are you sure you want to disconnect WhatsApp from this business? You can connect it again at any time."
      )
    ) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/meta/whatsapp/connection`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        console.error("❌ Error disconnecting WhatsApp:", data);
        alert(data?.error || "Unable to disconnect WhatsApp account.");
        return;
      }

      // ✅ Clear local state COMPLETO (incluye el ID)
      setSettings((prev) => ({
        ...prev,
        whatsapp_phone_number_id: null,
        whatsapp_phone_number: null,
        whatsapp_status: "disconnected",
      }));

      // ✅ Limpia lista de números y vuelve al estado inicial (botón "Ver números")
      setWaAccounts(null);

      alert("WhatsApp disconnected successfully for this business. ✅");

      // ✅ En client components, esto es lo más confiable para rehidratar
      window.location.reload();

    } catch (err) {
      console.error("❌ Error disconnecting WhatsApp:", err);
      alert("Error disconnecting WhatsApp. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const verificarPermiso = (e?: Event | React.SyntheticEvent) => {
    if (channelState?.maintenance) {
      e?.preventDefault();
      alert(`🛠️ WhatsApp en mantenimiento. ${channelState.maintenance_message || ""}`);
      return false;
    }
    if (channelState?.enabled === false) {
      e?.preventDefault();
      alert("📴 El canal WhatsApp está deshabilitado en tu configuración.");
      return false;
    }
    if (!settings.can_edit) {
      e?.preventDefault();
      // Si no puede editar, puede ser que tenga trial disponible => lo mandaremos al flujo correcto con el banner
      alert("⚠️ Activa un plan o tu prueba gratis para usar este canal.");
      router.push("/upgrade");
      return false;
    }

    return true;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/channel-settings?canal=${canal}`, {
          credentials: "include",
        });
        const d = await res.json();

        // ✅ Usa el 'enabled' ya calculado por el backend.
        setChannelState({
          enabled: !!d.enabled,
          maintenance: !!d.maintenance,
          plan_enabled: !!d.plan_enabled,
          settings_enabled: !!d.settings_enabled,
          maintenance_message: d.maintenance_message || null,
        });
      } catch (err) {
        console.error("❌ Error obteniendo channel settings (whatsapp):", err);
        setChannelState({
          enabled: false,
          maintenance: false,
          plan_enabled: false,
          settings_enabled: false,
          maintenance_message: null,
        });
      }
    })();
  }, []);

  async function fetchWithChannelGuard(input: RequestInfo | URL, init?: RequestInit) {
    const res = await fetch(input, init);
    if (res.status === 403) {
      const j = await res.json().catch(() => ({} as any));
      if (j?.error === "channel_blocked") {
        try {
          const s = await fetch(`${BACKEND_URL}/api/channel-settings?canal=${canal}`, { credentials: "include" });
          const d = await s.json();
          setChannelState({
            enabled: !!d.enabled,
            maintenance: !!d.maintenance,
            plan_enabled: !!d.plan_enabled,
            settings_enabled: !!d.settings_enabled,
            maintenance_message: d.maintenance_message || null,
          });
          if (d.maintenance) alert(`🛠️ WhatsApp en mantenimiento. ${d.maintenance_message || ""}`);
          else alert("📴 WhatsApp deshabilitado en tu configuración.");
        } catch { /* noop */ }
        throw new Error("channel_blocked");
      }
    }
    return res;
  }

  const handleSave = async () => {
    if (!verificarPermiso()) return;
    setSaving(true);
  
    // 1) Construye base con posibles campos
    const base = {
      nombre_negocio: settings.name,
      categoria: settings.categoria,
      idioma: settings.idioma,
      prompt: settings.prompt?.trim(),
      bienvenida: settings.bienvenida?.trim(),
      informacion_negocio: settings.informacion_negocio?.trim(),
      funciones_asistente: settings.funciones_asistente?.trim(),
      info_clave: (settings.info_clave ?? '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{2,}/g, '\n')
        .trim(),
      cta_text: settings.cta_text?.trim(),
      cta_url:  settings.cta_url?.trim(),
    };
  
    // 2) Filtra claves vacías/indefinidas (no pisar con '')
    const payload: Record<string, any> = {};
    Object.entries(base).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        payload[k] = v;
      }
    });
  
    console.log("📤 Enviando payload a /api/settings (PATCH):", payload);
  
    try {
      const res = await fetchWithChannelGuard(`${BACKEND_URL}/api/settings?canal=${canal}`, {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json().catch(() => ({}));
      console.log("✅ Respuesta del servidor:", data);
  
      if (!res.ok) {
        alert("❌ Error al guardar: " + (data?.error || "Error desconocido"));
      } else {
        alert("Configuración del bot guardada ✅");
      }
    } catch (err) {
      console.error("❌ Error en handleSave:", err);
      alert("Error al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };  

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!verificarPermiso()) return;
    await sendPreview(input.trim());
  };

  // 👉 Cuando el usuario hace clic en una opción de flujo
  const handleFlowOptionClick = async (texto: string) => {
    if (!verificarPermiso()) return;
    await sendPreview(texto);
  };

  const saveIntents = async () => {
  if (!verificarPermiso()) return;

  const intencionesLimpias = intents
    .map(i => ({
      nombre: (i.nombre || '').trim(),
      ejemplos: (i.ejemplos || []).map(e => (e || '').trim()).filter(Boolean),
      respuesta: (i.respuesta || '').trim(),
    }))
    .filter(i => i.nombre && i.ejemplos.length > 0 && i.respuesta);

  if (!intencionesLimpias.length) {
    return alert("❌ Agrega al menos una intención válida.");
  }

  try {
    // 👇 usa PUT + canal explícito -> el backend borra TODO y vuelve a insertar
    const res = await fetch(`${BACKEND_URL}/api/intents?canal=${canal}`, {
      method: "PUT",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intents: intencionesLimpias }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return alert(`❌ Error al guardar intenciones: ${json?.error || res.statusText}`);
    }

    // Opcional: ver cuántas borró/insertó
    console.log("PUT /api/intents =>", json);

    alert("Intenciones guardadas ✅");

    // Recargar desde DB
    const r2 = await fetch(`${BACKEND_URL}/api/intents?canal=${canal}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (r2.ok) {
      const arr2 = await r2.json();
      const parsed2: Intent[] = Array.isArray(arr2)
        ? arr2.map((x: any): Intent => ({
            id: x?.id, // puede venir o no; TS ok porque es opcional
            nombre: x?.nombre ?? "",
            ejemplos: Array.isArray(x?.ejemplos) ? x.ejemplos : [],
            respuesta: x?.respuesta ?? "",
          }))
        : [];
      setIntents(parsed2);

    }
  } catch (e) {
    console.error("❌ Error guardando intenciones (PUT):", e);
    alert("❌ Error guardando intenciones.");
  }
};

    
  const saveFaqs = async () => {
    if (!verificarPermiso()) return;
  
    // Normaliza/valida
    const faqsValidas = (faq ?? [])
      .map(f => ({
        pregunta: (f.pregunta || "").trim(),
        respuesta: (f.respuesta || "").trim(),
      }))
      .filter(f => f.pregunta && f.respuesta);
  
    if (!faqsValidas.length) {
      alert("❌ Agrega al menos una FAQ válida.");
      return;
    }
  
    try {
      const res = await fetchWithChannelGuard(`${BACKEND_URL}/api/faqs?canal=${canal}`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faqs: faqsValidas }),
      });
  
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`❌ Error al guardar FAQs: ${json?.error || res.statusText}`);
        return;
      }
  
      // Recarga desde DB
      const reload = await fetch(`${BACKEND_URL}/api/faqs?canal=${canal}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (reload.ok) setFaq(await reload.json());
  
      alert("FAQs guardadas ✅");
    } catch (e) {
      console.error("❌ Error guardando FAQs:", e);
      alert("❌ Error guardando FAQs.");
    }
  };
  
  // 🔁 Envío reutilizable para preview (WhatsApp)
  const sendPreview = async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsTyping(true);
    setInput("");
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);

    try {
      // ⬇️ Nuevo endpoint específico de WhatsApp
      const res = await fetchWithChannelGuard(`${BACKEND_URL}/api/preview/whatsapp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const resp = data?.response;

      // Si es estructura de flujo (objeto), la guardamos tal cual para renderizar botones
      if (resp && typeof resp === "object") {
        setMessages((prev) => [...prev, { role: "assistant", content: resp }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: String(resp ?? "...") },
        ]);
      }
    } catch (e) {
      console.error("❌ Error en preview:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, ocurrió un error en la vista previa." },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  };  
  
  // Agrega esta función dentro del componente
  const comprarMas = async (canal: string, cantidad: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout-credit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal,
          cantidad,
          redirectPath: "/dashboard/training",  // Puedes ajustar si necesitas otro path
        }),
      });
  
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;  // Redirige a Stripe Checkout
      } else {
        alert("❌ Error al iniciar la compra.");
      }
    } catch (error) {
      console.error("❌ Error al comprar créditos:", error);
      alert("❌ Error al procesar la compra.");
    }
  };  

  useEffect(() => {
    const fetchUsos = async () => {
      const res = await fetch(`${BACKEND_URL}/api/usage`, { credentials: "include" });
      const data = await res.json();
      setUsoWhatsapp(data.usos.find((u: any) => u.canal === "whatsapp"));
    };
    fetchUsos();
  }, []);

  const calcularPorcentaje = (usados: number, limite: number) => {
    if (!limite || limite === 0) return 0;
    return (usados / limite) * 100;
  };
  
  const colorBarra = (porcentaje: number) => {
    if (porcentaje > 80) return "bg-red-500";
    if (porcentaje > 50) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  // 🧩 Renderiza contenido del asistente: string o estructura de flujo
  const renderAssistantContent = (content: AssistantStructured) => {
    if (typeof content === "string") return <>{content}</>;

    const texto = content?.text ?? content?.mensaje ?? "";
    const opciones = Array.isArray(content?.opciones) ? content.opciones : [];

    return (
      <div className="flex flex-col gap-2">
        {texto && <div>{texto}</div>}
        {!!opciones.length && (
          <div className="flex flex-wrap gap-2 mt-1">
            {opciones.map((op, idx) => (
              <button
                key={idx}
                onClick={() => handleFlowOptionClick(op.texto)}
                className="px-3 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs"
              >
                {op.texto}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 🟢 Escuchar mensaje del popup de WhatsApp
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Opcional: validar origen
      // if (!event.origin.includes("aamy.ai")) return;

      const data = event.data;
      if (!data) return;

      // Coincide con lo que realmente envía el popup:
      // { connected: true, channel: 'whatsapp' }
      const isWhatsAppConnected =
        typeof data === "object" &&
        data.connected === true &&
        data.channel === "whatsapp";

      if (isWhatsAppConnected) {
        console.log("[TRAINING] WhatsApp connected: refreshing UI...");

        // 2 opciones válidas:
        // Opción 1: Recarga toda la página (seguro y funciona siempre)
        window.location.reload();

        // O bien, si quieres mantener estado:
        // router.refresh();
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    }, []);

    useEffect(() => {
      const onFocus = async () => {
        if (!waPopupOpenedRef.current) return;
        waPopupOpenedRef.current = false;

        console.log("[WA] focus back after popup -> auto load numbers");
        await loadWhatsAppAccounts();
      };

      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  if (loading) return <p className="text-center">Cargando configuración...</p>;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] to-[#1e1e3f] text-white px-3 py-4 sm:px-6 md:px-8">
      <div className="w-full max-w-5xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md px-4 py-5 sm:p-8">

        {/* 🎁 Caso 1: Nunca ha usado el trial → invitar a activar prueba (vía Stripe) */}
        {settings?.trial_disponible && !settings?.can_edit && (
          <div className="mb-6 p-4 bg-purple-500/20 border border-purple-400 text-purple-100 rounded-lg text-center font-medium">
            🎁 <strong>Prueba Aamy 14 días</strong> eligiendo un plan. La prueba se aplica automáticamente en Stripe.
            <button
              onClick={() => router.push('/upgrade?trial=1')}
              className="ml-3 inline-flex items-center px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              Elegir plan y probar gratis
            </button>
          </div>
        )}

        {/* 🟡 Caso 2: Trial activo (puede editar) → aviso informativo */}
        {!settings?.membresia_activa && settings?.trial_activo && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-400 text-yellow-200 rounded-lg text-center font-medium">
            🟡 Estás usando la <strong>prueba gratis</strong>. ¡Aprovecha para configurar tu asistente!
          </div>
        )}

        {/* 🔴 Caso 3: Sin plan y sin trial activo → banner de inactiva */}
        {!settings?.can_edit && !settings?.trial_disponible && !settings?.trial_activo && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-center font-medium">
            🚫 Tu membresía está inactiva. No puedes guardar cambios ni entrenar el asistente.{' '}
            <a onClick={() => router.push('/upgrade')} className="underline cursor-pointer">
              Activa un plan para continuar.
            </a>
          </div>
        )}

        <h1
          className="
            text-2xl
            sm:text-3xl
            md:text-4xl
            font-extrabold
            text-center
            flex flex-col sm:flex-row
            justify-center items-center
            gap-2
            mb-6 md:mb-8
            text-purple-300
          "
        >
          <SiWhatsapp 
            size={28} 
            className="text-green-400 animate-pulse sm:size-9"
             />
          <span>
            Configuración del Asistente
            <br className="sm:hidden" />
            de WhatsApp
          </span>
        </h1>

        <ChannelStatus
          canal="whatsapp"
          showBanner
          hideTitle
          membershipInactive={membershipInactive}
        />

        <TrainingHelp context="training" />

        {/* Conexión de número oficial de WhatsApp (Meta Business / Cloud API) */}
        <div
          onClick={() => {
            // Marcamos que el usuario abrió el popup. Al volver el foco, refrescamos.
            waConnectPendingRef.current = true;
          }}
        >
          <div onClick={() => (waPopupOpenedRef.current = true)}>
            <ConnectWhatsAppEmbeddedSignupButton
              disabled={!canConnectWhatsApp}
              tenantId={settings.tenant_id}
            />
          </div>

        </div>

        {/* Selector de WABA / número cuando ya hay tenant y acceso a Meta */}
        {settings.tenant_id && (
          <div className="mt-4 mb-6 p-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <MdWhatsapp className="text-green-400" />
              Número de WhatsApp
            </h2>

            {settings.whatsapp_phone_number_id ? (
              <p className="text-sm text-emerald-100 mb-2">
                Número Conectado:{" "}
                <span className="font-mono font-semibold">
                  {settings.whatsapp_phone_number ?? "(conectado)"}
                </span>
              </p>
            ) : (
              <p className="text-sm text-emerald-100 mb-2">
                Aún no hay un número seleccionado. Conecta WhatsApp y luego
                elige uno de tu cuenta de Meta.
              </p>
            )}

            {canConnectWhatsApp && (
              <div className="mt-3">
                {waAccounts === null && (
                  <button
                    type="button"
                    onClick={loadWhatsAppAccounts}
                    disabled={waLoading}
                    className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-60"
                  >
                    {waLoading ? "Cargando números..." : "Ver números disponibles"}
                  </button>
                )}

            {waAccounts !== null && (
              <button
                type="button"
                onClick={() => {
                  setWaAccounts(null);
                  setTimeout(loadWhatsAppAccounts, 0);
                }}
                disabled={waLoading}
                className="mt-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm disabled:opacity-60"
              >
                {waLoading ? "Recargando..." : "Recargar números"}
              </button>
            )}

                  {Array.isArray(waAccounts) && waAccounts.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-52 overflow-y-auto text-sm">
                    {waAccounts.map((opt) => (
                      <button
                        key={opt.phone_number_id}
                        type="button"
                        onClick={() => handleSelectWhatsAppNumber(opt)}
                        disabled={waSaving}
                        className="w-full text-left px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div>
                            <div className="font-semibold">
                              {opt.verified_name ||
                                "WhatsApp Business Account"}
                            </div>
                            <div className="font-mono text-xs text-emerald-200">
                              {opt.display_phone_number}
                            </div>
                          </div>
                          <span className="text-xs text-emerald-200">
                            {opt.waba_name || "Business"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {Array.isArray(waAccounts) &&
                  waAccounts.length === 0 &&
                  !waLoading && (
                    <p className="text-xs text-emerald-200 mt-2">
                      No encontramos cuentas de WhatsApp Business con números
                      activos en tu cuenta de Meta.
                    </p>
                  )}
              </div>
            )}

            {/* 👇 NUEVO: botón para desconectar cuando hay número */}
            {settings.whatsapp_phone_number_id && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleDisconnectWhatsApp}
                  disabled={isDisconnecting}
                  className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDisconnecting ? "Desconectando..." : "Desconectar WhatsApp"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 🛠️ Mantenimiento real */}
        {channelState?.maintenance && (
          <div className="mb-6 p-4 bg-red-600/15 border border-red-600/40 text-red-200 rounded">
            <p className="font-semibold mb-1">WhatsApp en mantenimiento</p>
            <p className="text-sm">{channelState.maintenance_message || "Estamos trabajando para restablecer el servicio."}</p>
          </div>
        )}

        {/* 🚫 Bloqueo por configuración (si NO está en mantenimiento) */}
        {!channelState?.maintenance && channelState?.enabled === false && (
          <div className="mb-6 p-4 bg-yellow-500/15 border border-yellow-500/40 text-yellow-200 rounded">
            <p className="font-semibold mb-2">WhatsApp está deshabilitado en tu cuenta</p>
            <p className="text-sm mb-0">
              Actívalo en tu configuración o actualiza tu plan si aplica.
            </p>
          </div>
        )}

        {usoWhatsapp && (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <MdWhatsapp /> Uso de WhatsApp
            </h3>

            <p className="text-white text-sm mb-2">
              {usoWhatsapp.usados ?? 0} de {usoWhatsapp.limite} mensajes enviados
              { (usoWhatsapp.creditos_extras ?? 0) > 0 && " (incluye créditos extra)" }
            </p>

            {(usoWhatsapp.creditos_extras ?? 0) > 0 && (
              <p className="text-green-300 text-sm">
                Incluye {usoWhatsapp.creditos_extras} mensajes extra comprados.
              </p>
            )}

            <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
              <div
                className={`h-full ${colorBarra(
                  calcularPorcentaje(usoWhatsapp.usados, usoWhatsapp.limite)
                )} transition-all duration-500`}
                style={{
                  width: `${calcularPorcentaje(
                    usoWhatsapp.usados,
                    usoWhatsapp.limite
                  )}%`,
                }}
              />
            </div>

            <div className="flex gap-2">
              {[500, 1000, 2000].map((extra) => (
                <button
                  key={extra}
                  onClick={() => comprarMas("whatsapp", extra)}
                  className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
                >
                  +{extra}
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          name="name"
          value={settings.name}
          readOnly
          placeholder="Nombre del negocio"
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
        />
  
        <select
          name="idioma"
          value={settings.idioma}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
          disabled={disabledAll}
        >
          <option value="es">Español</option>
          <option value="en">Inglés</option>
        </select>
  
        <PromptGenerator
          infoClave={settings.info_clave}
          funcionesAsistente={settings.funciones_asistente}
          setInfoClave={(value) => setSettings((prev) => ({ ...prev, info_clave: value }))}
          setFuncionesAsistente={(value) =>
            setSettings((prev) => ({ ...prev, funciones_asistente: value }))
          }
          idioma={settings.idioma}
          membresiaActiva={!disabledAll}
          onPromptGenerated={(prompt) => setSettings((prev) => ({ ...prev, prompt }))}
        />
  
        <input
          name="bienvenida"
          value={settings.bienvenida}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
          placeholder="Mensaje de bienvenida"
          disabled={disabledAll}
        />
  
        <textarea
          name="prompt"
          value={settings.prompt}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border rounded mb-4 bg-white/10 border-white/20 text-white"
          placeholder="Prompt del sistema"
          disabled={disabledAll}
        />
  
        <CTASection canal={canal} membresiaActiva={!disabledAll} />

        <button
          onClick={() => bloquearSiNoMembresia(handleSave)}
          disabled={disabledAll}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 mb-10 ${
            !disabledAll
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-gray-600 text-white/50 cursor-not-allowed"
          }`}
        >
          <Save size={18} /> {saving ? "Guardando..." : "Guardar configuración"}
        </button>

        <FaqSection
          faqsSugeridas={faqSugeridas}
          setFaqsSugeridas={setFaqSugeridas}
          faqs={faq}
          setFaqs={setFaq}
          canal="whatsapp"
          membresiaActiva={!disabledAll}
          onSave={() => bloquearSiNoMembresia(saveFaqs)}
        />

        <IntentSection
          intents={intents}
          setIntents={setIntents}
          canal={canal}
          membresiaActiva={!disabledAll}
          onSave={() => bloquearSiNoMembresia(saveIntents)}
        />

        <div
          ref={previewRef}
          className="mt-8 sm:mt-10 bg-[#14142a]/60 backdrop-blur px-3 py-4 sm:p-6 rounded-xl border border-white/20"
        >

        <h3 className="text-lg sm:text-xl font-bold mb-2 text-purple-300 flex items-center gap-2">
          <SiMinutemailer className="animate-pulse" size={20} />
          Vista previa del Asistente
        </h3>

          <div
            ref={chatContainerRef}
            className="bg-[#0f0f25]/60 px-3 py-3 sm:p-4 rounded flex flex-col gap-2 sm:gap-3 mb-4 border border-white/10 h-64 sm:h-72 md:h-80 lg:h-96 overflow-y-auto"
          >

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] sm:max-w-[80%] px-3 py-2 sm:p-3 rounded-lg text-xs sm:text-sm flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-indigo-400/30 self-end text-right"
                    : "bg-green-400/30 self-start text-left"
                }`}
              >

                {msg.role === "assistant"
                  ? renderAssistantContent(msg.content)
                  : (typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content))}
              </div>
            ))}
            {isTyping && (
              <div className="max-w-[85%] sm:max-w-[80%] bg-green-400/20 self-start text-left text-xs sm:text-sm text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg italic animate-pulse">
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
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}              
              placeholder="Escribe algo..."
              disabled={disabledAll}
              className="w-full sm:flex-1 border px-3 py-2.5 sm:p-3 rounded bg-white/10 border-white/20 text-white text-sm placeholder-white/50"
            />
            <button
              onClick={() => bloquearSiNoMembresia(handleSend)}
              disabled={disabledAll}
              className={`w-full sm:w-auto px-4 py-2.5 rounded text-sm ${
                settings.membresia_activa
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-gray-600 text-white/50 cursor-not-allowed"
              }`}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  ); 
} 