import { motion } from "framer-motion";

type Extra = {
  nombre: string;
  precioExtra: number;
  cantidad: number;
};

type CartItemProps = {
  nombre: string;
  cantidad: number;
  precioBase: number;
  extras?: Extra[];
  exclusiones?: string[];
  permiteExtras: boolean;
  permiteExclusiones: boolean;
  total: number;
  onDelete: () => void;
  onModify: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
};

export const CartItem = ({
  nombre,
  cantidad,
  precioBase,
  extras = [],
  exclusiones = [],
  permiteExtras,
  permiteExclusiones,
  total,
  onDelete,
  onModify,
  onIncrease,
  onDecrease,
}: CartItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.3 }}
      className="flex justify-between items-start p-4 rounded shadow-md mb-3 bg-white"
    >
      {/* Lado izquierdo */}
      <div className="flex-1 text-[var(--color_oscuro)]">
        {/* Título + icono eliminar */}
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-[var(--color_terciario)]">
            {nombre}
          </h3>
          <button
            onClick={onDelete}
            className="text-[var(--color_principal)] hover:text-[var(--color_principal_hover)] hover:cursor-pointer transition"
          >
            <i className="fa-solid fa-trash-can"></i>
          </button>
        </div>

        <div className="inline-flex items-center rounded-md p-1">
          <button
            onClick={onDecrease}
            disabled={cantidad <= 1}
            className={`w-6 h-6 rounded flex items-center justify-center text-lg font-bold transition-all duration-200
              ${
                cantidad <= 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[var(--color_principal)] text-white hover:bg-[var(--color_principal_hover)] hover:cursor-pointer shadow-sm"
              }`}
          >
            <i className="fa-solid fa-minus"></i>
          </button>

          <span className="text-sm font-bold min-w-6 text-center text-[var(--color_oscuro)]">
            {cantidad}
          </span>

          <button
            onClick={onIncrease}
            className="w-6 h-6 rounded flex items-center justify-center text-lg font-bold bg-[var(--color_exito)] text-white hover:bg-[var(--color_exito_hover)] hover:cursor-pointer shadow-sm transition-all duration-200"
          >
            <i className="fa-solid fa-plus"></i>
          </button>

          <span className="text-sm font-bold text-[var(--color_borde)] ms-2">
            x ${precioBase}
          </span>
        </div>

        {/* Extras si hay */}
        {extras.length > 0 && (
          <>
            <p className="text-sm mt-1 italic font-bold">Extras:</p>
            <ul className="text-sm list-inside list-disc">
              {extras.map((extra, index) => (
                <li key={index} className="flex justify-between ps-2 h-[18px]">
                  <span className="before:content-['•'] before:text-base before:text-[var(--color_oscuro)] before:font-bold flex items-center gap-2">
                    {extra.nombre}{" "}
                    {extra.cantidad > 1 ? "x" + extra.cantidad : ""}
                  </span>
                  <span className="font-bold">
                    + ${extra.precioExtra * extra.cantidad}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {exclusiones.length > 0 && (
          <>
            <p className="text-sm mt-1 italic font-bold">Sin:</p>
            <ul className="text-sm list-disc list-inside">
              {exclusiones.map((excluir, index) => (
                <li key={index} className="flex justify-between ps-2 h-[18px]">
                  <span className="before:content-['•'] before:text-base before:text-[var(--color_oscuro)] before:font-bold flex items-center gap-2">
                    {excluir}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Botón modificar */}
        <div className="flex items-center justify-between">
          {(permiteExtras || permiteExclusiones) && (
            <button
              onClick={onModify}
              className="mt-2 px-3 py-1 rounded font-bold bg-[var(--color_principal)] hover:bg-[var(--color_principal_hover)] hover:cursor-pointer text-white"
            >
              Modificar
            </button>
          )}
          <span className="ms-auto text-xl text-[var(--color_principal)] font-bold">
            ${total}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
