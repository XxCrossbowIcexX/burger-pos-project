// src/pages/admin/CajaPage.tsx
import React, { useState } from "react";
import { useFetch, type ApiResponse } from "../../hooks/useFetch";
import Swal from "sweetalert2";

interface Usuario {
  id: string;
  nombreUsuario: string;
  rol: string;
}

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
  activo: boolean;
  usuario: Usuario;
  _count?: {
    ventas: number;
  };
}

type CajaFormData = {
  usuarioId: string;
  montoInicial: number;
};

const url = "http://localhost:3000/api/cajas";

export default function CajaPage() {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<CajaFormData>({
    usuarioId: "",
    montoInicial: 0,
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const {
    data: cajasResponse,
    loading,
    refetch,
  } = useFetch<ApiResponse<Caja[]>>(`${url}?activo=all`);

  const { data: usuariosResponse } = useFetch<ApiResponse<Usuario[]>>(
    "http://localhost:3000/api/usuarios?activo=all"
  );

  const cajas = (cajasResponse as ApiResponse<Caja[]>)?.data;
  const usuarios = (usuariosResponse as ApiResponse<Usuario[]>)?.data;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.usuarioId) {
      setError("Debe seleccionar un usuario");
      return;
    }

    if (formData.montoInicial <= 0) {
      setError("El monto inicial debe ser mayor a 0");
      return;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await Swal.fire({
          title: "¡Caja Abierta!",
          text: "La caja se ha abierto correctamente",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        setShowForm(false);
        resetForm();
        refetch();
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Error al abrir la caja");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión. Inténtalo de nuevo.");
    }
  };

  const handleCerrarCaja = async (caja: Caja) => {
    const montoInicial = Number(caja.montoInicial);
    const ventasEfectivo = Number(caja.ventasEfectivo);
    const ventasTransferencia = Number(caja.ventasTransferencia);
    const ingresosExtra = Number(caja.ingresosExtra || 0);
    const retirosEfectivo = Number(caja.retirosEfectivo || 0);
    const montoEsperado = montoInicial + ventasEfectivo + ingresosExtra - retirosEfectivo;

    const { value: montoFinal } = await Swal.fire({
      title: "Cerrar Caja",
      html: `
        <p class="mb-4">Ingresa el monto final en efectivo:</p>
        <div class="text-left mb-2">
          <strong>Monto Inicial:</strong> $${montoInicial.toFixed(2)}
        </div>
        <div class="text-left mb-2">
          <strong>Ventas Efectivo:</strong> $${ventasEfectivo.toFixed(2)}
        </div>
        <div class="text-left mb-2">
          <strong>Ventas Transferencia:</strong> $${ventasTransferencia.toFixed(2)}
        </div>
        ${ingresosExtra > 0 ? `<div class="text-left mb-2" style="color: #059669;"><strong>Ingresos Extra:</strong> +$${ingresosExtra.toFixed(2)}</div>` : ''}
        ${retirosEfectivo > 0 ? `<div class="text-left mb-2" style="color: #dc2626;"><strong>Retiros:</strong> -$${retirosEfectivo.toFixed(2)}</div>` : ''}
        <hr class="my-2">
        <div class="text-left mb-4">
          <strong>Esperado en Caja:</strong> $${montoEsperado.toFixed(2)}
        </div>
      `,
      input: "number",
      inputLabel: "Monto Final en Efectivo",
      inputPlaceholder: "0.00",
      inputAttributes: {
        min: "0",
        step: "0.01",
      },
      showCancelButton: true,
      confirmButtonText: "Cerrar Caja",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      inputValidator: (value) => {
        if (!value || parseFloat(value) < 0) {
          return "Debes ingresar un monto válido";
        }
        return null;
      },
    });

    if (montoFinal !== undefined) {
      try {
        const response = await fetch(`${url}/${caja.id}/cerrar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ montoFinal: parseFloat(montoFinal) }),
        });

        if (response.ok) {
          const data = await response.json();
          const diferencia = data.data.diferencia;

          await Swal.fire({
            title: "¡Caja Cerrada!",
            html: `
              <div class="text-left">
                <p class="mb-2"><strong>Monto Final:</strong> $${parseFloat(
                  montoFinal
                ).toFixed(2)}</p>
                <p class="mb-2"><strong>Diferencia:</strong> <span class="${
                  diferencia >= 0 ? "text-green-600" : "text-red-600"
                }">$${Number(diferencia).toFixed(2)}</span></p>
                <p class="mb-2"><strong>Total Ventas:</strong> $${Number(
                  data.data.totalVentas
                ).toFixed(2)}</p>
              </div>
            `,
            icon: diferencia >= 0 ? "success" : "warning",
            confirmButtonText: "OK",
          });
          refetch();
        } else {
          const errorData = await response.json();
          Swal.fire({
            title: "Error",
            text: errorData.error?.message || "Error al cerrar la caja",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          title: "Error",
          text: "Error de conexión al cerrar la caja",
          icon: "error",
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar caja?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${url}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await Swal.fire({
          title: "¡Eliminado!",
          text: "Caja eliminada correctamente",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        refetch();
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: "Error",
          text: errorData.error?.message || "Error al eliminar la caja",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: "Error de conexión al eliminar la caja",
        icon: "error",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      usuarioId: "",
      montoInicial: 0,
    });
    setError("");
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gestión de Caja</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            resetForm();
            setError("");
          }}
          className="bg-[var(--color_principal)] text-[var(--color_claro)] px-4 py-2 rounded-lg hover:bg-[var(--color_principal_hover)] hover:cursor-pointer transition"
        >
          <i
            className={`fa-solid ${showForm ? "fa-minus" : "fa-plus"} mr-2`}
          ></i>
          {showForm ? "Cancelar" : "Abrir Nueva Caja"}
        </button>
      </div>

      {/* Formulario expandible */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="text-xl font-bold mb-4">Abrir Nueva Caja</h3>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario *
                </label>
                <select
                  value={formData.usuarioId}
                  onChange={(e) =>
                    setFormData({ ...formData, usuarioId: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar usuario</option>
                  {usuarios
                    ?.filter((u) => u.rol !== "cliente")
                    ?.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombreUsuario} ({usuario.rol})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Inicial *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.montoInicial}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      montoInicial: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="bg-[var(--color_exito)] text-white px-4 py-2 rounded hover:opacity-80 hover:cursor-pointer transition"
              >
                <i className="fa-solid fa-save mr-2"></i>
                Abrir Caja
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:opacity-80 hover:cursor-pointer transition"
              >
                <i className="fa-solid fa-times mr-2"></i>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Cargando cajas...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Fecha Apertura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Monto Inicial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cajas?.map((caja) => {
                const isExpanded = expandedRows.has(caja.id);
                return (
                  <React.Fragment key={caja.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleRow(caja.id)}
                          className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                          <i
                            className={`fa-solid ${
                              isExpanded ? "fa-minus" : "fa-plus"
                            } text-sm`}
                          ></i>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {caja.usuario.nombreUsuario}
                        </div>
                        <div className="text-xs text-gray-500">
                          {caja.usuario.rol}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {formatDate(caja.fechaApertura)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                        ${Number(caja.montoInicial).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            caja.estado === "abierta"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {caja.estado === "abierta" ? "Abierta" : "Cerrada"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {caja.estado === "abierta" ? (
                          <button
                            onClick={() => handleCerrarCaja(caja)}
                            className="text-orange-600 hover:text-orange-900 mr-3 cursor-pointer"
                            title="Cerrar caja"
                          >
                            <i className="fa-solid fa-lock"></i>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(caja.id)}
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                            title="Eliminar"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div className="md:hidden">
                              <span className="font-medium text-gray-700">
                                Fecha Apertura:
                              </span>
                              <span className="ml-2 text-gray-900">
                                {formatDate(caja.fechaApertura)}
                              </span>
                            </div>
                            <div className="lg:hidden">
                              <span className="font-medium text-gray-700">
                                Monto Inicial:
                              </span>
                              <span className="ml-2 text-gray-900">
                                ${Number(caja.montoInicial).toFixed(2)}
                              </span>
                            </div>
                            <div className="xl:hidden">
                              <span className="font-medium text-gray-700">
                                Estado:
                              </span>
                              <span
                                className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  caja.estado === "abierta"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {caja.estado === "abierta"
                                  ? "Abierta"
                                  : "Cerrada"}
                              </span>
                            </div>
                            {caja.estado === "cerrada" && (
                              <>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Fecha Cierre:
                                  </span>
                                  <span className="ml-2 text-gray-900">
                                    {caja.fechaCierre
                                      ? formatDate(caja.fechaCierre)
                                      : "-"}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Monto Final:
                                  </span>
                                  <span className="ml-2 text-gray-900">
                                    ${Number(caja.montoFinal || 0).toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Total Ventas:
                                  </span>
                                  <span className="ml-2 text-gray-900">
                                    ${Number(caja.totalVentas).toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Efectivo:
                                  </span>
                                  <span className="ml-2 text-gray-900">
                                    ${Number(caja.ventasEfectivo).toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Transferencia:
                                  </span>
                                  <span className="ml-2 text-gray-900">
                                    $
                                    {Number(caja.ventasTransferencia).toFixed(
                                      2
                                    )}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Diferencia:
                                  </span>
                                  <span
                                    className={`ml-2 font-semibold ${
                                      (caja.diferencia || 0) >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    ${Number(caja.diferencia || 0).toFixed(2)}
                                  </span>
                                </div>
                              </>
                            )}
                            <div>
                              <span className="font-medium text-gray-700">
                                Ventas:
                              </span>
                              <span className="ml-2 text-gray-900">
                                {caja._count?.ventas || 0}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }) || []}
            </tbody>
          </table>

          {cajas?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay cajas registradas
            </div>
          )}
        </div>
      )}
    </div>
  );
}
