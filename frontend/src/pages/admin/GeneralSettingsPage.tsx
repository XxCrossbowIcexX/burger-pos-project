import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import Swal from "sweetalert2";

interface Configuracion {
  id: string;
  clave: string;
  valor: string;
  tipo: string;
  descripcion: string | null;
  categoria: string;
  createdAt: string;
  updatedAt: string;
}

export default function GeneralSettingsPage() {
  const {
    data: configuracionesResponse,
    loading,
    refetch,
  } = useFetch<{ success: boolean; data: Configuracion[] }>(
    "/api/configuraciones"
  );

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const configuraciones = configuracionesResponse?.data || [];

  const handleEdit = (config: Configuracion) => {
    setEditingKey(config.clave);
    setEditValue(config.valor);
  };

  const handleSave = async (clave: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/configuraciones/${clave}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            valor: editValue,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          icon: "success",
          title: "Configuración actualizada",
          text: "La configuración se actualizó correctamente",
          timer: 2000,
          showConfirmButton: false,
        });

        setEditingKey(null);
        setEditValue("");
        refetch();

        // Disparar evento para que otros componentes se enteren del cambio
        window.dispatchEvent(new Event("configuracion-updated"));
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error?.message || "Error al actualizar la configuración",
        });
      }
    } catch (error) {
      console.error("Error al actualizar configuración:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al actualizar la configuración",
      });
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: { [key: string]: string } = {
      general: "General",
      impuestos: "Impuestos",
      sistema: "Sistema",
    };
    return labels[categoria] || categoria;
  };

  const renderValueInput = (config: Configuracion) => {
    if (editingKey === config.clave) {
      switch (config.tipo) {
        case "number":
          return (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              step="0.01"
            />
          );
        case "boolean":
          return (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            >
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          );
        default:
          return (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          );
      }
    }

    // Display mode
    switch (config.tipo) {
      case "boolean":
        return (
          <span className="font-medium">
            {config.valor === "true" ? "Sí" : "No"}
          </span>
        );
      case "number":
        return (
          <span className="font-medium">
            {config.clave === "iva_porcentaje"
              ? `${config.valor}%`
              : config.valor}
          </span>
        );
      default:
        return <span className="font-medium">{config.valor}</span>;
    }
  };

  // Agrupar configuraciones por categoría
  const groupedConfigs = configuraciones.reduce((acc, config) => {
    if (!acc[config.categoria]) {
      acc[config.categoria] = [];
    }
    acc[config.categoria].push(config);
    return acc;
  }, {} as { [key: string]: Configuracion[] });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-500">Cargando configuraciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Configuración General
        </h1>
        <p className="text-gray-600 mt-2">
          Administra las configuraciones globales del sistema
        </p>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedConfigs).map((categoria) => (
          <div
            key={categoria}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {getCategoriaLabel(categoria)}
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {groupedConfigs[categoria].map((config) => (
                  <div
                    key={config.clave}
                    className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 mb-4 md:mb-0">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {config.descripcion || config.clave}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Clave:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          {config.clave}
                        </code>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="min-w-[200px]">
                        {renderValueInput(config)}
                      </div>

                      {editingKey === config.clave ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(config.clave)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors hover:cursor-pointer"
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors hover:cursor-pointer"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(config)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors hover:cursor-pointer"
                        >
                          <i className="fa-solid fa-pen"></i> Editar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {configuraciones.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <i className="fa-solid fa-cog text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">
            No hay configuraciones disponibles
          </p>
        </div>
      )}
    </div>
  );
}
