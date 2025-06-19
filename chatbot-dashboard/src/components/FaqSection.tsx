"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Bot, Pencil, XCircle, Lightbulb, Brain } from "lucide-react";

export type Faq = {
  pregunta: string;
  respuesta: string;
};

export type FaqSugerida = {
  id: number;
  pregunta: string;
  respuesta_sugerida: string;
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
    fetch(`/api/faqs/sugeridas?canal=${canal}`, { credentials: "include" })
      .then((res) => res.json())
      .then(setFaqSugeridas)
      .catch((err) => console.error("❌ Error cargando sugeridas:", err));
  }, [canal]);

  const handleChange = (index: number, field: keyof Faq, value: string) => {
    const nuevas = [...faqs];
    nuevas[index][field] = value;
    setFaqs(nuevas);
  };

  const addFaq = () => setFaqs([...faqs, { pregunta: "", respuesta: "" }]);

  const aprobarFaq = async (id: number) => {
    try {
      const res = await fetch(`/api/faqs/aprobar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setFaqSugeridas((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("❌ Error al aprobar FAQ:", err);
    }
  };

  const rechazarFaq = async (id: number) => {
    try {
      await fetch(`/api/faqs/rechazar`, {
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
      const res = await fetch(`/api/faqs/aprobar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: faqEditando.id,
          respuesta_editada: nuevaRespuesta,
        }),
      });

      if (res.ok) {
        setFaqSugeridas((prev) => prev.filter((f) => f.id !== faqEditando.id));
        setFaqEditando(null);
        setNuevaRespuesta("");
      }
    } catch (err) {
      console.error("❌ Error aprobando con edición:", err);
    }
  };

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold mb-2 text-green-400 flex items-center gap-2">
        <Brain className="text-green-400" size={20} /> Preguntas Frecuentes
      </h3>

      {faqs.map((faq, i) => (
        <div key={i} className="mb-4">
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
          onClick={onSave}
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
            <Lightbulb className="text-yellow-400" /> FAQs sugeridas por clientes
          </h2>

          {faqSugeridas.map((faq) => (
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
                  setNuevaRespuesta(faq.respuesta_sugerida);
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
