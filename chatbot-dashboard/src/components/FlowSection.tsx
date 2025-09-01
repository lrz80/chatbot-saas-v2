// src/components/FlowSection.tsx
"use client";

import { Trash2, PlusCircle, CornerDownRight } from "lucide-react";

type Opcion = {
  texto: string;
  respuesta?: string;
  submenu?: {
    mensaje: string;
    opciones: Opcion[];
  };
};

type Flow = { mensaje: string; opciones: Opcion[] };

type Props = {
  flows: Flow[];
  setFlows: (flows: Flow[]) => void;
  canal: "whatsapp" | "meta";
  membresiaActiva: boolean;
  onSave: () => void;
};

export default function FlowSection({
  flows,
  setFlows,
  canal,
  membresiaActiva,
  onSave,
}: Props) {
  const deepCopy = <T,>(obj: T): T =>
    typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));

  const agregarFlujo = () => {
    if (!membresiaActiva) return;
    setFlows([...flows, { mensaje: "", opciones: [] }]);
  };

  const eliminarFlujo = (index: number) => {
    const nuevos = deepCopy(flows);
    nuevos.splice(index, 1);
    setFlows(nuevos);
  };

  const agregarOpcion = (i: number) => {
    if (!membresiaActiva) return;
    const nuevos = deepCopy(flows);
    nuevos[i].opciones.push({ texto: "", respuesta: "" });
    setFlows(nuevos);
  };

  const eliminarOpcion = (i: number, j: number) => {
    const nuevos = deepCopy(flows);
    nuevos[i].opciones.splice(j, 1);
    setFlows(nuevos);
  };

  // ---- Submenús ----
  const addSubmenu = (i: number, j: number) => {
    if (!membresiaActiva) return;
    const copy = deepCopy(flows);
    const op = copy[i].opciones[j];
    op.submenu ||= { mensaje: "¿Qué deseas?", opciones: [{ texto: "", respuesta: "" }] };
    setFlows(copy);
  };

  const removeSubmenu = (i: number, j: number) => {
    if (!membresiaActiva) return;
    const copy = deepCopy(flows);
    delete copy[i].opciones[j].submenu;
    setFlows(copy);
  };

  const handleSubmenuMessage = (i: number, j: number, value: string) => {
    const copy = deepCopy(flows);
    if (!copy[i].opciones[j].submenu) return;
    copy[i].opciones[j].submenu!.mensaje = value;
    setFlows(copy);
  };

  const addSubOpcion = (i: number, j: number) => {
    if (!membresiaActiva) return;
    const copy = deepCopy(flows);
    const sm = copy[i].opciones[j].submenu;
    if (!sm) return;
    sm.opciones.push({ texto: "", respuesta: "" });
    setFlows(copy);
  };

  const handleSubOpcionChange = (
    i: number,
    j: number,
    k: number,
    field: keyof Opcion,
    value: string
  ) => {
    const copy = deepCopy(flows);
    const sm = copy[i].opciones[j].submenu;
    if (!sm) return;
    (sm.opciones[k] as any)[field] = value;
    setFlows(copy);
  };

  const removeSubOpcion = (i: number, j: number, k: number) => {
    if (!membresiaActiva) return;
    const copy = deepCopy(flows);
    const sm = copy[i].opciones[j].submenu;
    if (!sm) return;
    sm.opciones.splice(k, 1);
    setFlows(copy);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-8">
      <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
        {canal === "meta" ? "Flujos Meta (Facebook / Instagram)" : "Flujos Guiados Interactivos"}
      </h2>

      <p className="text-white/70 text-sm mb-4">
        Puedes crear menús interactivos con botones y submenús para guiar la conversación y aumentar conversiones.
      </p>

      {flows.map((flow, i) => (
        <div key={i} className="bg-white/10 border border-white/20 p-4 rounded mb-6">
          {/* Mensaje principal */}
          <div className="flex gap-2 items-center mb-2">
            <label className="text-white/80 text-sm w-28">Mensaje</label>
            <input
              type="text"
              className="flex-1 rounded bg-white/10 text-white p-2 text-sm"
              placeholder="Ej: ¿En qué puedo ayudarte?"
              value={flow.mensaje}
              disabled={!membresiaActiva}
              onChange={(e) => {
                const nuevos = deepCopy(flows);
                nuevos[i].mensaje = e.target.value;
                setFlows(nuevos);
              }}
            />
            <button onClick={() => eliminarFlujo(i)} className="text-red-500 hover:text-red-700">
              <Trash2 size={16} />
            </button>
          </div>

          {/* Opciones de primer nivel */}
          {flow.opciones.map((opcion, j) => (
            <div key={j} className="mb-3 ml-8">
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  className="rounded bg-white/10 text-white p-2 text-sm w-40"
                  placeholder="Texto del botón"
                  value={opcion.texto}
                  disabled={!membresiaActiva}
                  onChange={(e) => {
                    const nuevos = deepCopy(flows);
                    nuevos[i].opciones[j].texto = e.target.value;
                    setFlows(nuevos);
                  }}
                />
                <input
                  type="text"
                  className="flex-1 rounded bg-white/10 text-white p-2 text-sm"
                  placeholder="Respuesta del bot (opcional si hay submenú)"
                  value={opcion.respuesta ?? ""}
                  disabled={!membresiaActiva}
                  onChange={(e) => {
                    const nuevos = deepCopy(flows);
                    nuevos[i].opciones[j].respuesta = e.target.value;
                    setFlows(nuevos);
                  }}
                />
                <button onClick={() => eliminarOpcion(i, j)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Acciones de submenú */}
              <div className="flex items-center gap-3 ml-1">
                {!opcion.submenu ? (
                  <button
                    disabled={!membresiaActiva}
                    onClick={() => addSubmenu(i, j)}
                    className="text-blue-400 hover:underline text-sm flex items-center gap-1"
                  >
                    <PlusCircle size={14} /> Agregar submenú
                  </button>
                ) : (
                  <button
                    disabled={!membresiaActiva}
                    onClick={() => removeSubmenu(i, j)}
                    className="text-yellow-400 hover:underline text-sm"
                  >
                    Quitar submenú
                  </button>
                )}
              </div>

              {/* Editor de submenú */}
              {opcion.submenu && (
                <div className="mt-3 ml-5 border-l border-white/20 pl-4">
                  <div className="flex gap-2 items-center mb-2">
                    <CornerDownRight size={16} className="text-white/60" />
                    <input
                      type="text"
                      className="flex-1 rounded bg-white/10 text-white p-2 text-sm"
                      placeholder="Pregunta del submenú (ej: ¿Qué deseas?)"
                      value={opcion.submenu.mensaje}
                      disabled={!membresiaActiva}
                      onChange={(e) => handleSubmenuMessage(i, j, e.target.value)}
                    />
                  </div>

                  {opcion.submenu.opciones.map((sop, k) => (
                    <div key={k} className="flex gap-2 items-center mb-2 ml-6">
                      <input
                        type="text"
                        className="rounded bg-white/10 text-white p-2 text-sm w-40"
                        placeholder="Texto del botón"
                        value={sop.texto}
                        disabled={!membresiaActiva}
                        onChange={(e) => handleSubOpcionChange(i, j, k, "texto", e.target.value)}
                      />
                      <input
                        type="text"
                        className="flex-1 rounded bg-white/10 text-white p-2 text-sm"
                        placeholder="Respuesta del bot"
                        value={sop.respuesta ?? ""}
                        disabled={!membresiaActiva}
                        onChange={(e) => handleSubOpcionChange(i, j, k, "respuesta", e.target.value)}
                      />
                      <button onClick={() => removeSubOpcion(i, j, k)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {membresiaActiva && (
                    <button
                      onClick={() => addSubOpcion(i, j)}
                      className="text-blue-400 hover:underline ml-6 mt-1 text-sm"
                    >
                      + Agregar opción al submenú
                    </button>
                  )}
                </div>
              )}
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
