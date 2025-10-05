// src/pages/admin/UsersPage.tsx
import { useState } from "react";
import { useFetch, type ApiResponse } from "../../hooks";
import Swal from "sweetalert2";

type User = {
  id: string;
  nombreUsuario: string;
  rol: "administrador" | "mostrador" | "cocina" | "cliente";
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    ventas: number;
    Caja: number;
  };
};

type UserFormData = {
  nombreUsuario: string;
  contraseña: string;
  rol: "administrador" | "mostrador" | "cocina" | "cliente";
  activo: boolean;
};

const url = "http://localhost:3000/api/usuarios";

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<UserFormData>({
    nombreUsuario: "",
    contraseña: "",
    rol: "cliente",
    activo: true,
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
    data,
    loading,
    error: fetchError,
    refetch,
  } = useFetch<ApiResponse<User[]>>(`${url}?activo=all`);

  const resetForm = () => {
    setFormData({
      nombreUsuario: "",
      contraseña: "",
      rol: "cliente",
      activo: true,
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      nombreUsuario: user.nombreUsuario,
      contraseña: "", // No precargamos la contraseña
      rol: user.rol,
      activo: user.activo,
    });
    setShowForm(true);
    setError("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    resetForm();
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const endpoint = editingUser ? `${url}/${editingUser.id}` : url;

      const method = editingUser ? "PUT" : "POST";

      // Si estamos editando y no se proporcionó contraseña, no la enviamos
      const bodyData: any = {
        nombreUsuario: formData.nombreUsuario,
        rol: formData.rol,
        activo: formData.activo,
      };

      // Solo incluir contraseña si se proporcionó
      if (formData.contraseña) {
        bodyData.contraseña = formData.contraseña;
      } else if (!editingUser) {
        // Si es un nuevo usuario, la contraseña es obligatoria
        setError("La contraseña es obligatoria para nuevos usuarios");
        return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingUser(null);
        resetForm();
        refetch();
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Error al guardar el usuario");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión al guardar el usuario");
    }
  };

  const handleToggleActive = async (user: User) => {
    const result = await Swal.fire({
      title: user.activo ? "¿Desactivar usuario?" : "¿Activar usuario?",
      html: `
        <p>¿Estás seguro de que deseas <strong>${
          user.activo ? "desactivar" : "activar"
        }</strong> al usuario:</p>
        <p class="text-lg font-semibold mt-2">${user.nombreUsuario}</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: user.activo ? "#d33" : "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: user.activo ? "Sí, desactivar" : "Sí, activar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${url}/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activo: !user.activo }),
        });

        if (response.ok) {
          await Swal.fire({
            title: "¡Actualizado!",
            text: `Usuario ${
              user.activo ? "desactivado" : "activado"
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
            text: errorData.error?.message || "Error al actualizar el usuario",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          title: "Error",
          text: "Error de conexión al actualizar el usuario",
          icon: "error",
        });
      }
    }
  };

  const handleDelete = async (userId: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar usuario?",
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
      const response = await fetch(`${url}/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await Swal.fire({
          title: "¡Eliminado!",
          text: "Usuario eliminado correctamente",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        refetch();
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: "Error",
          text: errorData.error?.message || "Error al eliminar el usuario",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: "Error de conexión al eliminar el usuario",
        icon: "error",
      });
    }
  };

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case "administrador":
        return "bg-red-100 text-red-800";
      case "mostrador":
        return "bg-blue-100 text-blue-800";
      case "cocina":
        return "bg-green-100 text-green-800";
      case "cliente":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case "administrador":
        return "fa-user-shield";
      case "mostrador":
        return "fa-cash-register";
      case "cocina":
        return "fa-utensils";
      case "cliente":
        return "fa-user";
      default:
        return "fa-user";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Usuarios</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingUser(null);
            resetForm();
            setError("");
          }}
          className="bg-[var(--color_principal)] text-[var(--color_claro)] px-4 py-2 rounded-lg hover:bg-[var(--color_principal_hover)] hover:cursor-pointer transition"
        >
          <i
            className={`fa-solid ${showForm ? "fa-minus" : "fa-plus"} mr-2`}
          ></i>
          {showForm ? "Cancelar" : "Nuevo Usuario"}
        </button>
      </div>

      {/* Formulario expandible */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="text-xl font-bold mb-4">
            {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre de usuario */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nombre de Usuario *
                </label>
                <input
                  type="text"
                  value={formData.nombreUsuario}
                  onChange={(e) =>
                    setFormData({ ...formData, nombreUsuario: e.target.value })
                  }
                  className="w-full border border-[var(--color_borde)] rounded px-3 py-2"
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="^[a-zA-Z0-9_-]+$"
                  title="Solo letras, números, guiones y guiones bajos"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Contraseña{" "}
                  {editingUser ? "(dejar vacío para no cambiar)" : "*"}
                </label>
                <input
                  type="password"
                  value={formData.contraseña}
                  onChange={(e) =>
                    setFormData({ ...formData, contraseña: e.target.value })
                  }
                  className="w-full border border-[var(--color_borde)] rounded px-3 py-2"
                  required={!editingUser}
                  minLength={6}
                  maxLength={100}
                />
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium mb-2">Rol *</label>
                <select
                  value={formData.rol}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rol: e.target.value as UserFormData["rol"],
                    })
                  }
                  className="w-full border border-[var(--color_borde)] rounded px-3 py-2"
                  required
                >
                  <option value="cliente">Cliente</option>
                  <option value="mostrador">Mostrador</option>
                  <option value="cocina">Cocina</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              {/* Activo */}
              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) =>
                      setFormData({ ...formData, activo: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                  <span>{formData.activo ? "Activo" : "Inactivo"}</span>
                </div>
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

      {/* Estado de carga */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      )}

      {/* Error */}
      {fetchError && (
        <div className="bg-red-100 text-red-700 p-4 rounded">
          Error al cargar usuarios: {fetchError.message}
        </div>
      )}

      {/* Tabla de usuarios */}
      {!loading && !fetchError && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Rol
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Ventas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data && data.data && data.data.length > 0 ? (
                data.data.map((user) => {
                  const isExpanded = expandedRows.has(user.id);
                  return (
                    <>
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleRow(user.id)}
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
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            {user.nombreUsuario}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center hidden md:table-cell">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                              user.rol
                            )}`}
                          >
                            {user.rol.charAt(0).toUpperCase() +
                              user.rol.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 hidden lg:table-cell">
                          {user._count?.ventas || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center hidden xl:table-cell">
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full hover:opacity-70 transition cursor-pointer ${
                              user.activo
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                            title={`Click para ${
                              user.activo ? "desactivar" : "activar"
                            }`}
                          >
                            {user.activo ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-4">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-900 hover:cursor-pointer"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900 hover:cursor-pointer"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="md:hidden">
                                <span className="font-medium text-gray-700">
                                  Rol:
                                </span>
                                <span
                                  className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                                    user.rol
                                  )}`}
                                >
                                  {user.rol.charAt(0).toUpperCase() +
                                    user.rol.slice(1)}
                                </span>
                              </div>
                              <div className="lg:hidden">
                                <span className="font-medium text-gray-700">
                                  Ventas:
                                </span>
                                <span className="ml-2 text-gray-900">
                                  {user._count?.ventas || 0}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  Cajas:
                                </span>
                                <span className="ml-2 text-gray-900">
                                  {user._count?.Caja || 0}
                                </span>
                              </div>
                              <div className="xl:hidden">
                                <span className="font-medium text-gray-700">
                                  Estado:
                                </span>
                                <button
                                  onClick={() => handleToggleActive(user)}
                                  className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full hover:opacity-70 transition cursor-pointer ${
                                    user.activo
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {user.activo ? "Activo" : "Inactivo"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {data && data.pagination && data.pagination.pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                className={`px-3 py-1 rounded ${
                  page === data.pagination.current
                    ? "bg-[var(--color_principal)] text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
