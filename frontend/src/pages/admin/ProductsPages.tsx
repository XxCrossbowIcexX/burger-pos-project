// src/pages/ProductsPage.tsx
import { useState } from "react";

export default function ProductsPage() {
  const [products] = useState([
    {
      id: "01",
      code: "1254",
      name: "Hamburguesa Clásica",
      category: "Hamburguesa",
      description: "Pan, Carne, Tomate, Muza, Mayonesa",
      price: 220,
      active: true,
    },
    {
      id: "02",
      code: "1264",
      name: "Hamburguesa Doble",
      category: "Hamburguesa",
      description: "Pan, 2x Carne, Tomate, Muza, Mayonesa...",
      price: 300,
      active: true,
    },
  ]);

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Productos</h2>
        <button className="bg-[var(--color_principal)] text-[var(--color_claro)] px-4 py-2 rounded-lg hover:bg-[var(--color_principal_hover)] hover:cursor-pointer transition">
          <i className="fa-solid fa-plus mr-2"></i>
          Nuevo Producto
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow mt-4">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[var(--color_oscuro)] text-left text-sm text-[var(--color_claro)] font-bold uppercase tracking-wider">
              <th className="px-4 py-3 border-r border-[var(--color_borde)] text-center">
                Código
              </th>
              <th className="px-4 py-3 border-r border-[var(--color_borde)]">
                Nombre
              </th>
              <th className="px-4 py-3 border-r border-[var(--color_borde)] text-center">
                Categoría
              </th>
              <th className="px-4 py-3 border-r border-[var(--color_borde)]">
                Descripción
              </th>
              <th className="px-4 py-3 border-r border-[var(--color_borde)] text-center">
                Precio
              </th>
              <th className="px-4 py-3 border-r border-[var(--color_borde)] text-center">
                Activo
              </th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color_borde)]">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 text-[var(--color_oscuro)] font-medium"
              >
                <td className="px-4 py-3 border-r border-[var(--color_borde)] text-center">
                  {product.code}
                </td>
                <td className="px-4 py-3 border-r border-[var(--color_borde)]">
                  {product.name}
                </td>
                <td className="px-4 py-3 border-r border-[var(--color_borde)] text-center">
                  <span className="bg-[var(--color_secundario)] text-[var(--color_oscuro)] text-xs px-2 py-1 rounded-full">
                    {product.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate border-r border-[var(--color_borde)]">
                  {product.description}
                </td>
                <td className="px-4 py-3 border-r border-[var(--color_borde)] text-center">
                  ${product.price}
                </td>
                <td className="px-4 py-3 border-r border-[var(--color_borde)] text-center">
                  {product.active ? (
                    <i className="fa-regular fa-square-check text-[var(--color_exito)] cursor-not-allowed"></i>
                  ) : (
                    <i className="fa-regular fa-square text-[var(--color_borde)] cursor-not-allowed"></i>
                  )}
                </td>
                <td className="px-4 py-3 space-x-4 text-center">
                  <button className="text-[var(--color_secundario)] hover:cursor-pointer hover:text-[var(--color_secundario_hover)]">
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button className="text-[var(--color_principal)] hover:cursor-pointer hover:text-[var(--color_principal_hover)]">
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
