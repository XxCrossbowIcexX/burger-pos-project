import { useState, useRef, useEffect } from "react";
import type { CategoriaSeleccionada } from "../App";
import { useFetch, type ApiResponse } from "../hooks";

type SideBarProps = {
  categoriaSeleccionada: CategoriaSeleccionada;
  setCategoriaSeleccionada: (cat: CategoriaSeleccionada) => void;
};

type Category = {
  id: string;
  nombre: string;
  icono: string;
};

const url = "http://localhost:3000/api/categorias";

export const SideBar = ({
  categoriaSeleccionada,
  setCategoriaSeleccionada,
}: SideBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const sideBarRef = useRef<HTMLDivElement>(null);

  const { data, loading, error } = useFetch<ApiResponse<Category[]>>(url);

  // selecciona la primer categoria si no hay una seleccionada
  useEffect(() => {
    if (categoriaSeleccionada.nombre === "" && data && data.data.length > 0) {
      setCategoriaSeleccionada(data.data[0]);
    }
  }, [data, categoriaSeleccionada, setCategoriaSeleccionada]);

  // cerrar si hago clic fuera en mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sideBarRef.current &&
        !sideBarRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  return (
    <aside
      ref={sideBarRef}
      className={`bg-[var(--color_oscuro)] text-[var(--color_claro)] transition-all duration-300
        ${isExpanded ? "w-60" : "w-16"} lg:w-60`}
    >
      <div className="border-b flex items-center h-[52px]">
        <button
          className="flex items-center gap-2 text-[18px] font-bold px-4 py-2 border-l-[10px] border-[var(--color_oscuro)] w-full hover:cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <i className="fa-solid fa-bars"></i>
          <p className={`m-0 ${isExpanded ? "block" : "hidden"} lg:block`}>
            Menú
          </p>
        </button>
      </div>
      <ul>
        {/* Estado de carga */}
        {loading && (
          <div className="grid gap-1">
            {(data && data.data.length > 0
              ? Array.from({ length: data.data.length }, (_, i) => i + 1)
              : [1, 2]
            ).map((i) => (
              <div
                key={i}
                className="flex flex-col p-4 shadow-md bg-white animate-pulse"
              >
                <button className="flex items-center gap-2 w-full h-full text-left text-[18px] px-4 py-2 font-bold hover:cursor-pointer transition"></button>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="m-2 p-4 bg-red-100 text-red-700 rounded">
            Error al cargar las categorias: {error.message}
          </div>
        )}
        {/** Mostrar las categorías */}
        {!loading &&
          !error &&
          data &&
          data.data.length > 0 &&
          data.data.map((categoria) => (
            <li
              key={categoria.id}
              className="border-b flex items-center h-[52px]"
            >
              <button
                className={`flex items-center gap-2 w-full h-full text-left text-[18px] px-4 py-2 border-l-[10px] border-[var(--color_oscuro)] font-bold hover:cursor-pointer transition 
                ${
                  categoria === categoriaSeleccionada
                    ? "bg-[var(--color_principal)] text-[var(--color_claro)] border-[var(--color_secundario)]"
                    : "bg-[var(--color_oscuro)] text-[var(--color_claro)] hover:bg-[var(--color_secundario)] hover:text-[var(--color_oscuro)] hover:border-[var(--color_secundario)]"
                }`}
                onClick={() => {
                  setCategoriaSeleccionada(categoria);
                  setIsExpanded(false);
                }}
              >
                <i className={`fa-solid ${categoria.icono}`}></i>
                <p
                  className={`m-0 ${isExpanded ? "block" : "hidden"} lg:block`}
                >
                  {categoria.nombre}
                </p>
              </button>
            </li>
          ))}
      </ul>
    </aside>
  );
};
