// src/components/AdminSidebar.tsx
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
  { label: "Usuarios", iconClass: "fa-solid fa-user", path: "users" },
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
  return (
    <div className="w-64 flex flex-col">
      <nav className="bg-[var(--color_oscuro)] rounded-lg text-[var(--color_claro)] py-5">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path} className="border-b flex items-center h-[52px]">
              <button
                onClick={() => onNavigate(item.path)}
                className={`flex items-center gap-2 w-full h-full text-left text-[18px] px-4 py-2 border-l-[10px] border-[var(--color_oscuro)] font-bold hover:cursor-pointer transition ${
                  activePath === item.path
                    ? "bg-[var(--color_principal)] border-l-[10px] border-[var(--color_secundario)] text-[var(--color_claro)]"
                    : "text-[var(--color_claro)] border-l-[10px] border-[var(--color_oscuro)] hover:bg-[var(--color_secundario)] hover:text-[var(--color_oscuro)] hover:border-[var(--color_secundario)]"
                }`}
              >
                <i className={`${item.iconClass} mr-3`}></i>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
