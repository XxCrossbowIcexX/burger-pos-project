import type { Product } from "../App";

type ProductCardProps = {
  producto: Product;
  onAdd: (producto: Product) => void;
};

export const ProductCard = ({ producto, onAdd }: ProductCardProps) => {
  return (
    <div
      key={producto.id}
      className="flex flex-col p-4 rounded shadow-[0px_4px_8px_#dc354644] bg-white hover:shadow-lg transition-shadow"
    >
      <h3 className="text-xl font-bold text-[var(--color_terciario)]">
        {producto.nombre}
      </h3>
      <p className="text-[var(--color_oscuro)] text-sm mt-1">
        {producto.descripcion}
      </p>
      <div className="flex justify-between items-center mt-auto font-bold">
        <p className="text-[var(--color_principal)] text-[22px]">
          ${producto.precioBase}
        </p>
        <button
          className="bg-[var(--color_principal)] text-[var(--color_claro)] px-3 py-1 rounded hover:cursor-pointer hover:bg-[var(--color_principal_hover)] transition"
          onClick={() => onAdd(producto)}
        >
          + Agregar
        </button>
      </div>
    </div>
  );
};
