import { useState, useEffect } from "react";
import { useFetch } from "../hooks/useFetch";

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Venta {
  id: string;
  totalBase: string;
  impuesto: string;
  totalFinal: string;
  metodoPago: string;
  estado: string;
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

export default function SalesHistoryModal({
  isOpen,
  onClose,
}: SalesHistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: ventasResponse,
    loading,
    refetch,
  } = useFetch<{ success: boolean; data: Venta[] }>("/api/ventas");

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter sales from last 24 hours
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const ventasData = ventasResponse?.data || [];

  const recentSales = ventasData.filter((venta) => {
    const ventaDate = new Date(venta.createdAt);
    return ventaDate >= twentyFourHoursAgo;
  });

  // Filter by search term (ticket number)
  const filteredSales = searchTerm
    ? recentSales.filter((venta) =>
        venta.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : recentSales;

  const handleReprint = async (ventaId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/ventas/${ventaId}/ticket`
      );
      const data = await response.json();

      if (data.success) {
        // Create a new window for printing
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Ticket #${ventaId.substring(0, 11)}</title>
                <style>
                  body {
                    font-family: 'Courier New', monospace;
                    white-space: pre;
                    font-size: 12px;
                    margin: 20px;
                  }
                </style>
              </head>
              <body>${data.ticket}</body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error("Error al reimprimir ticket:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-[#00000066] z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Historial de Ventas (24h)
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl hover:cursor-pointer"
            >
              ×
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por número de ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <i className="fa-solid fa-search absolute right-3 top-3 text-gray-400"></i>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-spinner fa-spin text-3xl text-gray-400"></i>
              <p className="mt-2 text-gray-500">Cargando ventas...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-receipt text-5xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">
                {searchTerm
                  ? "No se encontraron ventas con ese número de ticket"
                  : "No hay ventas en las últimas 24 horas"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((venta) => (
                <div
                  key={venta.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Sale Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          #{venta.id.substring(0, 11)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            venta.estado === "completada"
                              ? "bg-green-100 text-green-800"
                              : venta.estado === "cancelada"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {venta.estado.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(venta.createdAt)}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mb-1">
                        <i className="fa-solid fa-user w-4"></i> Atendido por:{" "}
                        <span className="font-medium">
                          {venta.usuario.nombreUsuario}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600">
                        <i className="fa-solid fa-shopping-bag w-4"></i>{" "}
                        {venta.items.length} producto(s):{" "}
                        {venta.items
                          .map(
                            (item) =>
                              `${item.cantidad}x ${item.producto.nombre}`
                          )
                          .join(", ")}
                      </div>
                    </div>

                    {/* Payment & Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Total</div>
                        <div className="text-xl font-bold text-gray-800">
                          ${parseFloat(venta.totalFinal).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {venta.metodoPago}
                        </div>
                      </div>

                      <button
                        onClick={() => handleReprint(venta.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 hover:cursor-pointer"
                      >
                        <i className="fa-solid fa-print"></i>
                        Reimprimir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Total de ventas: <strong>{filteredSales.length}</strong>
            </span>
            <span>
              Total facturado: $
              <strong>
                {filteredSales
                  .reduce((sum, venta) => sum + parseFloat(venta.totalFinal), 0)
                  .toFixed(2)}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
