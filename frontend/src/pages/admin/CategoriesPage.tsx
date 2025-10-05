import { useState } from "react";
import { useFetch, type ApiResponse } from "../../hooks/useFetch";
import Swal from "sweetalert2";

interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
  permiteIngredientes: boolean;
  permiteModificar: boolean;
  activo: boolean;
  _count?: {
    productos: number;
  };
}

const availableIcons = [
  { name: "fa-solid fa-burger", label: "Hamburguesa" },
  { name: "fa-solid fa-utensils", label: "Cubiertos" },
  { name: "fa-solid fa-drumstick-bite", label: "Pollo" },
  { name: "fa-solid fa-hotdog", label: "Hot Dog" },
  { name: "fa-solid fa-fish", label: "Pescado" },
  { name: "fa-solid fa-seedling", label: "Vegetariano" },
  { name: "fa-solid fa-ice-cream", label: "Postre" },
  { name: "fa-solid fa-coffee", label: "Bebidas" },
  { name: "fa-solid fa-champagne-glasses", label: "Copas" },
  { name: "fa-solid fa-wine-glass", label: "Bebidas alcohólicas" },
  { name: "fa-solid fa-cookie-bite", label: "Snacks" },
  { name: "fa-solid fa-bread-slice", label: "Pan" },
  { name: "fa-solid fa-pizza-slice", label: "Pizza" },
  { name: "fa-solid fa-cheese", label: "Lácteos" },
];

export default function CategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(
    null
  );
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    icono: "",
    permiteIngredientes: true,
    permiteModificar: true,
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
    data: categoriasResponse,
    loading,
    refetch,
  } = useFetch<ApiResponse<Categoria[]>>(
    "/api/categorias/full?activo=all&includeProductCount=true"
  );

  const categorias = (categoriasResponse as ApiResponse<Categoria[]>)?.data;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const url = editingCategory
      ? `/api/categorias/${editingCategory.id}`
      : "/api/categorias";

    const method = editingCategory ? "PUT" : "POST";

    try {
      const response = await fetch(`http://localhost:3000${url}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingCategory(null);
        resetForm();
        refetch();
        // Emitir evento para actualizar sidebar
        window.dispatchEvent(new CustomEvent("categoriesUpdated"));
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Error al guardar la categoría");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión. Inténtalo de nuevo.");
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategory(categoria);
    setFormData({
      nombre: categoria.nombre,
      icono: categoria.icono || "",
      permiteIngredientes: categoria.permiteIngredientes,
      permiteModificar: categoria.permiteModificar,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (categoria: Categoria) => {
    const result = await Swal.fire({
      title: categoria.activo
        ? "¿Desactivar categoría?"
        : "¿Activar categoría?",
      html: `
        <p>¿Estás seguro de que deseas <strong>${
          categoria.activo ? "desactivar" : "activar"
        }</strong> la categoría:</p>
        <p class="text-lg font-semibold mt-2">${categoria.nombre}</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: categoria.activo ? "#d33" : "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: categoria.activo ? "Sí, desactivar" : "Sí, activar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/categorias/${categoria.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ activo: !categoria.activo }),
          }
        );

        if (response.ok) {
          await Swal.fire({
            title: "¡Actualizado!",
            text: `Categoría ${
              categoria.activo ? "desactivada" : "activada"
            } correctamente`,
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
          refetch();
          window.dispatchEvent(new CustomEvent("categoriesUpdated"));
        } else {
          const errorData = await response.json();
          Swal.fire({
            title: "Error",
            text:
              errorData.error?.message || "Error al actualizar la categoría",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          title: "Error",
          text: "Error de conexión al actualizar la categoría",
          icon: "error",
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar categoría?",
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
        `http://localhost:3000/api/categorias/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await Swal.fire({
          title: "¡Eliminado!",
          text: "Categoría eliminada correctamente",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        refetch();
        window.dispatchEvent(new CustomEvent("categoriesUpdated"));
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: "Error",
          text: errorData.error?.message || "Error al eliminar la categoría",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: "Error de conexión al eliminar la categoría",
        icon: "error",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      icono: "",
      permiteIngredientes: true,
      permiteModificar: true,
    });
    setError("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    resetForm();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Categorías</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingCategory(null);
            resetForm();
            setError("");
          }}
          className="bg-[var(--color_principal)] text-[var(--color_claro)] px-4 py-2 rounded-lg hover:bg-[var(--color_principal_hover)] hover:cursor-pointer transition"
        >
          <i
            className={`fa-solid ${showForm ? "fa-minus" : "fa-plus"} mr-2`}
          ></i>
          {showForm ? "Cancelar" : "Nueva Categoría"}
        </button>
      </div>

      {/* Formulario expandible */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="text-xl font-bold mb-4">
            {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
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
                  placeholder="Ej: Hamburguesas, Bebidas, Postres..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icono *
                </label>
                <div className="grid grid-cols-4 gap-2 p-3 border border-gray-300 rounded-lg max-h-32 overflow-y-auto">
                  {availableIcons.map((icon) => (
                    <label
                      key={icon.name}
                      className={`flex flex-col items-center p-2 rounded-lg border cursor-pointer transition hover:bg-gray-50 ${
                        formData.icono === icon.name
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="icono"
                        value={icon.name}
                        checked={formData.icono === icon.name}
                        onChange={(e) =>
                          setFormData({ ...formData, icono: e.target.value })
                        }
                        className="sr-only"
                      />
                      <i className={`${icon.name} text-xl text-gray-600`}></i>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permiteIngredientes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permiteIngredientes: e.target.checked,
                      })
                    }
                    className="mr-3 w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Permite ingredientes</div>
                    <div className="text-sm text-gray-500">
                      Los productos pueden agregar/quitar ingredientes
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permiteModificar}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permiteModificar: e.target.checked,
                      })
                    }
                    className="mr-3 w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Permite modificar</div>
                    <div className="text-sm text-gray-500">
                      Los productos se pueden personalizar
                    </div>
                  </div>
                </label>
              </div>
            </div>

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
        <div className="text-center py-8">Cargando categorías...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categorias?.map((categoria) => {
                const isExpanded = expandedRows.has(categoria.id);
                return (
                  <>
                    <tr key={categoria.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleRow(categoria.id)}
                          className="text-gray-500 hover:text-gray-700 focus:outline-none hover:cursor-pointer"
                        >
                          <i
                            className={`fa-solid ${
                              isExpanded ? "fa-minus" : "fa-plus"
                            } text-sm`}
                          ></i>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {categoria.icono && (
                            <i
                              className={`${categoria.icono} mr-3 text-lg text-gray-600`}
                            ></i>
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {categoria.nombre}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {categoria._count?.productos || 0} productos
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <button
                          onClick={() => handleToggleActive(categoria)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full hover:opacity-70 transition cursor-pointer ${
                            categoria.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                          title={`Click para ${
                            categoria.activo ? "desactivar" : "activar"
                          }`}
                        >
                          {categoria.activo ? "Activa" : "Inactiva"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(categoria)}
                          className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                        >
                          <i className="fa-solid fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(categoria.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="md:hidden">
                              <span className="font-medium text-gray-700">
                                Productos:
                              </span>
                              <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {categoria._count?.productos || 0} productos
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Configuración:
                              </span>
                              <div className="mt-1 flex flex-wrap gap-2">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    categoria.permiteIngredientes
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {categoria.permiteIngredientes
                                    ? "Permite ingredientes"
                                    : "Sin ingredientes"}
                                </span>
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    categoria.permiteModificar
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {categoria.permiteModificar
                                    ? "Modificable"
                                    : "No modificable"}
                                </span>
                              </div>
                            </div>
                            <div className="lg:hidden">
                              <span className="font-medium text-gray-700">
                                Estado:
                              </span>
                              <button
                                onClick={() => handleToggleActive(categoria)}
                                className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full hover:opacity-70 transition cursor-pointer ${
                                  categoria.activo
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {categoria.activo ? "Activa" : "Inactiva"}
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
