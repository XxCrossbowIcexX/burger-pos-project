// src/pages/UsersPage.tsx

import { useState } from "react";

export default function UsersPage() {
  const [users] = useState([
    {
      id: "01",
      username: "Admin",
      rol: "Administrador",
      active: true,
    },
    {
      id: "02",
      username: "Mostrador",
      rol: "Mostrador",
      active: false,
    },
    {
      id: "03",
      username: "Cocina",
      rol: "Cocina",
      active: true,
    },
  ]);

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Usuarios</h2>
        <button className="bg-[var(--color_principal)] text-[var(--color_claro)] px-4 py-2 rounded-lg hover:bg-[var(--color_principal_hover)] hover:cursor-pointer transition">
          <i className="fa-solid fa-plus mr-2"></i>
          Nuevo Usuario
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow mt-4">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[var(--color_oscuro)] text-left text-sm text-[var(--color_claro)] font-bold uppercase tracking-wider">
              <th className="px-4 py-3 border-r border-[var(--color_borde)]">
                Usuario
              </th>
              <th className="px-4 py-3 border-r border-[var(--color_borde)] text-center">
                Rol
              </th>
              <th className="px-4 py-3 border-r border-[var(--color_borde)] text-center">
                Activo
              </th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color_borde)]">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 text-[var(--color_oscuro)] font-medium"
              >
                <td className="px-4 py-3 border-r border-[var(--color_borde)]">
                  {user.username}
                </td>
                <td className="w-64 px-4 py-3 max-w-xs truncate border-r border-[var(--color_borde)] text-center">
                  {user.rol}
                </td>
                <td className="w-32 px-4 py-3 border-r border-[var(--color_borde)] text-center">
                  {user.active ? (
                    <i className="fa-regular fa-square-check text-[var(--color_exito)] cursor-not-allowed"></i>
                  ) : (
                    <i className="fa-regular fa-square text-[var(--color_borde)] cursor-not-allowed"></i>
                  )}
                </td>
                <td className="w-32 px-4 py-3 space-x-4 text-center">
                  <button className="text-[var(--color_secundario)] hover:cursor-pointer hover:text-[var(--color_secundario_hover)]">
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button className="text-[var(--color_principal)] hover:cursor-pointer hover:text-[var(--color_principal_hover)]">
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
