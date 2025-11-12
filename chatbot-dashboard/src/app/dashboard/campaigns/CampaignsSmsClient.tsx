"use client";

import { useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "@/utils/api";
import Footer from "@/components/Footer";
import {
  SiTwilio,
  SiGoogleanalytics,
  SiCampaignmonitor,
  SiMinutemailer,
  SiGooglecalendar,
  SiCheckmarx,
  SiProbot,
  SiStatuspal,
} from "react-icons/si";
import { MdSms } from "react-icons/md";
import { FaAddressBook } from "react-icons/fa";
import TrainingHelp from "@/components/TrainingHelp";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { DateTime } from "luxon";
import { useSearchParams } from "next/navigation";
import { useFeatures } from '@/hooks/usePlan';
import ChannelStatus from "@/components/ChannelStatus";

export default function CampaignsSmsClient() {
  const [form, setForm] = useState({
    nombre: "",
    contenido: "",
    fecha_envio: "",
    segmentos: [] as string[],
  });

  const searchParams = useSearchParams();
  const creditoOk = searchParams.get("credito") === "ok";
  const contactosOk = searchParams.get("contactos") === "ok";

  const [limiteContactos, setLimiteContactos] = useState(500);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contactos, setContactos] = useState<any[]>([]);
  const [cantidadContactos, setCantidadContactos] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [membresiaActiva, setMembresiaActiva] = useState<boolean>(false);
  const [usoSms, setUsoSms] = useState<{ usados: number; limite: number } | null>(null);
  const [archivoCsv, setArchivoCsv] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { loading: loadingPlan, features, esTrial } = useFeatures();
  type ChannelState = {
   enabled: boolean;
   maintenance: boolean;
   plan_enabled: boolean;
   settings_enabled: boolean;
   maintenance_message?: string | null;
 };
 const [channelState, setChannelState] = useState<ChannelState | null>(null);
 const [trialDisponible, setTrialDisponible] = useState<boolean>(false);
 const [trialActivo, setTrialActivo] = useState<boolean>(false);
 const [canEdit, setCanEdit] = useState<boolean>(false);

 const loadingChannel = channelState === null;
 const canSmsPlan = !loadingPlan && !!features?.sms; // del plan
 const canSms = !!channelState?.enabled;
 const disabledAll = !canSms || !canEdit;

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/campaigns`, { credentials: "include" })
      .then((res) => res.json())
      .then(async (data) => {
        const smsOnly = (data || []).filter((c: any) => c.canal === "sms");

        const enriched = await Promise.all(
          smsOnly.map(async (c: any) => {
            try {
              const res = await fetch(`${BACKEND_URL}/api/campaigns/${c.id}/sms-status`, {
                credentials: "include",
              });
              const entregas = res.ok ? await res.json() : [];
              return { ...c, entregas };
            } catch {
              return { ...c, entregas: [] };
            }
          })
        );

        setCampaigns(enriched);
      });

    fetch(`${BACKEND_URL}/api/contactos/limite`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setLimiteContactos(data.limite || 500);
        setCantidadContactos(data.total || 0);
      })
      .catch((err) => console.error("❌ Error cargando límite de contactos:", err));

    fetch(`${BACKEND_URL}/api/contactos`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setContactos(data || []));

    fetch(`${BACKEND_URL}/api/settings`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setMembresiaActiva(data?.membresia_activa === true);
        setTrialDisponible(Boolean(data?.trial_disponible));
        setTrialActivo(Boolean(data?.trial_vigente || data?.trial_activo));
        setCanEdit(Boolean(
          data?.can_edit ??
          data?.membresia_activa ??
          (data?.trial_vigente || data?.trial_activo)
        ));
      })
      .catch(err => console.error("❌ Error obteniendo membresía:", err));

    fetch(`${BACKEND_URL}/api/usage`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const sms = (data.usos || []).find((u: any) => u.canal === "sms");
        setUsoSms({ usados: sms?.usados ?? 0, limite: sms?.limite ?? 500 });
      })
      .catch((err) => console.error("❌ Error cargando uso SMS:", err));
  }, []);

  const toggleSegmento = (id: string) => {
    setForm((prev) => ({
      ...prev,
      segmentos: prev.segmentos.includes(id)
        ? prev.segmentos.filter((s) => s !== id)
        : [...prev.segmentos, id],
    }));
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.fecha_envio || form.segmentos.length === 0) {
      alert("Completa todos los campos.");
      return;
    }

    const destinatarios = contactos
      .filter((c: any) => form.segmentos.includes(c.segmento))
      .map((c: any) => c.telefono)
      .filter((t: string) => /^\+?\d{10,15}$/.test(t));

    if (destinatarios.length === 0) {
      alert("❌ No hay números válidos para enviar SMS.");
      return;
    }

    const data = new FormData();
    data.append("nombre", form.nombre);
    data.append("canal", "sms");
    data.append("contenido", form.contenido);

    const fechaUTC = new Date(form.fecha_envio).toISOString();
    data.append("fecha_envio", fechaUTC);
    data.append("destinatarios", JSON.stringify(destinatarios));

    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/campaigns`, {
        method: "POST",
        body: data,
        credentials: "include",
      });

      const json = await res.json();
      setLoading(false);

      if (res.status === 403 && json?.error === "channel_blocked") {
        const st = await fetch(`${BACKEND_URL}/api/channel-settings?canal=sms`, { credentials: "include" })
          .then(r => r.json()).catch(() => ({}));
        setChannelState({
          enabled: !!st.enabled,
          maintenance: !!st.maintenance,
          plan_enabled: !!st.plan_enabled,
          settings_enabled: !!st.settings_enabled,
          maintenance_message: st.maintenance_message || null,
        });
        if (st.maintenance) {
          alert(`🛠️ Canal SMS en mantenimiento. ${st.maintenance_message || "Inténtalo más tarde."}`);
        } else if (!st.plan_enabled) {
          alert("❌ Tu plan no incluye SMS. Actualiza para habilitar campañas por SMS.");
          window.location.href = "/upgrade";
        } else {
          alert("📴 Canal SMS deshabilitado en tu configuración. Habilítalo en Ajustes.");
        }
        return;
      } else if (res.ok) {
        alert("✅ Campaña enviada");
        setForm({ nombre: "", contenido: "", fecha_envio: "", segmentos: [] });
        setCampaigns((prev) => [json, ...prev]);
      } else {
        alert(`❌ ${json.error || "Error desconocido"}`);
      }
    } catch (err) {
      setLoading(false);
      console.error("❌ Error de red:", err);
      alert("❌ Error al conectar con el servidor.");
    }
  };

  const handleSubirCsv = async () => {
    if (!archivoCsv) return;
  
    // Validación básica: ejemplo, tamaño 5MB max y .csv
    if (archivoCsv.size > 5 * 1024 * 1024 || !archivoCsv.name.endsWith(".csv")) {
      alert("❌ El archivo debe ser .csv y pesar menos de 5MB");
      return;
    }
  
    // Validar límite
    if (cantidadContactos >= limiteContactos) {
      alert("❌ Has alcanzado el límite de contactos. Compra más para subir tu lista.");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("file", archivoCsv);
  
      const res = await fetch(`${BACKEND_URL}/api/contactos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
  
      const json = await res.json();
  
      if (res.status === 403 && json?.error === "channel_blocked") {
          const st = await fetch(`${BACKEND_URL}/api/channel-settings?canal=sms`, { credentials: "include" })
            .then(r => r.json()).catch(() => ({}));
          setChannelState({
            enabled: !!st.enabled,
            maintenance: !!st.maintenance,
            plan_enabled: !!st.plan_enabled,
            settings_enabled: !!st.settings_enabled,
            maintenance_message: st.maintenance_message || null,
          });
          if (st.maintenance) {
            alert(`🛠️ Canal SMS en mantenimiento. ${st.maintenance_message || "Inténtalo más tarde."}`);
          } else if (!st.plan_enabled) {
            alert("❌ Tu plan no incluye SMS. Actualiza para habilitar campañas por SMS.");
            window.location.href = "/upgrade";
          } else {
            alert("📴 Canal SMS deshabilitado en tu configuración. Habilítalo en Ajustes.");
          }
          return;
        } else if (res.ok) {
        alert(`✅ ${json.nuevos} contactos agregados`);
        inputRef.current?.value && (inputRef.current.value = "");
        setArchivoCsv(null);
        setCantidadContactos((prev) => prev + json.nuevos);
      } else {
        alert(`❌ ${json.error || "Error al subir archivo"}`);
      }
    } catch (err) {
      console.error("❌ Error al subir archivo:", err);
      alert("❌ Falló la conexión con el servidor");
    }
  };
  
  const eliminarCampana = async (id: number) => {
  // ⛔️ Bloqueo por plan/membresía
  if (guardSms()) return;

  if (!confirm("¿Estás seguro de que deseas eliminar esta campaña?")) return;

  try {
    const res = await fetch(`${BACKEND_URL}/api/campaigns/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      alert("✅ Campaña eliminada");
    } else {
      if (res.status === 403) {
        try {
          const j = await res.json();
          if (j?.error === "channel_blocked") {
            const st = await fetch(`${BACKEND_URL}/api/channel-settings?canal=sms`, { credentials: "include" })
              .then(r => r.json()).catch(() => ({}));
            setChannelState({
              enabled: !!st.enabled,
              maintenance: !!st.maintenance,
              plan_enabled: !!st.plan_enabled,
              settings_enabled: !!st.settings_enabled,
              maintenance_message: st.maintenance_message || null,
            });
            if (st.maintenance) {
              alert(`🛠️ Canal SMS en mantenimiento. ${st.maintenance_message || "Inténtalo más tarde."}`);
            } else if (!st.plan_enabled) {
              alert("❌ Tu plan no incluye SMS. Actualiza para habilitar campañas por SMS.");
              window.location.href = "/upgrade";
            } else {
              alert("📴 Canal SMS deshabilitado en tu configuración. Habilítalo en Ajustes.");
            }
            return;
          }
        } catch {}
        alert("❌ Error al eliminar campaña");
      }
    }
  } catch (err) {
    console.error("❌ Error al eliminar:", err);
    alert("❌ Error al conectar con el servidor.");
  }
};

  const handleEliminarContactos = async () => {
    if (!confirm("¿Estás seguro? Esta acción eliminará todos tus contactos.")) return;
  
    try {
      const res = await fetch(`${BACKEND_URL}/api/contactos`, {
        method: "DELETE",
        credentials: "include",
      });
  
      const json = await res.json();
  
      if (res.ok) {
        alert("✅ Contactos eliminados correctamente");
        setContactos([]);
        setCantidadContactos(0);
      } else {
        alert(`❌ ${json.error || "No se pudo eliminar"}`);
      }
    } catch (err) {
      console.error("❌ Error al eliminar contactos:", err);
      alert("❌ Error al conectar con el servidor");
    }
  };
  
  const comprarMasSms = async (cantidad: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout-credit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: "sms",
          cantidad,
          redirectPath: "/dashboard/campaigns/sms",
        }),
      });
  
      const json = await res.json();
  
      if (res.ok && json.url) {
        window.location.href = json.url;
      } else {
        alert("❌ No se pudo iniciar el pago");
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert("❌ Falló la solicitud");
    }
  };  
  
  const comprarMasContactos = async (cantidad: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout-credit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal: "contactos",
          cantidad,
          redirectPath: "/dashboard/campaigns/sms",
        }),
      });
  
      const json = await res.json();
  
      if (res.ok && json.url) {
        window.location.href = json.url;
      } else {
        alert("❌ No se pudo iniciar el pago");
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert("❌ Falló la solicitud");
    }
  };  
  
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/usage`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const usoContactos = (data.usos || []).find((u: any) => u.canal === "contactos");
        setLimiteContactos(usoContactos?.limite || 500);
      })
      .catch((err) => console.error("❌ Error cargando uso de contactos:", err));
  }, []);
  
  useEffect(() => {
    const url = new URL(window.location.href);
    let updated = false;
  
    if (creditoOk) {
      url.searchParams.delete("credito");
      updated = true;
    }
  
    if (contactosOk) {
      url.searchParams.delete("contactos");
      updated = true;
    }
  
    if (updated) {
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [creditoOk, contactosOk]);  
  
  const usoContactos = {
    usados: contactos.length || 0,
    limite: limiteContactos || 500,
  };
  
  const porcentajeContactos = usoContactos.limite > 0
  ? (usoContactos.usados / usoContactos.limite) * 100
  : 0;

  let colorBarra = "bg-green-500";
  if (porcentajeContactos >= 90) {
    colorBarra = "bg-red-500";
  } else if (porcentajeContactos >= 70) {
    colorBarra = "bg-yellow-400";
  }

  const porcentajeSms = usoSms && usoSms.limite > 0
  ? (usoSms.usados / usoSms.limite) * 100
  : 0;

  let colorBarraSms = "bg-green-500";
  if (porcentajeSms >= 90) {
    colorBarraSms = "bg-red-500";
  } else if (porcentajeSms >= 70) {
    colorBarraSms = "bg-yellow-400";
  }

  const requerirMembresia = (callback?: () => void) => {
    if (!membresiaActiva) {
      const confirmar = window.confirm("Tu membresía no está activa. ¿Quieres activarla ahora?");
      if (confirmar) {
        window.location.href = "/upgrade";
      }
    } else {
      if (callback) callback();
    }
  };
  
  // 🔒 Guard sencillo para bloquear acciones por plan/membresía
  const guardSms = () => {
    if (channelState?.maintenance) {
      alert(`🛠️ Canal SMS en mantenimiento. ${channelState.maintenance_message || "Inténtalo más tarde."}`);
      return true;
    }
    if (!canSms) {
      // bloqueado por plan o por flags de settings
      if (!channelState?.plan_enabled) {
        alert("❌ Tu plan no incluye SMS. Actualiza para habilitar campañas por SMS.");
        window.location.href = "/upgrade";
      } else {
        alert("📴 Canal SMS deshabilitado en tu configuración. Habilítalo en Ajustes.");
      }
      return true;
    }
    if (!canEdit) {
      // sin plan y sin trial vigente → upgrade
      const confirmar = window.confirm("Tu membresía no está activa. ¿Quieres activarla ahora?");
      if (confirmar) window.location.href = "/upgrade";
      return true;
    }

    return false; // OK para continuar
  };

  // Deja un solo registro (el más reciente) por message_sid
  const compactarEntregas = (entregas: any[] = []) => {
    const bySid = new Map<string, any>();
    for (const e of entregas) {
      const sid = e.message_sid || e.messageSid || `${e.telefono}-${e.timestamp}`;
      const ts  = DateTime.fromISO(e.timestamp).toMillis() || 0;
      const prev = bySid.get(sid);
      if (!prev || ts > DateTime.fromISO(prev.timestamp).toMillis()) {
        bySid.set(sid, e);
      }
    }
    // ordena del más reciente al más viejo
    return Array.from(bySid.values()).sort(
      (a, b) =>
        (DateTime.fromISO(b.timestamp).toMillis() || 0) -
        (DateTime.fromISO(a.timestamp).toMillis() || 0)
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/channel-settings?canal=sms`, {
          credentials: "include",
        });
        const data = await res.json();
        setChannelState({
          enabled: !!data.enabled,
          maintenance: !!data.maintenance,
          plan_enabled: !!data.plan_enabled,
          settings_enabled: !!data.settings_enabled,
          maintenance_message: data.maintenance_message || null,
        });
      } catch (err) {
        console.error("❌ Error obteniendo channel settings:", err);
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

  const guardAnd = (fn: () => void) => () => {
    if (disabledAll) {
      alert("❌ Canal SMS deshabilitado o membresía inactiva.");
      return;
    }
    fn();
  };

  const handleClaimTrial = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/billing/claim-trial`, {
        method: 'POST',
        credentials: 'include',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`❌ ${j?.error || 'No se pudo activar la prueba'}`);
        return;
      }
      alert('✅ ¡Prueba gratis activada!');
      // refrescamos settings para actualizar banners y canEdit
      await fetch(`${BACKEND_URL}/api/settings`, { credentials: 'include', cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          setMembresiaActiva(d?.membresia_activa === true);
          setTrialDisponible(Boolean(d?.trial_disponible));
          setTrialActivo(Boolean(d?.trial_vigente || d?.trial_activo));
          setCanEdit(Boolean(
            d?.can_edit ?? d?.membresia_activa ?? (d?.trial_vigente || d?.trial_activo)
          ));
        }).catch(() => {});
    } catch (e) {
      console.error(e);
      alert('❌ Error activando la prueba');
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-md p-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-center flex items-center gap-2 mb-8 text-purple-300">
        <SiTwilio className="text-red-300 animate-pulse" /> Campañas por SMS
      </h1>

      <ChannelStatus canal="sms" showBanner hideTitle />

      {/* 🎁 Caso 1: Nunca usó trial → invitar a activar prueba */}
      {trialDisponible && !canEdit && (
        <div className="mb-6 p-4 bg-purple-500/20 border border-purple-400 text-purple-100 rounded text-center font-medium">
          🎁 <strong>Activa tu prueba gratis</strong> y envía tus primeras campañas SMS.
          <button
            onClick={handleClaimTrial}
            className="ml-3 inline-flex items-center px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm"
          >
            Activar prueba gratis
          </button>
        </div>
      )}

      {/* 🟡 Caso 2: Trial activo (puede editar/enviar) → aviso informativo */}
      {!membresiaActiva && trialActivo && (
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-400 text-yellow-200 rounded text-center font-medium">
          🟡 Estás usando la <strong>prueba gratis</strong>. ¡Aprovecha para programar tu campaña SMS!
        </div>
      )}

      {/* 🔴 Caso 3: Sin plan ni trial vigente → bloqueo con CTA a upgrade */}
      {!canEdit && !trialDisponible && !trialActivo && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-400 text-red-200 rounded text-center font-medium">
          🚫 Tu membresía está inactiva. No puedes programar campañas por SMS.{` `}
          <a onClick={() => (window.location.href = "/upgrade")} className="underline cursor-pointer">
            Activa un plan para continuar.
          </a>
        </div>
      )}

      <TrainingHelp context="campaign-sms" />

      {contactosOk && (
        <div className="bg-green-600/20 border border-green-500 text-green-300 p-4 rounded mb-6 text-sm">
          ✅ Límite de contactos ampliado exitosamente. Ya puedes cargar más contactos.
        </div>
      )}

      {creditoOk && (
        <div className="bg-green-600/20 border border-green-500 text-green-300 p-4 rounded mb-6 text-sm">
          ✅ Créditos agregados exitosamente. Ya puedes usarlos en tus campañas SMS.
        </div>
      )}

      {!loadingChannel && !channelState?.maintenance && !canSms && (
        <div className="mb-6 p-4 bg-yellow-500/15 border border-yellow-500/40 text-yellow-200 rounded">
          <p className="font-semibold mb-1">SMS está bloqueado en tu plan actual</p>
          <p className="text-sm mb-3">
            {esTrial
              ? <>Durante el período de prueba solo está habilitado <b>WhatsApp</b>.</>
              : <>Tu plan no incluye campañas por SMS.</>}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => (window.location.href = "/upgrade")}
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Actualizar plan
            </button>
          </div>
        </div>
      )}

      {usoSms && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <MdSms /> Uso mensual de SMS
          </h3>
          <p className="text-white text-sm mb-2">
            {usoSms.usados ?? 0} de {usoSms.limite} mensajes enviados (incluye créditos extra)
          </p>
          {usoSms.limite > 500 && (
            <p className="text-green-300 text-sm">
              Incluye {usoSms.limite - 500} mensajes extra comprados.
            </p>
          )}
          <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
            <div
              className={`h-full ${colorBarraSms} transition-all duration-500`}
              style={{ width: `${porcentajeSms}%` }}
            />
          </div>
          <div className="flex gap-2">
            {[500, 1000, 2000].map((extra) => (
              <button
                key={extra}
                onClick={() => comprarMasSms(extra)}
                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
              >
                +{extra}
              </button>
            ))}
          </div>
        </div>
      )}

      {usoContactos && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
          <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
            <FaAddressBook /> Contactos
          </h3>
          <p className="text-white text-sm mb-2">
            {usoContactos.usados} de {usoContactos.limite} contactos usados (incluye créditos extra)
          </p>
          {usoContactos.limite > 500 && (
            <p className="text-green-300 text-sm">
              Incluye {usoContactos.limite - 500} contactos extra comprados.
            </p>
          )}
          <div className="w-full bg-white/20 h-2 rounded mb-4 overflow-hidden">
            <div
              className={`h-full ${colorBarra} transition-all duration-500`}
              style={{ width: `${porcentajeContactos}%` }}
            />
          </div>
          <div className="flex gap-2 mb-4">
            {[500, 1000, 2000].map((extra) => (
              <button
                key={extra}
                onClick={() => comprarMasContactos(extra)}
                className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-white text-sm"
              >
                +{extra}
              </button>
            ))}
          </div>

          <div className="w-full space-y-2">
              <label className="block text-sm font-semibold text-white">
                Subir archivo CSV de contactos
              </label>
              <input
                type="file"
                accept=".csv"
                multiple={false}
                disabled={disabledAll}
                ref={inputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.name.toLowerCase().endsWith(".csv")) {
                    setArchivoCsv(file);
                  } else {
                    alert("Por favor selecciona un archivo CSV válido.");
                  }
                }}
                className="cursor-pointer block w-full text-sm text-white
                          file:mr-0 file:py-2 file:px-4 file:rounded
                          file:border-0 file:text-sm file:font-semibold
                          file:bg-indigo-600 file:text-white
                          hover:file:bg-indigo-500"
                style={{ color: "transparent" }}
              />
              {archivoCsv && (
                <div className="flex items-center justify-between bg-white/10 border border-white/20 rounded px-4 py-2 text-sm text-white">
                  <span className="truncate">{archivoCsv.name}</span>
                  <button
                    onClick={() => {
                      if (disabledAll) {
                        alert("❌ Canal SMS deshabilitado o membresía inactiva.");
                        return;
                      }
                      setArchivoCsv(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    className={`text-xs font-semibold ml-4 ${
                      disabledAll ? "text-white/40 cursor-not-allowed" : "text-red-400 hover:text-red-600"
                    }`}
                    disabled={disabledAll}
                  >
                    Eliminar archivo
                  </button>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <button
                  onClick={guardAnd(handleEliminarContactos)}
                  disabled={disabledAll}
                  className={`px-4 py-2 rounded font-semibold w-full sm:w-auto ${
                    !disabledAll ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}

                >
                  Eliminar contactos
                </button>

                {archivoCsv && (
                  <button
                    onClick={() => {
                      if (disabledAll) {
                        alert("❌ Canal SMS deshabilitado o membresía inactiva.");
                        return;
                      }
                      handleSubirCsv();
                    }}
                    disabled={disabledAll}
                    className={`px-4 py-2 rounded font-semibold w-full sm:w-auto ${
                      !disabledAll ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                  >
                    Subir contactos
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiCampaignmonitor /> Nombre de la campaña
      </label>
      <input
        name="nombre"
        value={form.nombre}
        onChange={handleChange}
        placeholder="Nombre de la campaña"
        className="w-full mb-4 p-2 rounded bg-white/10 border border-white/20"
      />

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiMinutemailer /> Contenido del SMS
      </label>
      <textarea
        name="contenido"
        value={form.contenido}
        onChange={handleChange}
        placeholder="🎉 ¡Hola! Aún tienes tu clase GRATIS disponible. Reserva ahora 👉 [link]. ¡Te esperamos!"
        className="w-full p-2 mb-4 bg-white/10 border border-white/20 rounded"
        rows={3}
      />

      <label className="block mb-2 font-medium text-white flex items-center gap-2">
        <SiGooglecalendar /> Fecha y hora de envío
      </label>
      <input
        type="datetime-local"
        name="fecha_envio"
        value={form.fecha_envio}
        onChange={handleChange}
        className="w-full mb-6 p-2 rounded bg-white/10 border border-white/20"
      />

      <div className="mb-6">
        <h3 className="text-white mb-2 flex items-center gap-2">
          <SiCampaignmonitor /> Segmentos
        </h3>
        {["cliente", "leads", "otros"].map((seg) => (
          <label key={seg} className="block text-white text-sm mb-1">
            <input
              type="checkbox"
              checked={form.segmentos.includes(seg)}
              onChange={() => toggleSegmento(seg)}
              disabled={disabledAll}
              className="mr-2"
            />
            {seg}
          </label>
        ))}
      </div>

      <button
        onClick={() => {
          if (disabledAll) {
            alert("❌ Canal SMS deshabilitado o membresía inactiva.");
            return;
          }
          handleSubmit();
        }}
        disabled={disabledAll || loading}
        className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Enviando...' : 'Programar campaña SMS'}
      </button>

      <hr className="my-10 border-white/20" />

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
        <SiGoogleanalytics /> Campañas programadas/enviadas
      </h2>

      {campaigns.length === 0 ? (
        <p className="text-white/70">No hay campañas SMS registradas aún.</p>
      ) : (
        <ul className="space-y-6 text-white text-sm">
          {campaigns.map((c) => {
            const cid = String(c.id); // 👈 normalizamos
            // ✅ compacta: 1 registro por mensaje (último estado)
            const entregasCompactas = compactarEntregas(c.entregas || []);
            const lower = (s?: string) => (s || "").toLowerCase();

            // ✅ contadores correctos
            const enviados = entregasCompactas.filter((e: any) =>
              ["queued", "sent", "delivered", "failed", "undelivered"].includes(lower(e.status))
            ).length;
            const entregados = entregasCompactas.filter((e: any) => lower(e.status) === "delivered").length;
            const fallidos = entregasCompactas.filter((e: any) =>
              ["failed", "undelivered"].includes(lower(e.status))
            ).length;

            return (
              <li key={c.id} className="border border-white/10 rounded p-4 bg-white/5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold text-white mb-1">{c.nombre}</div>
                    <div className="text-white/80 mb-1">
                      <SiGooglecalendar className="inline mr-1" />{" "}
                      {DateTime.fromISO(c.programada_para)
                        .setZone("America/New_York")
                        .toLocaleString(DateTime.DATETIME_MED)}
                    </div>
                    <span className="flex items-center gap-1">
                      <SiMinutemailer /> Enviados: {enviados}
                    </span>
                    <span className="flex items-center gap-1">
                      <SiCheckmarx className="text-green-400" /> Entregados: {entregados}
                    </span>
                    <span className="flex items-center gap-1">
                      <SiProbot className="text-red-400" /> Fallidos: {fallidos}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`px-4 py-1 border border-white/20 rounded text-white
                        ${disabledAll ? "bg-white/10 text-white/40 cursor-not-allowed" : "bg-red-500/80 hover:bg-red-600"}`}
                      onClick={() => {
                        if (disabledAll) {
                          alert("❌ Canal SMS deshabilitado o membresía inactiva.");
                          return;
                        }
                        eliminarCampana(c.id);
                      }}
                      disabled={disabledAll}
                      aria-disabled={disabledAll}
                      title={disabledAll ? "Bloqueado por plan o membresía" : "Eliminar"}
                    >
                      <SiProbot className="inline mr-1" /> Eliminar
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white"
                      onClick={() => setExpandedCampaignId(expandedCampaignId === cid ? null : cid)}
                    >
                      {expandedCampaignId === cid ? "Ocultar detalles" : "Ver detalles"}
                    </button>
                  </div>
                </div>

                {expandedCampaignId === cid && (
                  <ul className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs">
                    {entregasCompactas.map((e: any, i: number) => {
                      const normalizar = (num: string | undefined | null) =>
                        typeof num === "string" ? num.replace(/\D/g, "").replace(/^1/, "") : "";
                      const telefonoLimpio = (e.telefono || "").replace(/^tel:/, "");
                      const contacto = contactos.find(
                        (con: any) => normalizar(con.telefono) === normalizar(telefonoLimpio)
                      );
                      const segmento = contacto?.segmento || "Desconocido";
                      const st = lower(e.status);

                      return (
                        <li
                          key={e.message_sid || e.messageSid || `${telefonoLimpio}-${e.timestamp}` || i}
                          className="border-b border-white/10 pb-2"
                        >
                          <div className="flex items-center gap-1 text-white/90">
                            <MdSms />
                            <span className="font-mono text-sm">{telefonoLimpio}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <SiStatuspal />
                            Estado:{" "}
                            <span
                              className={`font-semibold ${
                                st === "delivered"
                                  ? "text-green-400"
                                  : st === "failed" || st === "undelivered"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                              }`}
                            >
                              {e.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            🏷️ Segmento: <span className="italic text-white/80">{segmento}</span>
                          </div>
                          {e.error_message && (
                            <div className="flex items-center gap-1 text-red-400">
                              <HiOutlineExclamationTriangle /> {e.error_message}
                            </div>
                          )}
                          <div className="text-white/40">
                            {DateTime.fromISO(e.timestamp)
                              .setZone("America/New_York")
                              .toLocaleString(DateTime.DATETIME_MED)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Footer />
    </div>
  );
}
