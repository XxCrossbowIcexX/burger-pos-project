import { useState, useEffect } from "react";
import { useFetch, type ApiResponse } from "../../hooks/useFetch";
import Swal from "sweetalert2";

interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
}

interface Ingrediente {
  id: string;
  nombre: string;
  tipo: "pan" | "carne" | "queso" | "vegetal" | "salsa";
  estaqueable: boolean;
  puedeSerExtra: boolean;
  precioExtra: number;
  activo: boolean;
}

interface IngredienteSeleccionado {
  ingredienteId: string;
  cantidad: number;
}

interface Producto {
  id: string;
  nombre: string;
  codigo: string;
  precioBase: number;
  descripcion?: string;
  activo: boolean;
  permiteExtras: boolean;
  permiteExclusiones: boolean;
  categoria: Categoria;
  categoriaId: string;
}

export default function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    precioBase: 0,
    categoriaId: "",
    permiteExtras: false,
    permiteExclusiones: false,
  });
  const [selectedIngredients, setSelectedIngredients] = useState<
    IngredienteSeleccionado[]
  >([]);
  const [generatedDescription, setGeneratedDescription] = useState("");
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
    data: productosResponse,
    loading,
    refetch,
  } = useFetch<ApiResponse<Producto[]>>("/api/productos?activo=all");
  const { data: categoriasResponse } =
    useFetch<ApiResponse<Categoria[]>>("/api/categorias");
  const { data: ingredientesResponse } =
    useFetch<ApiResponse<Ingrediente[]>>("/api/ingredientes");

  const productos = (productosResponse as ApiResponse<Producto[]>)?.data;
  const categorias = (categoriasResponse as ApiResponse<Categoria[]>)?.data;
  const ingredientes = (ingredientesResponse as ApiResponse<Ingrediente[]>)
    ?.data;

  // Generar descripción automática
  const generateDescription = () => {
    if (!ingredientes || selectedIngredients.length === 0) return "";

    const tiposOrden = ["pan", "carne", "queso", "vegetal", "salsa"];
    const grupos: { [key: string]: string[] } = {};

    selectedIngredients.forEach((seleccionado) => {
      const ingrediente = ingredientes.find(
        (ing) => ing.id === seleccionado.ingredienteId
      );
      if (ingrediente) {
        if (!grupos[ingrediente.tipo]) grupos[ingrediente.tipo] = [];

        const cantidad =
          seleccionado.cantidad > 1 ? `${seleccionado.cantidad}x ` : "";
        grupos[ingrediente.tipo].push(`${cantidad}${ingrediente.nombre}`);
      }
    });

    const descripcionParts: string[] = [];
    tiposOrden.forEach((tipo) => {
      if (grupos[tipo]) {
        descripcionParts.push(grupos[tipo].join(", "));
      }
    });

    return descripcionParts.join(", ");
  };

  // Manejar selección de ingredientes
  const handleIngredientToggle = (ingredienteId: string) => {
    const existingIndex = selectedIngredients.findIndex(
      (sel) => sel.ingredienteId === ingredienteId
    );

    if (existingIndex >= 0) {
      setSelectedIngredients((prev) =>
        prev.filter((sel) => sel.ingredienteId !== ingredienteId)
      );
    } else {
      setSelectedIngredients((prev) => [
        ...prev,
        { ingredienteId, cantidad: 1 },
      ]);
    }
  };

  // Cambiar cantidad de ingrediente
  const handleQuantityChange = (ingredienteId: string, delta: number) => {
    setSelectedIngredients((prev) =>
      prev.map((sel) => {
        if (sel.ingredienteId === ingredienteId) {
          const newQuantity = Math.max(1, sel.cantidad + delta);
          return { ...sel, cantidad: newQuantity };
        }
        return sel;
      })
    );
  };

  // Agrupar ingredientes por tipo
  const ingredientesPorTipo =
    ingredientes?.reduce((acc, ingrediente) => {
      if (!acc[ingrediente.tipo]) acc[ingrediente.tipo] = [];
      acc[ingrediente.tipo].push(ingrediente);
      return acc;
    }, {} as { [key: string]: Ingrediente[] }) || {};

  const tipoLabels = {
    pan: "🍞 Pan",
    carne: "🥩 Carnes",
    queso: "🧀 Quesos",
    vegetal: "🥬 Vegetales",
    salsa: "🥫 Salsas",
  };

  // Actualizar descripción cada vez que cambian los ingredientes
  useEffect(() => {
    setGeneratedDescription(generateDescription());
  }, [selectedIngredients, ingredientes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const url = editingProduct
      ? `/api/productos/${editingProduct.id}`
      : "/api/productos";

    const method = editingProduct ? "PUT" : "POST";

    const submitData = {
      ...formData,
      precioBase: Number(formData.precioBase),
      descripcion: generatedDescription,
      ingredientes: selectedIngredients.map((sel) => ({
        ingredienteId: sel.ingredienteId,
        cantidad: sel.cantidad,
        esExtraOpcional: false,
        precioIncluido: 0,
      })),
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
        setEditingProduct(null);
        resetForm();
        refetch();
        window.dispatchEvent(new CustomEvent("productosUpdated"));
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Error al guardar el producto");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión. Inténtalo de nuevo.");
    }
  };

  const handleEdit = (producto: Producto) => {
    setEditingProduct(producto);
    setFormData({
      nombre: producto.nombre,
      codigo: producto.codigo,
      precioBase: producto.precioBase,
      categoriaId: producto.categoriaId,
      permiteExtras: producto.permiteExtras,
      permiteExclusiones: producto.permiteExclusiones,
    });
    // TODO: Cargar ingredientes existentes del producto
    setSelectedIngredients([]);
    setShowForm(true);
  };

  const handleToggleActive = async (producto: Producto) => {
    const result = await Swal.fire({
      title: producto.activo ? "¿Desactivar producto?" : "¿Activar producto?",
      html: `
        <p>¿Estás seguro de que deseas <strong>${
          producto.activo ? "desactivar" : "activar"
        }</strong> el producto:</p>
        <p class="text-lg font-semibold mt-2">${producto.nombre}</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: producto.activo ? "#d33" : "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: producto.activo ? "Sí, desactivar" : "Sí, activar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/productos/${producto.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ activo: !producto.activo }),
          }
        );

        if (response.ok) {
          await Swal.fire({
            title: "¡Actualizado!",
            text: `Producto ${
              producto.activo ? "desactivado" : "activado"
            } correctamente`,
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
          refetch();
          window.dispatchEvent(new CustomEvent("productosUpdated"));
        } else {
          const errorData = await response.json();
          Swal.fire({
            title: "Error",
            text: errorData.error?.message || "Error al actualizar el producto",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          title: "Error",
          text: "Error de conexión al actualizar el producto",
          icon: "error",
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar producto?",
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
        `http://localhost:3000/api/productos/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await Swal.fire({
          title: "¡Eliminado!",
          text: "Producto eliminado correctamente",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        refetch();
        window.dispatchEvent(new CustomEvent("productosUpdated"));
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: "Error",
          text: errorData.error?.message || "Error al eliminar el producto",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: "Error de conexión al eliminar el producto",
        icon: "error",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      codigo: "",
      precioBase: 0,
      categoriaId: "",
      permiteExtras: false,
      permiteExclusiones: false,
    });
    setSelectedIngredients([]);
    setGeneratedDescription("");
    setError("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    resetForm();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Productos</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingProduct(null);
            resetForm();
            setError("");
          }}
          className="bg-[var(--color_principal)] text-[var(--color_claro)] px-4 py-2 rounded-lg hover:bg-[var(--color_principal_hover)] hover:cursor-pointer transition"
        >
          <i
            className={`fa-solid ${showForm ? "fa-minus" : "fa-plus"} mr-2`}
          ></i>
          {showForm ? "Cancelar" : "Nuevo Producto"}
        </button>
      </div>

      {/* Formulario expandible */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="text-xl font-bold mb-4">
            {editingProduct ? "Editar Producto" : "Nuevo Producto"}
          </h3>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                  placeholder="Ej: Hamburguesa Clásica"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Se genera automáticamente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Base *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precioBase}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precioBase: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Categoría */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                value={formData.categoriaId}
                onChange={(e) =>
                  setFormData({ ...formData, categoriaId: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccionar categoría</option>
                {categorias?.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de ingredientes */}
            {formData.categoriaId &&
              categorias?.find((c) => c.id === formData.categoriaId)
                ?.permiteIngredientes && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Ingredientes del producto
                  </label>

                  <div className="grid gap-4">
                    {Object.entries(tipoLabels).map(([tipo, label]) => {
                      const ingredientesTipo = ingredientesPorTipo[tipo] || [];
                      if (ingredientesTipo.length === 0) return null;

                      return (
                        <div
                          key={tipo}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <h4 className="font-medium text-gray-900 mb-3">
                            {label}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {ingredientesTipo.map((ingrediente) => {
                              const isSelected = selectedIngredients.some(
                                (sel) => sel.ingredienteId === ingrediente.id
                              );
                              const cantidad =
                                selectedIngredients.find(
                                  (sel) => sel.ingredienteId === ingrediente.id
                                )?.cantidad || 1;

                              return (
                                <div
                                  key={ingrediente.id}
                                  className="flex items-center justify-between p-2 border border-gray-200 rounded-lg"
                                >
                                  <label className="flex items-center cursor-pointer flex-1">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        handleIngredientToggle(ingrediente.id)
                                      }
                                      className="mr-2 w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm">
                                      {ingrediente.nombre}
                                    </span>
                                  </label>

                                  {isSelected && ingrediente.estaqueable && (
                                    <div className="flex items-center ml-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuantityChange(
                                            ingrediente.id,
                                            -1
                                          )
                                        }
                                        className="w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-600 rounded-l border hover:bg-gray-300"
                                      >
                                        -
                                      </button>
                                      <span className="w-8 h-6 flex items-center justify-center bg-gray-100 border-t border-b text-sm">
                                        {cantidad}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuantityChange(
                                            ingrediente.id,
                                            1
                                          )
                                        }
                                        className="w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-600 rounded-r border hover:bg-gray-300"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Descripción generada */}
            {generatedDescription && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción generada
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  {generatedDescription}
                </div>
              </div>
            )}

            {/* Opciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permiteExtras}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permiteExtras: e.target.checked,
                      })
                    }
                    className="mr-3 w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Permite extras</div>
                    <div className="text-sm text-gray-500">
                      Los clientes pueden agregar ingredientes extra
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permiteExclusiones}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permiteExclusiones: e.target.checked,
                      })
                    }
                    className="mr-3 w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Permite exclusiones</div>
                    <div className="text-sm text-gray-500">
                      Los clientes pueden quitar ingredientes
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
        <div className="text-center py-8">Cargando productos...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Precio
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
              {productos?.map((producto) => {
                const isExpanded = expandedRows.has(producto.id);
                return (
                  <>
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleRow(producto.id)}
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
                            {producto.nombre}
                          </div>
                          <div className="text-xs text-gray-500 font-mono md:hidden">
                            {producto.codigo}
                          </div>
                          {producto.descripcion && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {producto.descripcion}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {producto.categoria.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                        ${Number(producto.precioBase).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                        <button
                          onClick={() => handleToggleActive(producto)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full hover:opacity-70 transition cursor-pointer ${
                            producto.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                          title={`Click para ${
                            producto.activo ? "desactivar" : "activar"
                          }`}
                        >
                          {producto.activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(producto)}
                          className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                        >
                          <i className="fa-solid fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(producto.id)}
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
                                Categoría:
                              </span>
                              <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {producto.categoria.nombre}
                              </span>
                            </div>
                            <div className="lg:hidden">
                              <span className="font-medium text-gray-700">
                                Precio:
                              </span>
                              <span className="ml-2 text-gray-900">
                                ${Number(producto.precioBase).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Código:
                              </span>
                              <span className="ml-2 text-gray-900 font-mono hidden md:inline">
                                {producto.codigo}
                              </span>
                            </div>
                            <div className="xl:hidden">
                              <span className="font-medium text-gray-700">
                                Estado:
                              </span>
                              <button
                                onClick={() => handleToggleActive(producto)}
                                className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full hover:opacity-70 transition cursor-pointer ${
                                  producto.activo
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {producto.activo ? "Activo" : "Inactivo"}
                              </button>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Configuración:
                              </span>
                              <div className="mt-1 flex flex-wrap gap-2">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    producto.permiteExtras
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {producto.permiteExtras
                                    ? "Permite extras"
                                    : "Sin extras"}
                                </span>
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    producto.permiteExclusiones
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {producto.permiteExclusiones
                                    ? "Permite exclusiones"
                                    : "Sin exclusiones"}
                                </span>
                              </div>
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
