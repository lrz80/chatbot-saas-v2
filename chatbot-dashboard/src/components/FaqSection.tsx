//src/components/FaqSection.tsx
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
  canal?: string; // ✅ AÑADE ESTE CAMPO
};

type Props = {
  faqs: Faq[];
  setFaqs: (faqs: Faq[]) => void;
  canal: "whatsapp" | "facebook" | "instagram" | "meta" | "voz";
  membresiaActiva: boolean;
  onSave: () => Promise<void>;
  faqsSugeridas?: FaqSugerida[]; // ✅ Agrega esta línea
  setFaqsSugeridas?: React.Dispatch<React.SetStateAction<FaqSugerida[]>>; // ✅ Agrega esta también si planeas editar
};

export default function FaqSection({
  faqs,
  setFaqs,
  faqsSugeridas,
  setFaqsSugeridas,
  canal,
  membresiaActiva,
  onSave,
}: Props) {
  const [faqEditando, setFaqEditando] = useState<FaqSugerida | null>(null);
  const [nuevaRespuesta, setNuevaRespuesta] = useState("");

  const [filtro, setFiltro] = useState("");

  const faqsFiltrados = faqs.filter((f) =>
    f.pregunta.toLowerCase().includes(filtro.toLowerCase()) ||
    f.respuesta.toLowerCase().includes(filtro.toLowerCase())
  );
  
  useEffect(() => {
    console.log("📌 canal recibido:", canal);
    recargarFaqs();
  }, [canal]);  

  const handleChange = (
    index: number,
    field: "pregunta" | "respuesta",
    value: string
  ) => {
    const nuevas = [...faqs];
    nuevas[index][field] = value;
    setFaqs(nuevas);
  };

  const addFaq = () => {
    const nuevoFaq: Faq = { pregunta: "", respuesta: "" };
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
      setFaqsSugeridas?.((prev) => prev.filter((f) => f.id !== id));
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
        await recargarFaqs();
        setFaqsSugeridas?.((prev) => prev.filter((f) => f.id !== faqEditando.id));
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
        setFaqs(data);
        console.log("✅ FAQs oficiales cargadas:", data);
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
        await recargarFaqs();
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
    const idNumerico = parseInt(faqAEliminar?.id as any);

    if (!idNumerico || isNaN(idNumerico)) {
      console.warn("⚠️ Esta FAQ no tiene un ID válido. No se eliminará del backend.");
      nuevas.splice(index, 1);
      setFaqs(nuevas);
      return;
    }

    nuevas.splice(index, 1);
    setFaqs(nuevas);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faqs/eliminar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idNumerico }),
      });

      if (!res.ok) {
        console.error("❌ Falló eliminación en backend");
      }
    } catch (err) {
      console.error("❌ Error al eliminar FAQ del backend:", err);
    }
  };

  // Capitaliza y agrega punto final si falta
  const formatearPregunta = (texto: string): string => {
    if (!texto) return '';
    let resultado = texto.charAt(0).toUpperCase() + texto.slice(1);
    if (!/[.!?]$/.test(resultado.trim())) {
      resultado += '.';
    }
    return resultado;
  };
  
  // arriba del return()
  const sugeridasConRespuesta = Array.isArray(faqsSugeridas)
  ? faqsSugeridas.filter(
      (f) =>
        f.respuesta_sugerida &&
        (
          f.canal === canal ||
          (canal === "meta" && ["facebook", "instagram"].includes(f.canal || ""))
        )
    )
  : [];

    return (
    <div className="mt-12">
      <h3 className="text-xl font-bold mb-2 text-green-400 flex items-center gap-2">
        <Brain className="text-green-400" size={20} /> Preguntas Frecuentes
      </h3>

      <input
        type="text"
        placeholder="Filtrar por palabra clave..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full mb-4 p-2 bg-white/10 text-white border border-white/20 rounded"
      />

      {faqsFiltrados.map((faq, i) => (
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

      {sugeridasConRespuesta.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-8">
          <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="text-yellow-400" /> FAQs sugeridas
          </h2>

          {sugeridasConRespuesta.map((faq) => (
            <div key={faq.id} className="mb-4 p-4 rounded bg-white/10 border border-white/20">
              <p className="text-white/80 flex items-center gap-2">
                <MessageSquare className="text-pink-400" size={18} />
                <strong>{formatearPregunta(faq.pregunta)}</strong>
              </p>
              <div className="text-green-300 mt-1 whitespace-pre-wrap flex gap-2">
                <Bot className="text-green-400 mt-1" size={18} />
                <span>{faq.respuesta_sugerida}</span>
              </div>

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
