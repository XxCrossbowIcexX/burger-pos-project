import { useState, useEffect } from "react";
import type { CartItem, ExtraSeleccionado, Ingrediente } from "../App";
import type { Extra } from "./OrderAside";

type EditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
  extrasDisponibles: Extra[];
  modificaciones: Ingrediente[];
  permiteExtras: boolean;
  onConfirm: (itemActualizado: CartItem) => void;
};

export function ModifyProductModal({
  isOpen,
  onClose,
  item,
  extrasDisponibles,
  modificaciones,
  permiteExtras,
  onConfirm,
}: EditModalProps) {
  const [extras, setExtras] = useState<{ [id: string]: number }>({});
  const [exclusiones, setExclusiones] = useState<string[]>([]);

  useEffect(() => {
    if (item) {
      // Inicializar extras
      const extrasInit: { [id: string]: number } = {};
      item.extras.forEach((e) => {
        extrasInit[e.id] = e.cantidad;
      });
      setExtras(extrasInit);

      // Inicializar exclusiones según lo que ya viene en item.exclusiones
      setExclusiones(item.exclusiones || []);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const toggleExtra = (extraId: string) => {
    setExtras((prev) => {
      if (prev[extraId]) {
        const copy = { ...prev };
        delete copy[extraId];
        return copy;
      } else {
        return { ...prev, [extraId]: 1 };
      }
    });
  };

  const changeCantidadExtra = (extraId: string, delta: number) => {
    setExtras((prev) => {
      const cantidad = (prev[extraId] || 0) + delta;
      if (cantidad <= 0) {
        const copy = { ...prev };
        delete copy[extraId];
        return copy;
      }
      return { ...prev, [extraId]: cantidad };
    });
  };

  const toggleExclusion = (nombre: string) => {
    setExclusiones((prev) =>
      prev.includes(nombre)
        ? prev.filter((m) => m !== nombre)
        : [...prev, nombre]
    );
  };

  const handleConfirm = () => {
    const updatedExtras: ExtraSeleccionado[] = Object.entries(extras).map(
      ([id, cantidad]) => {
        const data = extrasDisponibles.find((e) => e.id === id)!;
        return { ...data, cantidad };
      }
    );

    onConfirm({
      ...item,
      extras: updatedExtras,
      exclusiones,
    });
    onClose();
  };

  const ordenTipos = ["pan", "carne", "queso", "vegetal", "salsa"];

  const ingredientesOrdenados = modificaciones
    .map((mod) => mod)
    .sort((a, b) => ordenTipos.indexOf(a.tipo) - ordenTipos.indexOf(b.tipo));

  const ingredientesPorTipo = ingredientesOrdenados.reduce((acc, mod) => {
    const tipo = mod.tipo;
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(mod);
    return acc;
  }, {} as Record<string, Ingrediente[]>);

  const extrasPorTipo = extrasDisponibles.reduce((acc, extra) => {
    const tipo = extra.tipo;
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(extra);
    return acc;
  }, {} as Record<string, Extra[]>);

  return (
    <div className="fixed inset-0 bg-[#00000066] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[700px] p-6">
        <div className="flex justify-between items-center pb-2 mb-4">
          <h2 className="text-xl mx-auto font-bold">{item.nombre}</h2>
          <button
            onClick={onClose}
            className="text-[var(--color_principal)] font-bold hover:text-[var(--color_principal_hover)] hover:cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Extras */}
          <div className="rounded shadow-[0px_4px_8px_#dc354644] pb-2">
            <h3 className="font-bold text-center border-b border-[var(--color_borde)] p-2 mb-2">
              Agregar Extras
            </h3>
            {permiteExtras ? (
              ordenTipos.map(
                (tipo) =>
                  extrasPorTipo[tipo] && (
                    <div key={tipo} className="px-2 mb-2">
                      <h4 className="m-0 p-0 font-bold">
                        {tipo.toUpperCase()}
                      </h4>
                      {extrasPorTipo[tipo].map((extra) => (
                        <div
                          key={extra.id}
                          className="flex items-center justify-between ms-2"
                        >
                          <label className="flex items-center gap-2 hover:cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!extras[extra.id]}
                              onChange={() => toggleExtra(extra.id)}
                            />
                            {extra.nombre} ${extra.precioExtra}
                          </label>
                          {extra.estaqueable && extras[extra.id] && (
                            <div className="flex items-center">
                              <span className="pe-2">
                                x{extras[extra.id]} {" $"}
                                {extra.precioExtra * extras[extra.id]}
                              </span>
                              <button
                                className="px-1 bg-gray-200 rounded-l border-r border-[var(--color_borde)] hover:bg-gray-300 hover:cursor-pointer transition"
                                onClick={() =>
                                  changeCantidadExtra(extra.id, -1)
                                }
                              >
                                <i className="fa-solid fa-minus"></i>
                              </button>
                              <button
                                className="px-1 bg-gray-200 rounded-r hover:bg-gray-300 hover:cursor-pointer transition"
                                onClick={() =>
                                  changeCantidadExtra(extra.id, +1)
                                }
                              >
                                <i className="fa-solid fa-plus"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
              )
            ) : (
              <div className="flex items-center justify-between px-2">
                Este producto no permite agregar Extras.
              </div>
            )}
          </div>

          {/* Exclusiones */}
          <div className="rounded shadow-[0px_4px_8px_#dc354644] pb-2">
            <h3 className="font-bold text-center border-b border-[var(--color_borde)] p-2 mb-2">
              Modificar
            </h3>
            {ordenTipos.map(
              (tipo) =>
                ingredientesPorTipo[tipo] && (
                  <div key={tipo} className="px-2">
                    <h4 className="m-0 p-0 font-bold">{tipo.toUpperCase()}</h4>
                    {ingredientesPorTipo[tipo].map((ing) => (
                      <label
                        key={ing.id}
                        className="ms-2 flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={!exclusiones.includes(ing.nombre)}
                          onChange={() => toggleExclusion(ing.nombre)}
                        />
                        {ing.nombre}
                      </label>
                    ))}
                  </div>
                )
            )}
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={handleConfirm}
            className="bg-[var(--color_principal)] text-white px-4 py-2 rounded hover:bg-[var(--color_principal_hover)] hover:cursor-pointer font-bold transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
