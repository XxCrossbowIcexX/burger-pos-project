import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import KitchenPage from "./pages/KitchenPage";
import POSPage from "./pages/POSPage";

export default function AppRoutes() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  // Mostrar loading mientras verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-6xl text-orange-500 mb-4"></i>
          <p className="text-gray-600 text-xl">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Redireccionar según el rol
  switch (user.rol) {
    case "cocina":
      return <KitchenPage />;

    case "sistema":
    case "administrador":
    case "mostrador":
      return <POSPage />;

    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
            <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-exclamation-triangle text-5xl text-red-500"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Acceso Denegado</h1>
            <p className="text-gray-600 mb-2">
              Tu rol <span className="font-semibold text-gray-800">"{user.rol}"</span> no tiene permisos para acceder al sistema.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Contacta al administrador para más información.
            </p>
            <button
              onClick={logout}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 hover:cursor-pointer shadow-lg"
            >
              <i className="fa-solid fa-right-from-bracket mr-2"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>
      );
  }
}
