import { useState } from "react";
import { useFetch, type ApiResponse } from "../../hooks/useFetch";
import Swal from "sweetalert2";

interface Ingrediente {
  id: string;
  nombre: string;
  tipo: "pan" | "carne" | "queso" | "vegetal" | "salsa";
  estaqueable: boolean;
  puedeSerExtra: boolean;
  precioExtra: number;
  descripcion?: string;
  activo: boolean;
}

export default function IngredientsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingIngredient, setEditingIngredient] =
    useState<Ingrediente | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "vegetal" as Ingrediente["tipo"],
    estaqueable: false,
    puedeSerExtra: false,
    precioExtra: 0,
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
    data: ingredientesResponse,
    loading,
    refetch,
  } = useFetch<ApiResponse<Ingrediente[]>>("/api/ingredientes?activo=all");
  const ingredientes = (ingredientesResponse as ApiResponse<Ingrediente[]>)
    ?.data;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const url = editingIngredient
      ? `/api/ingredientes/${editingIngredient.id}`
      : "/api/ingredientes";

    const method = editingIngredient ? "PUT" : "POST";

    const submitData = {
      ...formData,
      precioExtra: formData.puedeSerExtra ? formData.precioExtra : 0,
      descripcion: "",
    };

    try {
      const response = await fetch(`http://localhost:3000${url}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingIngredient(null);
        resetForm();
        refetch();
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Error al guardar el ingrediente");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión. Inténtalo de nuevo.");
    }
  };

  const handleEdit = (ingrediente: Ingrediente) => {
    setEditingIngredient(ingrediente);
    setFormData({
      nombre: ingrediente.nombre,
      tipo: ingrediente.tipo,
      estaqueable: ingrediente.estaqueable,
      puedeSerExtra: ingrediente.puedeSerExtra,
      precioExtra: ingrediente.precioExtra || 0,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (ingrediente: Ingrediente) => {
    const result = await Swal.fire({
      title: ingrediente.activo
        ? "¿Desactivar ingrediente?"
        : "¿Activar ingrediente?",
      html: `
        <p>¿Estás seguro de que deseas <strong>${
          ingrediente.activo ? "desactivar" : "activar"
        }</strong> el ingrediente:</p>
        <p class="text-lg font-semibold mt-2">${ingrediente.nombre}</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: ingrediente.activo ? "#d33" : "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: ingrediente.activo ? "Sí, desactivar" : "Sí, activar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/ingredientes/${ingrediente.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ activo: !ingrediente.activo }),
          }
        );

        if (response.ok) {
          await Swal.fire({
            title: "¡Actualizado!",
            text: `Ingrediente ${
              ingrediente.activo ? "desactivado" : "activado"
            } correctamente`,
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
          refetch();
        } else {
          const errorData = await response.json();
          Swal.fire({
            title: "Error",
            text:
              errorData.error?.message || "Error al actualizar el ingrediente",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          title: "Error",
          text: "Error de conexión al actualizar el ingrediente",
          icon: "error",
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar ingrediente?",
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
      const response = await fetch(
        `http://localhost:3000/api/ingredientes/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await Swal.fire({
          title: "¡Eliminado!",
          text: "Ingrediente eliminado correctamente",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        refetch();
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: "Error",
          text: errorData.error?.message || "Error al eliminar el ingrediente",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: "Error de conexión al eliminar el ingrediente",
        icon: "error",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      tipo: "vegetal",
      estaqueable: false,
      puedeSerExtra: false,
      precioExtra: 0,
    });
    setError("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIngredient(null);
    resetForm();
  };

  const getTipoColor = (tipo: string) => {
    const colors = {
      pan: "bg-yellow-100 text-yellow-800",
      carne: "bg-red-100 text-red-800",
      queso: "bg-orange-100 text-orange-800",
      vegetal: "bg-green-100 text-green-800",
      salsa: "bg-purple-100 text-purple-800",
    };
    return colors[tipo as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Ingredientes</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingIngredient(null);
            resetForm();
            setError("");
          }}
          className="bg-[var(--color_principal)] text-[var(--color_claro)] px-4 py-2 rounded-lg hover:bg-[var(--color_principal_hover)] hover:cursor-pointer transition"
        >
          <i
            className={`fa-solid ${showForm ? "fa-minus" : "fa-plus"} mr-2`}
          ></i>
          {showForm ? "Cancelar" : "Nuevo Ingrediente"}
        </button>
      </div>

      {/* Formulario expandible */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="text-xl font-bold mb-4">
            {editingIngredient ? "Editar Ingrediente" : "Nuevo Ingrediente"}
          </h3>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Ej: Lechuga, Carne, Pan integral..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo: e.target.value as Ingrediente["tipo"],
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pan">🍞 Pan</option>
                  <option value="carne">🥩 Carne</option>
                  <option value="queso">🧀 Queso</option>
                  <option value="vegetal">🥬 Vegetal</option>
                  <option value="salsa">🥫 Salsa</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.puedeSerExtra}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        puedeSerExtra: e.target.checked,
                      })
                    }
                    className="mr-3 w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Puede ser extra</div>
                    <div className="text-sm text-gray-500">
                      Los clientes pueden agregarlo como extra
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.estaqueable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estaqueable: e.target.checked,
                      })
                    }
                    className="mr-3 w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Estaqueable</div>
                    <div className="text-sm text-gray-500">
                      Se puede seleccionar cantidad (2x, 3x, etc.)
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {formData.puedeSerExtra && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Extra
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precioExtra}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precioExtra: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 2.50"
                />
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="bg-[var(--color_exito)] text-white px-4 py-2 rounded hover:opacity-80 hover:cursor-pointer transition"
              >
                <i className="fa-solid fa-save mr-2"></i>
                Guardar
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
        <div className="text-center py-8">Cargando ingredientes...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Precio Extra
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
              {ingredientes?.map((ingrediente) => {
                const isExpanded = expandedRows.has(ingrediente.id);
                return (
                  <>
                    <tr key={ingrediente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleRow(ingrediente.id)}
                          className="text-gray-500 hover:text-gray-700 focus:outline-none hover:cursor-pointer"
                        >
                          <i
                            className={`fa-solid ${
                              isExpanded ? "fa-minus" : "fa-plus"
                            } text-sm`}
                          ></i>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ingrediente.nombre}
                          </div>
                          {ingrediente.descripcion && (
                            <div className="text-sm text-gray-500">
                              {ingrediente.descripcion}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(
                            ingrediente.tipo
                          )}`}
                        >
                          {ingrediente.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                        {ingrediente.puedeSerExtra
                          ? `$${ingrediente.precioExtra}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                        <button
                          onClick={() => handleToggleActive(ingrediente)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full hover:opacity-70 transition cursor-pointer ${
                            ingrediente.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                          title={`Click para ${
                            ingrediente.activo ? "desactivar" : "activar"
                          }`}
                        >
                          {ingrediente.activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(ingrediente)}
                          className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                        >
                          <i className="fa-solid fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(ingrediente.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="md:hidden">
                              <span className="font-medium text-gray-700">
                                Tipo:
                              </span>
                              <span
                                className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(
                                  ingrediente.tipo
                                )}`}
                              >
                                {ingrediente.tipo}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Puede ser extra:
                              </span>
                              <span
                                className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  ingrediente.puedeSerExtra
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {ingrediente.puedeSerExtra ? "Sí" : "No"}
                              </span>
                            </div>
                            <div className="lg:hidden">
                              <span className="font-medium text-gray-700">
                                Precio extra:
                              </span>
                              <span className="ml-2 text-gray-900">
                                {ingrediente.puedeSerExtra
                                  ? `$${ingrediente.precioExtra}`
                                  : "-"}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Estaqueable:
                              </span>
                              <span
                                className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  ingrediente.estaqueable
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {ingrediente.estaqueable ? "Sí" : "No"}
                              </span>
                            </div>
                            <div className="xl:hidden">
                              <span className="font-medium text-gray-700">
                                Estado:
                              </span>
                              <button
                                onClick={() => handleToggleActive(ingrediente)}
                                className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full hover:opacity-70 transition cursor-pointer ${
                                  ingrediente.activo
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {ingrediente.activo ? "Activo" : "Inactivo"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              }) || []}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
