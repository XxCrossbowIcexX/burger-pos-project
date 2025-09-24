// src/components/AdminPanel.tsx
import { useState } from "react";
import DashboardPage from "../pages/admin/DashboardPage";
import UsersPage from "../pages/admin/UsersPage";
import CategoriesPage from "../pages/admin/CategoriesPage";
import ProductsPage from "../pages/admin/ProductsPages";
import { AdminSidebar } from "./AdminSideBar";
import IngredientsPage from "../pages/admin/IngredientsPage";

interface AdminPanelProps {
  onClose?: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activePath, setActivePath] = useState("dashboard");

  const handleNavigate = (path: string) => {
    setActivePath(path);
  };

  const renderContent = () => {
    switch (activePath) {
      case "dashboard":
        return <DashboardPage />;
      case "users":
        return <UsersPage />;
      case "ingredients":
        return <IngredientsPage />;
      case "categories":
        return <CategoriesPage />;
      case "products":
        return <ProductsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#00000066] z-50 flex justify-center items-center p-4">
      <div className="bg-[var(--color_claro)] text-[var(--color_oscuro)] rounded-lg shadow-2xl w-full max-w-7xl max-h-screen overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--color_borde)]">
          <h1 className="text-xl font-bold mx-auto">Administra el sistema</h1>
          <button
            onClick={onClose}
            className="text-[var(--color_principal)] font-bold hover:text-[var(--color_principal_hover)] hover:cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <div
          className="flex-1 flex overflow-hidden p-3"
          style={{ height: "70vh" }}
        >
          {/* Sidebar */}
          <AdminSidebar onNavigate={handleNavigate} activePath={activePath} />

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-auto">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
