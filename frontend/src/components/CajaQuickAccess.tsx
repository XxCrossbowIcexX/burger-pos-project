import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

interface Caja {
  id: string;
  usuarioId: string;
  montoInicial: number;
  montoFinal: number | null;
  ventasEfectivo: number;
  ventasTransferencia: number;
  totalVentas: number;
  ingresosExtra: number;
  retirosEfectivo: number;
  diferencia: number | null;
  estado: "abierta" | "cerrada";
  fechaApertura: string;
  fechaCierre: string | null;
}

export const CajaQuickAccess = () => {
  const { user } = useAuth();
  const [cajaAbierta, setCajaAbierta] = useState<Caja | null>(null);
  const [loading, setLoading] = useState(false);

  const obtenerCajaAbierta = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/cajas/abierta?usuarioId=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setCajaAbierta(data.data);
      } else {
        setCajaAbierta(null);
      }
    } catch (error) {
      console.error("Error al obtener caja:", error);
    }
  };

  useEffect(() => {
    obtenerCajaAbierta();

    // Escuchar eventos de venta para actualizar la caja
    const handleVentaCreada = () => {
      obtenerCajaAbierta();
    };

    window.addEventListener("ventaCreada", handleVentaCreada);

    return () => {
      window.removeEventListener("ventaCreada", handleVentaCreada);
    };
  }, [user?.id]);

  const abrirCaja = async () => {
    const { value: montoInicial } = await Swal.fire({
      title: "Abrir Caja",
      input: "number",
      inputLabel: "Monto inicial en caja",
      inputPlaceholder: "0.00",
      showCancelButton: true,
      confirmButtonText: "Abrir",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value || parseFloat(value) < 0) {
          return "Debe ingresar un monto válido";
        }
      },
    });

    if (montoInicial) {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3000/api/cajas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuarioId: user?.id,
            montoInicial: parseFloat(montoInicial),
          }),
        });

        if (response.ok) {
          await Swal.fire({
            icon: "success",
            title: "Caja abierta",
            text: `Caja abierta con $${parseFloat(montoInicial).toFixed(2)}`,
            timer: 2000,
            showConfirmButton: false,
          });
          obtenerCajaAbierta();
        } else {
          const error = await response.json();
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.error?.message || "Error al abrir caja",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al abrir caja",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const cerrarCaja = async () => {
    if (!cajaAbierta) return;

    const montoInicial = parseFloat(cajaAbierta.montoInicial.toString());
    const ventasEfectivo = parseFloat(cajaAbierta.ventasEfectivo.toString());
    const ventasTransferencia = parseFloat(cajaAbierta.ventasTransferencia.toString());
    const ingresosExtra = parseFloat(cajaAbierta.ingresosExtra.toString());
    const retirosEfectivo = parseFloat(cajaAbierta.retirosEfectivo.toString());
    const montoEsperado = montoInicial + ventasEfectivo + ingresosExtra - retirosEfectivo;

    const montoFisico = await Swal.fire({
      title: "Cerrar Caja",
      html: `
        <div class="text-left mb-4">
          <p><strong>Monto Inicial:</strong> $${montoInicial.toFixed(2)}</p>
          <p><strong>Ventas Efectivo:</strong> $${ventasEfectivo.toFixed(2)}</p>
          <p><strong>Ventas Transferencia:</strong> $${ventasTransferencia.toFixed(2)}</p>
          ${ingresosExtra > 0 ? `<p class="text-emerald-600"><strong>Ingresos Extra:</strong> +$${ingresosExtra.toFixed(2)}</p>` : ''}
          ${retirosEfectivo > 0 ? `<p class="text-red-600"><strong>Retiros:</strong> -$${retirosEfectivo.toFixed(2)}</p>` : ''}
          <hr class="my-2">
          <p><strong>Monto Esperado:</strong> $${montoEsperado.toFixed(2)}</p>
        </div>
      `,
      input: "number",
      inputLabel: "Monto físico en caja",
      inputPlaceholder: "0.00",
      showCancelButton: true,
      confirmButtonText: "Cerrar Caja",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value || parseFloat(value) < 0) {
          return "Debe ingresar el monto físico";
        }
      },
    });

    if (montoFisico.value) {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/api/cajas/${cajaAbierta.id}/cerrar`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              montoFinal: parseFloat(montoFisico.value),
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const diferencia = data.data.diferencia || 0;

          await Swal.fire({
            icon: diferencia === 0 ? "success" : "warning",
            title: "Caja cerrada",
            html: `
              <p>Diferencia: <strong>$${parseFloat(
                diferencia.toString()
              ).toFixed(2)}</strong></p>
              ${
                diferencia !== 0
                  ? `<p class="text-sm text-gray-600 mt-2">${
                      diferencia > 0 ? "Sobra dinero" : "Falta dinero"
                    }</p>`
                  : ""
              }
            `,
          });
          setCajaAbierta(null);
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al cerrar caja",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const ingresarDinero = async () => {
    if (!cajaAbierta) return;

    const { value: formValues } = await Swal.fire({
      title: "Ingresar Dinero",
      html: `
        <input id="monto" type="number" class="swal2-input" placeholder="Monto">
        <input id="concepto" type="text" class="swal2-input" placeholder="Concepto">
      `,
      showCancelButton: true,
      confirmButtonText: "Ingresar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const monto = (document.getElementById("monto") as HTMLInputElement)
          .value;
        const concepto = (
          document.getElementById("concepto") as HTMLInputElement
        ).value;
        if (!monto || parseFloat(monto) <= 0) {
          Swal.showValidationMessage("Debe ingresar un monto válido");
        }
        return { monto: parseFloat(monto), concepto };
      },
    });

    if (formValues) {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3000/api/movimientos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cajaId: cajaAbierta.id,
            tipo: "ingreso",
            monto: formValues.monto,
            concepto: formValues.concepto,
          }),
        });

        if (response.ok) {
          await Swal.fire({
            icon: "success",
            title: "Dinero ingresado",
            text: `$${formValues.monto.toFixed(2)} - ${formValues.concepto}`,
            timer: 2000,
          });
          obtenerCajaAbierta();
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error al registrar ingreso",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al registrar ingreso",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const retirarDinero = async () => {
    if (!cajaAbierta) return;

    const { value: formValues } = await Swal.fire({
      title: "Retirar Dinero",
      html: `
        <input id="monto" type="number" class="swal2-input" placeholder="Monto">
        <input id="concepto" type="text" class="swal2-input" placeholder="Concepto">
      `,
      showCancelButton: true,
      confirmButtonText: "Retirar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const monto = (document.getElementById("monto") as HTMLInputElement)
          .value;
        const concepto = (
          document.getElementById("concepto") as HTMLInputElement
        ).value;
        if (!monto || parseFloat(monto) <= 0) {
          Swal.showValidationMessage("Debe ingresar un monto válido");
        }
        return { monto: parseFloat(monto), concepto };
      },
    });

    if (formValues) {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3000/api/movimientos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cajaId: cajaAbierta.id,
            tipo: "retiro",
            monto: formValues.monto,
            concepto: formValues.concepto,
          }),
        });

        if (response.ok) {
          await Swal.fire({
            icon: "success",
            title: "Dinero retirado",
            text: `$${formValues.monto.toFixed(2)} - ${formValues.concepto}`,
            timer: 2000,
          });
          obtenerCajaAbierta();
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error al registrar retiro",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al registrar retiro",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-[var(--color_claro)] rounded-lg shadow-lg p-2 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-cash-register text-[var(--color_principal)] text-xl"></i>
          <h3 className="font-bold text-gray-800">Caja Rápida</h3>
        </div>
        {cajaAbierta && (
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
            <i className="fa-solid fa-circle-check mr-1"></i>
            Abierta
          </span>
        )}
      </div>

      {cajaAbierta ? (
        <div>
          {/* Resumen de caja */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Monto Inicial:</span>
              <span className="text-[var(--color_secundario)] font-semibold">
                ${parseFloat(cajaAbierta.montoInicial.toString()).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Ventas Efectivo:</span>
              <span className="font-semibold text-green-600">
                ${parseFloat(cajaAbierta.ventasEfectivo.toString()).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Transferencias:</span>
              <span className="font-semibold text-blue-600">
                $
                {parseFloat(cajaAbierta.ventasTransferencia.toString()).toFixed(
                  2
                )}
              </span>
            </div>
            {cajaAbierta.ingresosExtra > 0 && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Ingresos Extra:</span>
                <span className="font-semibold text-emerald-600">
                  +${parseFloat(cajaAbierta.ingresosExtra.toString()).toFixed(2)}
                </span>
              </div>
            )}
            {cajaAbierta.retirosEfectivo > 0 && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Retiros:</span>
                <span className="font-semibold text-red-600">
                  -${parseFloat(cajaAbierta.retirosEfectivo.toString()).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-800 font-bold">Total en Caja:</span>
              <span className="font-bold text-[var(--color_principal)]">
                ${(
                  parseFloat(cajaAbierta.montoInicial.toString()) +
                  parseFloat(cajaAbierta.ventasEfectivo.toString()) +
                  parseFloat(cajaAbierta.ingresosExtra.toString()) -
                  parseFloat(cajaAbierta.retirosEfectivo.toString())
                ).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={ingresarDinero}
              disabled={loading}
              className="bg-[var(--color_exito)] hover:bg-[var(--color_exito_hover)] text-[var(--color_claro)] py-2 px-3 rounded-lg text-sm font-semibold transition disabled:opacity-50 hover:cursor-pointer"
            >
              <i className="fa-solid fa-plus mr-1"></i>
              Ingresar
            </button>
            <button
              onClick={retirarDinero}
              disabled={loading}
              className="bg-[var(--color_secundario)] hover:bg-[var(--color_secundario_hover)] text-[var(--color_oscuro)] py-2 px-3 rounded-lg text-sm font-semibold transition disabled:opacity-50 hover:cursor-pointer"
            >
              <i className="fa-solid fa-minus mr-1"></i>
              Retirar
            </button>
            <button
              onClick={cerrarCaja}
              disabled={loading}
              className="col-span-2 bg-[var(--color_principal)] hover:bg-[var(--color_principal_hover)] text-[var(--color_claro)] py-2 px-3 rounded-lg text-sm font-semibold transition disabled:opacity-50 hover:cursor-pointer"
            >
              <i className="fa-solid fa-lock mr-1"></i>
              Cerrar Caja
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={abrirCaja}
          disabled={loading}
          className="w-full bg-[var(--color_principal)] hover:bg-[var(--color_principal_hover)] text-[var(--color_claro)] py-3 rounded-lg font-semibold transition disabled:opacity-50 hover:cursor-pointer"
        >
          <i className="fa-solid fa-lock-open mr-2"></i>
          Abrir Caja
        </button>
      )}
    </div>
  );
};
