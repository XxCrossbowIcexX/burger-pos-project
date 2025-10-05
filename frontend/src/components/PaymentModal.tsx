// src/components/PaymentModal.tsx
import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import type { CartItem } from "../App";
import { useAuth } from "../context/AuthContext";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrito: CartItem[];
  total: number;
  subtotal: number;
  iva: number;
  impuesto: number;
  onSuccess: (ventaData: any, ticket: string) => void;
}

export const PaymentModal = ({
  isOpen,
  onClose,
  carrito,
  total,
  subtotal,
  iva,
  impuesto,
  onSuccess,
}: PaymentModalProps) => {
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "transferencia">(
    "efectivo"
  );
  const [tipoEntrega, setTipoEntrega] = useState<
    "local" | "paraLlevar" | "domicilio"
  >("local");
  const [montoPagado, setMontoPagado] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [cajaId, setCajaId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const cambio = metodoPago === "efectivo" ? montoPagado - total : 0;

  // Obtener caja abierta del usuario
  useEffect(() => {
    const obtenerCajaAbierta = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(
          `http://localhost:3000/api/cajas/abierta?usuarioId=${user.id}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCajaId(data.data.id);
          }
        }
      } catch (error) {
        console.error("Error al obtener caja abierta:", error);
      }
    };

    if (isOpen) {
      obtenerCajaAbierta();
    }
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (isOpen && metodoPago === "efectivo" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, metodoPago]);

  const handleSubmit = async () => {
    // Validaciones
    if (carrito.length === 0) {
      await Swal.fire({
        title: "Error",
        text: "El carrito está vacío",
        icon: "error",
      });
      return;
    }

    if (!cajaId) {
      await Swal.fire({
        title: "Caja no abierta",
        text: "Por favor, abra una caja antes de procesar ventas",
        icon: "warning",
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (metodoPago === "efectivo" && montoPagado < total) {
      await Swal.fire({
        title: "Monto insuficiente",
        text: `El monto pagado debe ser mayor o igual a $${total.toFixed(2)}`,
        icon: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      // Preparar items para la venta
      const items = carrito.map((item) => {
        const extrasTotal = item.extras.reduce(
          (acc, extra) => acc + extra.precioExtra * extra.cantidad,
          0
        );
        const precioUnitario = item.precioBase + extrasTotal;
        const subtotal = precioUnitario * item.cantidad;

        // Obtener IDs de ingredientes excluidos (las exclusiones están como nombres, necesitamos IDs)
        const exclusionesIds = item.ingredientes
          .filter((ing) => item.exclusiones.includes(ing.ingrediente.nombre))
          .map((ing) => ing.ingrediente.id);

        return {
          productoId: item.productId,
          cantidad: item.cantidad,
          precioUnitario,
          subtotal,
          extras: item.extras.map((extra) => ({
            ingredienteId: extra.id,
            cantidad: extra.cantidad,
            precioExtra: parseFloat(extra.precioExtra.toString()),
          })),
          exclusiones: exclusionesIds,
          notas: "",
        };
      });

      // Crear venta
      const response = await fetch("http://localhost:3000/api/ventas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: user?.id.toString(),
          cajaId: cajaId,
          items,
          totalBase: subtotal,
          impuesto,
          totalFinal: total,
          metodoPago,
          tipoEntrega,
          montoPagado: metodoPago === "efectivo" ? montoPagado : total,
          cambio: metodoPago === "efectivo" ? cambio : 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        await Swal.fire({
          title: "¡Venta Exitosa!",
          html: `
            <div class="text-left">
              <p><strong>Total:</strong> $${total.toFixed(2)}</p>
              ${
                metodoPago === "efectivo"
                  ? `
                <p><strong>Pagado:</strong> $${montoPagado.toFixed(2)}</p>
                <p><strong>Cambio:</strong> $${cambio.toFixed(2)}</p>
              `
                  : ""
              }
              <p class="mt-3">¿Deseas imprimir el ticket?</p>
            </div>
          `,
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "Imprimir Ticket",
          cancelButtonText: "Cerrar",
          confirmButtonColor: "#10b981",
        }).then((result) => {
          if (result.isConfirmed) {
            // Imprimir ticket
            imprimirTicket(data.ticket);
          }

          // Disparar eventos para actualizar componentes
          window.dispatchEvent(
            new CustomEvent("nueva-orden", {
              detail: data.data,
            })
          );
          window.dispatchEvent(new Event("ventaCreada"));

          onSuccess(data.data, data.ticket);
          onClose();
        });
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "Error al procesar la venta"
        );
      }
    } catch (error: any) {
      console.error("Error:", error);
      await Swal.fire({
        title: "Error",
        text: error.message || "Error al procesar la venta",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const imprimirTicket = (ticket: string) => {
    const ventanaImpresion = window.open("", "_blank", "width=300,height=600");
    if (ventanaImpresion) {
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Ticket de Venta</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                margin: 10px;
                white-space: pre-wrap;
              }
              @media print {
                body {
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            ${ticket}
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
      ventanaImpresion.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000066] z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Finalizar Pago</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:cursor-pointer"
              disabled={loading}
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>

          {/* Resumen */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Impuesto ({iva}%):</span>
              <span className="font-medium">${impuesto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold text-green-600">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Tipo de Entrega */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Entrega
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTipoEntrega("local")}
                className={`p-3 border-2 rounded-lg font-medium transition hover:cursor-pointer ${
                  tipoEntrega === "local"
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                disabled={loading}
              >
                <i className="fa-solid fa-utensils text-xl mb-1"></i>
                <div className="text-sm">Local</div>
              </button>
              <button
                onClick={() => setTipoEntrega("paraLlevar")}
                className={`p-3 border-2 rounded-lg font-medium transition hover:cursor-pointer ${
                  tipoEntrega === "paraLlevar"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                disabled={loading}
              >
                <i className="fa-solid fa-bag-shopping text-xl mb-1"></i>
                <div className="text-sm">Para Llevar</div>
              </button>
              <button
                onClick={() => setTipoEntrega("domicilio")}
                className={`p-3 border-2 rounded-lg font-medium transition hover:cursor-pointer ${
                  tipoEntrega === "domicilio"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                disabled={loading}
              >
                <i className="fa-solid fa-motorcycle text-xl mb-1"></i>
                <div className="text-sm">Domicilio</div>
              </button>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setMetodoPago("efectivo");
                  setMontoPagado(0);
                }}
                className={`p-4 border-2 rounded-lg font-medium transition hover:cursor-pointer ${
                  metodoPago === "efectivo"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                disabled={loading}
              >
                <i className="fa-solid fa-money-bill-wave text-2xl mb-2"></i>
                <div>Efectivo</div>
              </button>
              <button
                onClick={() => setMetodoPago("transferencia")}
                className={`p-4 border-2 rounded-lg font-medium transition hover:cursor-pointer ${
                  metodoPago === "transferencia"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                disabled={loading}
              >
                <i className="fa-solid fa-credit-card text-2xl mb-2"></i>
                <div>Tarjeta</div>
              </button>
            </div>
          </div>

          {/* Monto pagado (solo efectivo) */}
          {metodoPago === "efectivo" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Pagado
              </label>
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                min="0"
                value={montoPagado || ""}
                onChange={(e) =>
                  setMontoPagado(parseFloat(e.target.value) || 0)
                }
                className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
                disabled={loading}
              />

              {/* Botones rápidos */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[200, 500, 1000, 2000].map((valor) => (
                  <button
                    key={valor}
                    onClick={() => setMontoPagado(valor)}
                    className="py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded font-medium text-sm hover:cursor-pointer"
                    disabled={loading}
                  >
                    ${valor}
                  </button>
                ))}
              </div>

              {/* Cambio */}
              {montoPagado > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-yellow-800">Cambio:</span>
                    <span
                      className={`text-xl font-bold ${
                        cambio >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ${cambio.toFixed(2)}
                    </span>
                  </div>
                  {cambio < 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Monto insuficiente
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium hover:cursor-pointer"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
              disabled={
                loading || (metodoPago === "efectivo" && montoPagado < total)
              }
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Procesando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check mr-2"></i>
                  Confirmar Pago
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
