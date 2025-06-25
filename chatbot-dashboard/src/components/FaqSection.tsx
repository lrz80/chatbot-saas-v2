"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Bot, Pencil, XCircle, Lightbulb, Brain } from "lucide-react";

export type Faq = {
  id?: number;
  pregunta: string;
  respuesta: string;
};

export type FaqSugerida = {
  id: number;
  pregunta: string;
  respuesta_sugerida: string | null;
};

type Props = {
  faqs: Faq[];
  setFaqs: (faqs: Faq[]) => void;
  canal: "whatsapp" | "facebook" | "instagram" | "voz";
  membresiaActiva: boolean;
  onSave: () => Promise<void>;
};

export default function FaqSection({
  faqs,
  setFaqs,
  canal,
  membresiaActiva,
  onSave,
}: Props) {
  const [faqSugeridas, setFaqSugeridas] = useState<FaqSugerida[]>([]);
  const [faqEditando, setFaqEditando] = useState<FaqSugerida | null>(null);
  const [nuevaRespuesta, setNuevaRespuesta] = useState("");

  useEffect(() => {
    fetch(`https://api.aamy.ai/api/faqs/sugeridas?canal=${canal}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        console.log("📥 FAQ sugeridas cargadas:", data);
  
        const conRespuesta = data.filter((f: FaqSugerida) => f.respuesta_sugerida);
        console.log("✅ Filtradas con respuesta:", conRespuesta);
  
        setFaqSugeridas(conRespuesta);
      })
      .catch((err) => console.error("❌ Error cargando sugeridas:", err));
  }, [canal]);  

  const handleChange = (
    index: number,
    field: "pregunta" | "respuesta", // 🔒 limitado solo a campos editables
    value: string
  ) => {
    const nuevas = [...faqs];
    nuevas[index][field] = value;
    setFaqs(nuevas);
  };  

  const addFaq = () => {
    const nuevoFaq: Faq = {
      pregunta: "",
      respuesta: "",
    };
    setFaqs([...faqs, nuevoFaq]);
  };  

  const rechazarFaq = async (id: number) => {
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faqs/rechazar`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
      setFaqSugeridas((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("❌ Error al rechazar FAQ:", err);
    }
  };

  const aprobarConEdicion = async () => {
    if (!faqEditando) return;

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faqs/aprobar`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: faqEditando.id,
              respuesta_editada: nuevaRespuesta,
            }),   
      });

      if (res.ok) {
        await recargarFaqs(); // 🔄 vuelve a cargar desde el backend
        setFaqSugeridas((prev) => prev.filter((f) => f.id !== faqEditando.id));
        setFaqEditando(null);
        setNuevaRespuesta("");
      }
      
    } catch (err) {
      console.error("❌ Error aprobando con edición:", err);
    }
  };

  const recargarFaqs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faqs?canal=${canal}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setFaqs(data); // 🔄 actualiza el estado visible
      }
    } catch (err) {
      console.error("❌ Error recargando FAQs:", err);
    }
  };
  
  const guardarFaqs = async () => {
    const faqsLimpios = faqs.filter((f) => f.pregunta.trim() && f.respuesta.trim());
  
    if (faqsLimpios.length === 0) {
      alert("❌ Agrega al menos una FAQ válida.");
      return;
    }
  
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faqs`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faqs: faqsLimpios, canal }),
      });
  
      if (res.ok) {
        await recargarFaqs(); // recarga con IDs desde backend
        alert("Preguntas frecuentes guardadas ✅");
      } else {
        alert("❌ Error al guardar FAQs");
      }
    } catch (error) {
      console.error("❌ Error al guardar FAQs:", error);
      alert("❌ Error al guardar FAQs.");
    }
  };
  
  const eliminarFaq = async (index: number) => {
    const nuevas = [...faqs];
    const faqAEliminar = nuevas[index];
  
    // ✅ Validación robusta del ID
    console.log("📌 ID detectado:", faqAEliminar.id, "Tipo:", typeof faqAEliminar.id);
    if (!faqAEliminar?.id || isNaN(Number(faqAEliminar.id))) {
      console.warn("⚠️ Esta FAQ no tiene un ID válido. No se eliminará del backend.");
      nuevas.splice(index, 1); // eliminar del frontend
      setFaqs(nuevas);
      return;
    }
  
    console.log("🗑 Eliminando FAQ con ID:", faqAEliminar.id);
  
    nuevas.splice(index, 1); // eliminar del array local
    setFaqs(nuevas);         // actualizar estado
  
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faqs/eliminar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(faqAEliminar.id) }), // ✅ asegura que se mande como número
      });
  
      if (!res.ok) {
        console.error("❌ Falló eliminación en backend");
      }
    } catch (err) {
      console.error("❌ Error al eliminar FAQ del backend:", err);
    }
  };  
  
  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold mb-2 text-green-400 flex items-center gap-2">
        <Brain className="text-green-400" size={20} /> Preguntas Frecuentes
      </h3>

      {faqs.map((faq, i) => (
        <div key={i} className="mb-4 relative">
          <button
            onClick={() => eliminarFaq(i)}
            className="absolute top-0 right-0 text-red-400 hover:text-red-600"
            title="Eliminar FAQ"
          >
            <XCircle size={18} />
          </button>

          <input
            type="text"
            value={faq.pregunta}
            onChange={(e) => handleChange(i, "pregunta", e.target.value)}
            className="w-full p-2 mb-2 bg-white/10 text-white border border-white/20 rounded"
            placeholder="Pregunta"
            disabled={!membresiaActiva}
          />
          <textarea
            value={faq.respuesta}
            onChange={(e) => handleChange(i, "respuesta", e.target.value)}
            rows={2}
            className="w-full p-2 bg-white/10 text-white border border-white/20 rounded"
            placeholder="Respuesta"
            disabled={!membresiaActiva}
          />
        </div>
      ))}

      <div className="flex gap-2 mb-6">
        <button
          onClick={addFaq}
          disabled={!membresiaActiva}
          className="text-white/70 text-sm"
        >
          + Agregar FAQ
        </button>
        <button
          onClick={guardarFaqs}
          disabled={!membresiaActiva}
          className={`px-4 py-2 rounded text-white ${
            membresiaActiva
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-600 text-white/50 cursor-not-allowed"
          }`}
        >
          Guardar FAQs
        </button>

      </div>

      {faqSugeridas.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-8">
          <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="text-yellow-400" /> FAQs sugeridas
          </h2>

          {faqSugeridas.filter(f => f.respuesta_sugerida).map((faq) => (
            <div key={faq.id} className="mb-4 p-4 rounded bg-white/10 border border-white/20">
            <p className="text-white/80 flex items-center gap-2">
              <MessageSquare className="text-pink-400" size={18} />
              <strong>{faq.pregunta}</strong>
            </p>
            <p className="text-green-300 mt-1 flex items-center gap-2">
              <Bot className="text-green-400" size={18} />
              {faq.respuesta_sugerida}
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  setFaqEditando(faq);
                  setNuevaRespuesta(faq.respuesta_sugerida ?? "");
                }}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2"
              >
                  <Pencil size={16} /> Editar y aprobar
                </button>
                <button
                  onClick={() => rechazarFaq(faq.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  <XCircle size={16} /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {faqEditando && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1a1a2e] p-6 rounded-xl max-w-lg w-full border border-white/10 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Pencil /> Editar respuesta sugerida
            </h3>
            <p className="text-white/80 mb-2 flex items-center gap-2">
              <MessageSquare size={18} className="text-pink-400" /> {faqEditando.pregunta}
            </p>
            <textarea
              className="w-full p-3 rounded bg-white/10 text-white border border-white/20"
              rows={4}
              value={nuevaRespuesta}
              onChange={(e) => setNuevaRespuesta(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setFaqEditando(null)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancelar
              </button>
              <button
                onClick={aprobarConEdicion}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
              >
                ✅ Guardar y aprobar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
