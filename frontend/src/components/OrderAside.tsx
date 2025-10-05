import type { CartItem } from "../App";
import { CartItem as CartItemComponent } from "./CartItem";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ModifyProductModal } from "./ModifyProductModal";
import { PaymentModal } from "./PaymentModal";
import { useFetch, type ApiResponse } from "../hooks";

export type Extra = {
  id: string;
  nombre: string;
  precioExtra: number;
  tipo: string;
  estaqueable: boolean;
};

type OrderAsideProps = {
  carrito: CartItem[];
  onDelete: (cartId: string) => void;
  onClear: () => void;
  onUpdateQuantity: (cartId: string, nuevaCantidad: number) => void;
  onUpdateItem: (itemActualizado: CartItem) => void;
};

const calcularTotal = (item: CartItem) => {
  const extrasTotal = item.extras.reduce(
    (acc, extra) => acc + extra.precioExtra * extra.cantidad,
    0
  );
  return (item.precioBase + extrasTotal) * item.cantidad;
};

const urlExtra = "http://localhost:3000/api/ingredientes/extras";

export const OrderAside = ({
  carrito,
  onDelete,
  onClear,
  onUpdateQuantity,
  onUpdateItem,
}: OrderAsideProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [itemEdit, setItemEdit] = useState<CartItem | null>(null);
  const [ivaPorcentaje, setIvaPorcentaje] = useState(22);
  const { data: extrasDisponibles } = useFetch<ApiResponse<Extra[]>>(urlExtra);

  // Cargar el IVA desde la configuración
  useEffect(() => {
    const fetchIva = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/configuraciones/iva_porcentaje"
        );
        const data = await response.json();
        if (data.success) {
          setIvaPorcentaje(parseFloat(data.data.valor));
        }
      } catch (error) {
        console.error("Error al cargar IVA:", error);
      }
    };

    fetchIva();

    // Escuchar cambios en la configuración
    const handleConfigUpdate = () => {
      fetchIva();
    };

    window.addEventListener("configuracion-updated", handleConfigUpdate);
    return () => {
      window.removeEventListener("configuracion-updated", handleConfigUpdate);
    };
  }, []);

  const subtotal = carrito.reduce((acc, item) => acc + calcularTotal(item), 0);
  const impuesto = subtotal * (ivaPorcentaje / 100);
  const total = subtotal + impuesto;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [carrito]);

  return (
    <aside className="w-80 bg-[var(--color_claro)] text-[var(--color_oscuro)] border-l border-[var(--color_borde)] p-4 flex flex-col max-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color_borde)] pb-4">
        <h2 className="text-[18px] font-bold">Orden Actual</h2>
        <button
          onClick={onClear}
          className="text-sm text-[var(--color_claro)] bg-[var(--color_principal)] font-bold px-2 py-1 rounded hover:cursor-pointer hover:bg-[var(--color_principal_hover)] transition"
        >
          <i className="fa-solid fa-trash-can"></i> Limpiar
        </button>
      </div>

      {/* Lista de items */}
      <div
        ref={scrollRef}
        className="text-[var(--color_oscuro)] mt-4 flex-1 overflow-y-auto pr-2"
      >
        {carrito.length === 0 ? (
          <p>No has agregado ningún producto aún.</p>
        ) : (
          <AnimatePresence>
            <div className="space-y-4 pb-4">
              {carrito.map((item) => (
                <CartItemComponent
                  key={item.cartId}
                  nombre={item.nombre}
                  cantidad={item.cantidad}
                  precioBase={item.precioBase}
                  extras={item.extras}
                  exclusiones={item.exclusiones}
                  permiteExtras={item.permiteExtras}
                  permiteExclusiones={item.permiteExclusiones}
                  total={calcularTotal(item)}
                  onDelete={() => onDelete(item.cartId)}
                  onModify={() => {
                    setItemEdit(item);
                    setModalOpen(true);
                  }}
                  onIncrease={() => {
                    onUpdateQuantity(item.cartId, item.cantidad + 1);
                  }}
                  onDecrease={() => {
                    if (item.cantidad > 1) {
                      onUpdateQuantity(item.cartId, item.cantidad - 1);
                    }
                  }}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Totales */}
      <div className="border-t border-[var(--color_borde)] mt-auto pt-4 text-lg">
        <div className="flex justify-between">
          <p className="text-[var(--color_borde)]">Subtotal:</p>
          <span className="text-[var(--color_oscuro)]">
            $
            {carrito
              .reduce((acc, item) => acc + calcularTotal(item), 0)
              .toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <p className="text-[var(--color_borde)]">
            Impuesto ({ivaPorcentaje}%):
          </p>
          <span className="text-[var(--color_oscuro)]">
            ${impuesto.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="border-t border-[var(--color_borde)] mt-4 pt-4">
        <div className="flex justify-between text-[var(--color_oscuro)] text-xl font-bold">
          <p>Total:</p>
          <span className="text-[var(--color_principal)]">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={() => setPaymentModalOpen(true)}
        disabled={carrito.length === 0}
        className="mt-4 w-full bg-[var(--color_secundario)] text-[var(--color_oscuro)] text-lg font-bold px-4 py-2 rounded hover:cursor-pointer hover:bg-[var(--color_secundario_hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i className="fa-solid fa-credit-card"></i> Finalizar Orden
      </button>

      {/* Modal de modificación */}
      <ModifyProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={itemEdit}
        extrasDisponibles={extrasDisponibles?.data ?? []}
        modificaciones={
          itemEdit?.ingredientes.map((ing) => ing.ingrediente) || []
        }
        permiteExtras={itemEdit?.permiteExtras || false}
        onConfirm={(updated) => {
          onUpdateItem(updated);
          setModalOpen(false);
        }}
      />

      {/* Modal de pago */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        carrito={carrito}
        total={total}
        subtotal={subtotal}
        iva={ivaPorcentaje}
        impuesto={impuesto}
        onSuccess={(ventaData, ticket) => {
          console.log("Venta creada:", ventaData);
          console.log("Ticket:", ticket);
          onClear(); // Limpiar carrito después de venta exitosa
        }}
      />
    </aside>
  );
};
