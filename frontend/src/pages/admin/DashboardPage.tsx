import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";

interface VentaStats {
  totalVentas: number;
  totalIngresos: number;
  ventasEfectivo: number;
  ventasTransferencia: number;
  promedioVenta: number;
}

interface RecentVenta {
  id: string;
  totalFinal: string;
  metodoPago: string;
  createdAt: string;
  usuario: {
    nombreUsuario: string;
  };
  items: Array<{
    cantidad: number;
    producto: {
      nombre: string;
    };
  }>;
}

interface Caja {
  id: string;
  estado: string;
  montoInicial: string;
  totalVentas: string;
  ventasEfectivo: string;
  ventasTransferencia: string;
  fechaApertura: string;
  usuario: {
    nombreUsuario: string;
  };
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">(
    "today"
  );
  const { data: statsData } = useFetch<{ success: boolean; data: VentaStats }>(
    "/api/ventas/stats"
  );
  const { data: ventasData } = useFetch<{
    success: boolean;
    data: RecentVenta[];
  }>("/api/ventas");
  const { data: cajasData } = useFetch<{ success: boolean; data: Caja[] }>(
    "/api/cajas"
  );

  const stats = statsData?.data;
  const ventas = ventasData?.data || [];
  const cajas = cajasData?.data || [];

  // Filtrar ventas del día actual
  const today = new Date().toISOString().split("T")[0];
  const ventasHoy = ventas.filter((v) => v.createdAt.startsWith(today));
  const recentVentas = ventasHoy.slice(0, 5);

  // Caja abierta
  const cajaAbierta = cajas.find((c) => c.estado === "abierta");

  const formatCurrency = (value: number | string) => {
    return `$${parseFloat(value.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Vista general de tu negocio</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange("today")}
            className={`px-4 py-2 rounded-lg transition-colors hover:cursor-pointer ${
              timeRange === "today"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setTimeRange("week")}
            className={`px-4 py-2 rounded-lg transition-colors hover:cursor-pointer ${
              timeRange === "week"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-4 py-2 rounded-lg transition-colors hover:cursor-pointer ${
              timeRange === "month"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Ventas */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Ventas</p>
              <p className="text-3xl font-bold mt-2">
                {stats?.totalVentas || 0}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <i className="fa-solid fa-receipt text-2xl"></i>
            </div>
          </div>
          <p className="text-blue-100 text-sm mt-4">
            <i className="fa-solid fa-arrow-up"></i> Ventas completadas
          </p>
        </div>

        {/* Ingresos Totales */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Ingresos</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(stats?.totalIngresos || 0)}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <i className="fa-solid fa-dollar-sign text-2xl"></i>
            </div>
          </div>
          <p className="text-green-100 text-sm mt-4">
            <i className="fa-solid fa-chart-line"></i> Total facturado
          </p>
        </div>

        {/* Promedio de Venta */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Promedio</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(stats?.promedioVenta || 0)}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <i className="fa-solid fa-chart-bar text-2xl"></i>
            </div>
          </div>
          <p className="text-purple-100 text-sm mt-4">
            <i className="fa-solid fa-calculator"></i> Por venta
          </p>
        </div>

        {/* Caja Activa */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Caja</p>
              <p className="text-3xl font-bold mt-2">
                {cajaAbierta
                  ? formatCurrency(cajaAbierta.totalVentas)
                  : "$0.00"}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <i className="fa-solid fa-cash-register text-2xl"></i>
            </div>
          </div>
          <p className="text-orange-100 text-sm mt-4">
            {cajaAbierta ? (
              <>
                <i className="fa-solid fa-circle-check"></i> Abierta
              </>
            ) : (
              <>
                <i className="fa-solid fa-circle-xmark"></i> Cerrada
              </>
            )}
          </p>
        </div>
      </div>

      {/* Métodos de Pago */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Métodos de Pago
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <i className="fa-solid fa-money-bill text-green-600 text-xl"></i>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Efectivo</p>
                  <p className="text-sm text-gray-600">
                    {stats?.ventasEfectivo || 0} ventas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">
                  {stats?.ventasEfectivo || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <i className="fa-solid fa-credit-card text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Transferencia</p>
                  <p className="text-sm text-gray-600">
                    {stats?.ventasTransferencia || 0} ventas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">
                  {stats?.ventasTransferencia || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ventas Recientes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Ventas Recientes
          </h2>
          {recentVentas.length === 0 ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-receipt text-5xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">No hay ventas recientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVentas.map((venta) => (
                <div
                  key={venta.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {venta.items.map((i) => i.producto.nombre).join(", ")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(venta.createdAt)} •{" "}
                      {venta.usuario.nombreUsuario}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-gray-800">
                      {formatCurrency(venta.totalFinal)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        venta.metodoPago === "efectivo"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {venta.metodoPago}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Caja Actual Info */}
      {cajaAbierta && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Caja Abierta - {cajaAbierta.usuario.nombreUsuario}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Monto Inicial</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {formatCurrency(cajaAbierta.montoInicial)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Efectivo</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {formatCurrency(cajaAbierta.ventasEfectivo)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">
                Transferencias
              </p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {formatCurrency(cajaAbierta.ventasTransferencia)}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">
                Total Ventas
              </p>
              <p className="text-2xl font-bold text-orange-700 mt-1">
                {formatCurrency(cajaAbierta.totalVentas)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
