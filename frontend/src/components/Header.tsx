import { useState, useEffect } from "react";
import AdminPanel from "./AdminPanel";
import SalesHistoryModal from "./SalesHistoryModal";
import { useAuth } from "../context/AuthContext";
import KitchenPage from "../pages/KitchenPage";

type HeaderProps = {
  mostrarAdmin: boolean;
  setMostrarAdmin: (mostrar: boolean) => void;
};

export const Header = ({ mostrarAdmin, setMostrarAdmin }: HeaderProps) => {
  const [fechaHora, setFechaHora] = useState<string>("");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [mostrarCocina, setMostrarCocina] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const actualizarFecha = () => {
      const ahora = new Date();
      const fecha = ahora.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const hora = ahora.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setFechaHora(`${fecha} - ${hora}`);
    };

    actualizarFecha();
    const intervalo = setInterval(actualizarFecha, 1000);
    return () => clearInterval(intervalo);
  }, []);
  const puedeVerCocina = () => {
    switch (user?.rol) {
      case "cocina":
        return "";

      case "sistema":
      case "administrador":
      case "mostrador":
        return (
          <button
            className="bg-[var(--color_secundario)] text-[var(--color_oscuro)] px-4 py-2 rounded hover:cursor-pointer hover:bg-[var(--color_secundario_hover)] transition"
            onClick={() => setMostrarCocina(true)}
          >
            <i className="fa-solid fa-utensils"></i> Cocina
          </button>
        );
      default:
        return null;
    }
  };

  return mostrarCocina ? (
    <KitchenPage />
  ) : (
    <header className="flex items-center justify-between bg-[var(--color_claro)] text-[var(--color_principal)] font-bold border-b border-[var(--color_borde)]">
      <h1 className="text-3xl font-bold p-4">Burger POS</h1>
      <div className="flex gap-4 items-center">
        {puedeVerCocina()}
        <button
          className="bg-[var(--color_secundario)] text-[var(--color_oscuro)] px-4 py-2 rounded hover:cursor-pointer hover:bg-[var(--color_secundario_hover)] transition"
          onClick={() => setMostrarAdmin(true)}
        >
          <i className="fa-solid fa-gears"></i> Administrar
        </button>
        <button
          className="bg-[var(--color_principal)] text-[var(--color_claro)] px-4 py-2 rounded hover:cursor-pointer hover:bg-[var(--color_principal_hover)] transition"
          onClick={() => setHistoryModalOpen(true)}
        >
          <i className="fa-solid fa-clock-rotate-left"></i> Historial
        </button>
        <div className="flex flex-col justify-center items-end px-4">
          <p className="p-0 m-0">
            Cajero: <span>{user?.nombreUsuario || "Usuario no logeado"}</span>
          </p>
          <span className="text-sm">{fechaHora}</span>
        </div>
      </div>
      {mostrarAdmin && <AdminPanel onClose={() => setMostrarAdmin(false)} />}
      <SalesHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
    </header>
  );
};
