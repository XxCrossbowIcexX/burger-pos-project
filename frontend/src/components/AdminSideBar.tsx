// src/components/AdminSidebar.tsx
import { useState, useRef, useEffect } from "react";

interface MenuItem {
  label: string;
  iconClass: string;
  path: string;
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    iconClass: "fa-solid fa-chart-line",
    path: "dashboard",
  },
  { label: "General", iconClass: "fa-solid fa-cog", path: "general" },
  { label: "Usuarios", iconClass: "fa-solid fa-user", path: "users" },
  { label: "Caja", iconClass: "fa-solid fa-cash-register", path: "caja" },
  {
    label: "Ingredientes",
    iconClass: "fa-solid fa-bacon",
    path: "ingredients",
  },
  { label: "Categorías", iconClass: "fa-solid fa-list-ul", path: "categories" },
  { label: "Productos", iconClass: "fa-solid fa-burger", path: "products" },
];

interface AdminSidebarProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

export const AdminSidebar = ({ onNavigate, activePath }: AdminSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const sideBarRef = useRef<HTMLDivElement>(null);

  // Cerrar si hago clic fuera en mobile
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
      className={`bg-[var(--color_oscuro)] text-[var(--color_claro)] transition-all duration-300 rounded-lg
        ${isExpanded ? "w-60" : "w-16"} lg:w-64`}
    >
      <div className="border-b flex items-center h-[52px]">
        <button
          className="flex items-center gap-2 text-[18px] font-bold px-4 py-2 border-l-[10px] border-[var(--color_oscuro)] w-full hover:cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <i className="fa-solid fa-bars"></i>
          <p className={`m-0 ${isExpanded ? "block" : "hidden"} lg:block`}>
            Menú Admin
          </p>
        </button>
      </div>
      <nav className="py-5">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path} className="border-b flex items-center h-[52px]">
              <button
                onClick={() => {
                  onNavigate(item.path);
                  setIsExpanded(false);
                }}
                className={`flex items-center gap-2 w-full h-full text-left text-[18px] px-4 py-2 border-l-[10px] border-[var(--color_oscuro)] font-bold hover:cursor-pointer transition ${
                  activePath === item.path
                    ? "bg-[var(--color_principal)] border-l-[10px] border-[var(--color_secundario)] text-[var(--color_claro)]"
                    : "text-[var(--color_claro)] border-l-[10px] border-[var(--color_oscuro)] hover:bg-[var(--color_secundario)] hover:text-[var(--color_oscuro)] hover:border-[var(--color_secundario)]"
                }`}
              >
                <i className={item.iconClass}></i>
                <p
                  className={`m-0 ${isExpanded ? "block" : "hidden"} lg:block`}
                >
                  {item.label}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
