"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

type Opcion = { texto: string; respuesta?: string };
type Flow = { mensaje: string; opciones: Opcion[] };

type Props = {
  flows: Flow[];
  setFlows: (flows: Flow[]) => void;
  canal: "whatsapp" | "meta";
  membresiaActiva: boolean;
  onSave: () => void;
};

export default function FlowSection({ flows, setFlows, canal, membresiaActiva, onSave }: Props) {
  const agregarFlujo = () => {
    if (!membresiaActiva) return;
    setFlows([...flows, { mensaje: "", opciones: [] }]);
  };

  const agregarOpcion = (index: number) => {
    const nuevos = [...flows];
    nuevos[index].opciones.push({ texto: "", respuesta: "" });
    setFlows(nuevos);
  };

  const eliminarFlujo = (index: number) => {
    const nuevos = [...flows];
    nuevos.splice(index, 1);
    setFlows(nuevos);
  };

  const eliminarOpcion = (i: number, j: number) => {
    const nuevos = [...flows];
    nuevos[i].opciones.splice(j, 1);
    setFlows(nuevos);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-8">
      <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
        {canal === "meta" ? "Flujos Meta (Facebook / Instagram)" : "Flujos Guiados Interactivos"}
      </h2>

      <p className="text-white/70 text-sm mb-4">
        Puedes crear menús interactivos que el cliente puede tocar como botones para navegar opciones. Esto ayuda a guiar la conversación y aumentar conversiones.
      </p>

      {flows.map((flow, i) => (
        <div key={i} className="bg-white/10 border border-white/20 p-4 rounded mb-6">
          <div className="flex gap-2 items-center mb-2">
            <label className="text-white/80 text-sm w-28">Mensaje</label>
            <input
              type="text"
              className="flex-1 rounded bg-white/10 text-white p-2 text-sm"
              placeholder="Ej: ¿En qué puedo ayudarte?"
              value={flow.mensaje}
              disabled={!membresiaActiva}
              onChange={(e) => {
                const nuevos = [...flows];
                nuevos[i].mensaje = e.target.value;
                setFlows(nuevos);
              }}
            />
            <button onClick={() => eliminarFlujo(i)} className="text-red-500 hover:text-red-700">
              <Trash2 size={16} />
            </button>
          </div>

          {flow.opciones.map((opcion, j) => (
            <div key={j} className="flex gap-2 items-center mb-2 ml-8">
              <input
                type="text"
                className="rounded bg-white/10 text-white p-2 text-sm w-40"
                placeholder="Texto del botón"
                value={opcion.texto}
                disabled={!membresiaActiva}
                onChange={(e) => {
                  const nuevos = [...flows];
                  nuevos[i].opciones[j].texto = e.target.value;
                  setFlows(nuevos);
                }}
              />
              <input
                type="text"
                className="flex-1 rounded bg-white/10 text-white p-2 text-sm"
                placeholder="Respuesta del bot"
                value={opcion.respuesta}
                disabled={!membresiaActiva}
                onChange={(e) => {
                  const nuevos = [...flows];
                  nuevos[i].opciones[j].respuesta = e.target.value;
                  setFlows(nuevos);
                }}
              />
              <button onClick={() => eliminarOpcion(i, j)} className="text-red-500 hover:text-red-700">
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {membresiaActiva && (
            <button onClick={() => agregarOpcion(i)} className="text-blue-400 hover:underline ml-8 mt-1 text-sm">
              + Agregar opción
            </button>
          )}
        </div>
      ))}

      {membresiaActiva && (
        <button onClick={agregarFlujo} className="text-white/80 hover:underline text-sm mb-4">
          ➕ Agregar flujo principal
        </button>
      )}

      <button
        onClick={onSave}
        className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
        disabled={!membresiaActiva}
      >
        Guardar flujos
      </button>
    </div>
  );
}
