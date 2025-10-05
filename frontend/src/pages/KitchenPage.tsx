import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import POSPage from "./POSPage";

interface Venta {
  id: string;
  totalFinal: string;
  estado: string;
  createdAt: string;
  tipoEntrega: "local" | "paraLlevar" | "domicilio";
  usuario: {
    nombreUsuario: string;
  };
  items: Array<{
    id: string;
    cantidad: number;
    producto: {
      nombre: string;
      categoria: {
        nombre: string;
      };
    };
    extras: Array<{
      cantidad: number;
      ingrediente: {
        id: string;
        nombre: string;
      };
    }>;
    exclusiones: Array<{
      ingrediente: {
        id: string;
        nombre: string;
      };
    }>;
    extrasSeleccionados: string;
    ingredientesModificados: string | null;
  }>;
}

export default function KitchenPage() {
  const [mostrarPosPage, setMostrarPosPage] = useState(false);
  const { user, logout } = useAuth();
  const { data: ventasData, refetch } = useFetch<{
    success: boolean;
    data: Venta[];
  }>("/api/ventas");

  const ventas = ventasData?.data || [];

  // Filtrar ventas pendientes de las últimas 12 horas y ordenar por tiempo (más antiguas primero)
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const ventasPendientes = ventas
    .filter((v) => {
      const ventaDate = new Date(v.createdAt);
      return v.estado === "pendiente" && ventaDate >= twelveHoursAgo;
    })
    .sort((a, b) => {
      // Ordenar de más antigua a más reciente (urgentes primero)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  useEffect(() => {
    // Refrescar cada 10 segundos
    const interval = setInterval(() => {
      refetch();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    // Escuchar evento de nueva orden
    const handleNuevaOrden = (event: any) => {
      console.log("Nueva orden recibida:", event.detail);

      // Refrescar inmediatamente
      refetch();

      // Mostrar notificación visual
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 bg-orange-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-bounce";
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-bell text-2xl"></i>
          <div>
            <p class="font-bold">¡Nueva Orden!</p>
            <p class="text-sm">Orden #${event.detail.id.substring(0, 8)}</p>
          </div>
        </div>
      `;
      document.body.appendChild(notification);

      // Reproducir sonido (opcional)
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LNnHwU2jdXty3ojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBELTKXh8LdlHAU2jtXuzHojBSh+zPLaizsKGGS56+mjUBEL"
      );
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Si no se puede reproducir, ignorar el error
      });

      // Remover notificación después de 5 segundos
      setTimeout(() => {
        notification.remove();
      }, 5000);
    };

    window.addEventListener("nueva-orden", handleNuevaOrden);
    return () => {
      window.removeEventListener("nueva-orden", handleNuevaOrden);
    };
  }, [refetch]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTipoEntregaInfo = (tipo: string) => {
    switch (tipo) {
      case "local":
        return { icon: "fa-utensils", label: "Local", color: "orange" };
      case "paraLlevar":
        return {
          icon: "fa-bag-shopping",
          label: "Para Llevar",
          color: "purple",
        };
      case "domicilio":
        return { icon: "fa-motorcycle", label: "Domicilio", color: "blue" };
      default:
        return { icon: "fa-utensils", label: "Local", color: "orange" };
    }
  };

  const isUrgente = (createdAt: string): boolean => {
    const createdTime = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - createdTime) / (1000 * 60);
    return diffMinutes > 30;
  };

  const handleMarcarCompletada = async (ventaId: string) => {
    try {
      await fetch(`http://localhost:3000/api/ventas/${ventaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: "completada",
        }),
      });
      refetch();
    } catch (error) {
      console.error("Error al marcar como completada:", error);
    }
  };

  const puedeVerPos = () => {
    switch (user?.rol) {
      case "cocina":
        return "";

      case "sistema":
      case "administrador":
      case "mostrador":
        return (
          <button
            className="bg-[var(--color_secundario)] text-[var(--color_oscuro)] px-4 py-2 rounded hover:cursor-pointer hover:bg-[var(--color_secundario_hover)] transition"
            onClick={() => setMostrarPosPage(true)}
          >
            <i className="fa-solid fa-burger"></i> Volver al POS
          </button>
        );
      default:
        return null;
    }
  };

  return mostrarPosPage ? (
    <POSPage />
  ) : (
    <div className="min-h-screen bg-gray-100 overflow-y-auto">
      {/* Header */}
      <header className="bg-[var(--color_claro)] text-[var(--color_principal)] shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <i className="fa-solid fa-utensils text-3xl"></i>
            <div>
              <h1 className="text-2xl font-bold">Cocina</h1>
              <p className="text-sm opacity-90">Órdenes Pendientes</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {puedeVerPos()}
            <div className="text-right">
              <p className="font-semibold">{user?.nombreUsuario}</p>
              <p className="text-sm opacity-90 capitalize">{user?.rol}</p>
            </div>
            <button
              onClick={logout}
              className="bg-[var(--color_principal)]/20 hover:bg-[var(--color_principal)]/30 px-4 py-2 rounded-lg transition hover:cursor-pointer"
            >
              <i className="fa-solid fa-right-from-bracket mr-2"></i>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-[var(--color_secundario)]/20 p-4 rounded-lg">
                <i className="fa-solid fa-clock text-[var(--color_secundario)] text-2xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Órdenes Pendientes</p>
                <p className="text-3xl font-bold text-gray-800">
                  {ventasPendientes.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-[var(--color_principal)]/20 p-4 rounded-lg">
                <i className="fa-solid fa-triangle-exclamation text-[var(--color_principal)] text-2xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Urgentes</p>
                <p className="text-3xl font-bold text-gray-800">
                  {
                    ventasPendientes.filter(
                      (v) => v.estado === "pendiente" && isUrgente(v.createdAt)
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-[var(--color_exito)]/20 p-4 rounded-lg">
                <i className="fa-solid fa-check-circle text-[var(--color_exito)] text-2xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Completadas (12h)</p>
                <p className="text-3xl font-bold text-gray-800">
                  {
                    ventas.filter((v) => {
                      const ventaDate = new Date(v.createdAt);
                      return (
                        v.estado === "completada" && ventaDate >= twelveHoursAgo
                      );
                    }).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {ventasPendientes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <i className="fa-solid fa-utensils text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No hay órdenes pendientes
            </h2>
            <p className="text-gray-600">
              Las nuevas órdenes aparecerán aquí automáticamente
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ventasPendientes.map((venta) => {
              const tipoEntrega = getTipoEntregaInfo(venta.tipoEntrega);
              const urgente = isUrgente(venta.createdAt);

              return (
                <div
                  key={venta.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
                >
                  {/* Order Header */}
                  <div
                    className={`p-4 ${
                      urgente
                        ? "bg-[var(--color_principal)] text-[var(--color_claro)]"
                        : "bg-[var(--color_secundario)] text-[var(--color_oscuro)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">
                          {urgente && (
                            <>
                              <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                              URGENTE •{" "}
                            </>
                          )}
                          Orden
                        </p>
                        <p className="text-xl font-bold">
                          #{venta.id.substring(0, 8)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm opacity-90">Hora</p>
                        <p className="text-xl font-bold">
                          {formatTime(venta.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm opacity-90">
                        <i className="fa-solid fa-user mr-1"></i>
                        {venta.usuario.nombreUsuario}
                      </p>
                      <div
                        className={`bg-white/20 px-3 py-1 rounded-full text-xs font-semibold`}
                      >
                        <i className={`fa-solid ${tipoEntrega.icon} mr-1`}></i>
                        {tipoEntrega.label}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-4 p-4 flex flex-col">
                    {venta.items.map((item) => {
                      return (
                        <div
                          key={item.id}
                          className="border-b border-gray-200 pb-3 last:border-0 flex flex-col justify-between items-start p-4 rounded shadow-md mb-3 bg-white"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-bold text-gray-800">
                                {item.cantidad}x {item.producto.nombre}
                              </p>
                            </div>
                          </div>

                          {item.extras && item.extras.length > 0 && (
                            <div className="ml-2 text-sm">
                              <p className="text-green-600 font-semibold">
                                <i className="fa-solid fa-plus mr-1"></i>
                                Extras:
                              </p>
                              <ul className="list-disc list-inside text-gray-600">
                                {item.extras.map((extra, idx: number) => (
                                  <li key={idx} className="ps-4">
                                    {extra.cantidad}x {extra.ingrediente.nombre}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {item.exclusiones && item.exclusiones.length > 0 && (
                            <div className="ml-2 text-sm">
                              <p className="text-red-600 font-semibold">
                                <i className="fa-solid fa-minus mr-1"></i>
                                Sin:
                              </p>
                              <ul className="list-disc list-inside text-gray-600">
                                {item.exclusiones.map(
                                  (exclusion, idx: number) => (
                                    <li key={idx} className="ps-4">
                                      {exclusion.ingrediente.nombre}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Complete Button */}
                  <div className="mt-auto p-4 bg-gray-50">
                    <button
                      onClick={() => handleMarcarCompletada(venta.id)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors hover:cursor-pointer"
                    >
                      <i className="fa-solid fa-check mr-2"></i>
                      Marcar como Completada
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
