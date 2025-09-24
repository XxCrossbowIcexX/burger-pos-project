import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import { Header } from "./components/Header";
import { OrderAside } from "./components/OrderAside";
import { ProductCard } from "./components/ProductCard";
import { SideBar } from "./components/SideBar";
import { useFetch, type ApiResponse } from "./hooks";

export type CategoriaSeleccionada = {
  id: string;
  nombre: string;
};

export type ExtraSeleccionado = {
  id: string;
  nombre: string;
  precioExtra: number;
  cantidad: number;
};

export type CartItem = {
  cartId: string;
  productId: string;
  nombre: string;
  descripcion: string;
  precioBase: number;
  cantidad: number;
  extras: ExtraSeleccionado[];
  exclusiones: string[];
  permiteExtras: boolean;
  permiteExclusiones: boolean;
  total: number;
  ingredientes: Ingredientes[];
};

export type Ingrediente = {
  id: string;
  nombre: string;
  tipo: "pan" | "carne" | "queso" | "vegetal" | "salsa";
};

export type Ingredientes = {
  ingrediente: Ingrediente;
};

export type Product = {
  id: string;
  nombre: string;
  descripcion: string;
  precioBase: number;
  permiteExtras: boolean;
  permiteExclusiones: boolean;
  categoriaId: string;
  ingredientes: Ingredientes[];
};

let url = "http://localhost:3000/api/productos";

function App() {
  const [categoria, setCategoria] = useState<CategoriaSeleccionada>();
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [mostrarAdmin, setMostrarAdmin] = useState(false);

  if (categoria) {
    // Si se proporciona una categoría, filtrar por ella
    url = `http://localhost:3000/api/productos/categoria/${categoria.id}`;
  }
  // Usar el hook para obtener productos

  const { data, loading, error } = useFetch<ApiResponse<Product[]>>(url);

  const agregarAlCarrito = (producto: Product) => {
    const nuevoItem: CartItem = {
      cartId: uuidv4(),
      productId: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precioBase: Number(producto.precioBase),
      cantidad: 1,
      extras: [],
      exclusiones: [],
      permiteExtras: Boolean(producto.permiteExtras),
      permiteExclusiones: Boolean(producto.permiteExclusiones),
      total: Number(producto.precioBase),
      ingredientes: producto.ingredientes || [],
    };

    setCarrito((prev) => [...prev, nuevoItem]);
  };

  const eliminarItem = (cartId: string) => {
    setCarrito((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const limpiarCarrito = () => setCarrito([]);

  const actualizarCantidad = (cartId: string, nuevaCantidad: number) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.cartId === cartId ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  };

  const actualizarItem = (itemActualizado: CartItem) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.cartId === itemActualizado.cartId ? itemActualizado : item
      )
    );
  };

  // Efecto para seleccionar primera categoría
  useEffect(() => {
    if (categoria?.nombre === "" && data && data.data.length > 0) {
      // Aquí podrías filtrar por categoría si tu API lo soporta
      setCategoria(categoria); // o la primera categoría disponible
    }
  }, [data, categoria]);

  return (
    <div className="bg-[var(--color_claro)] flex flex-1 flex-col min-h-screen max-h-screen overflow-hidden">
      <Header mostrarAdmin={mostrarAdmin} setMostrarAdmin={setMostrarAdmin} />
      <div className="flex flex-1 overflow-hidden">
        <SideBar
          categoriaSeleccionada={categoria || { id: "", nombre: "" }}
          setCategoriaSeleccionada={setCategoria}
        />
        <div className="flex-1 flex flex-col">
          <main className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color_borde)] flex-col lg:flex-row pb-4">
              <h1 className="text-2xl font-bold">{categoria?.nombre}</h1>
              <input
                type="text"
                placeholder="Buscar..."
                className="border border-[var(--color_principal)] rounded px-2 py-1 mt-2 lg:mt-0 lg:w-1/3"
              />
            </div>

            {/* Estado de carga */}
            {loading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col p-4 rounded shadow-md bg-white animate-pulse"
                  >
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between items-center mt-auto">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                Error al cargar productos: {error.message}
              </div>
            )}
            {/* Productos */}
            {!loading &&
              !error &&
              (data && data.data.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  {data.data.map((producto) => (
                    <ProductCard
                      key={producto.id}
                      producto={producto}
                      onAdd={agregarAlCarrito}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 p-4 bg-yellow-100 text-yellow-700 rounded">
                  No hay productos disponibles en esta categoría.
                </div>
              ))}
          </main>
        </div>
        <OrderAside
          carrito={carrito}
          onDelete={eliminarItem}
          onClear={limpiarCarrito}
          onUpdateQuantity={actualizarCantidad}
          onUpdateItem={actualizarItem}
        />
      </div>
    </div>
  );
}

export default App;
