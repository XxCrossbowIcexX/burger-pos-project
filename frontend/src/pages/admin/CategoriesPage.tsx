// src/pages/CategoriesPage.tsx
export default function CategoriesPage() {
  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Categorías</h2>
        <button className="bg-[var(--color_principal)] text-[var(--color_claro)] px-4 py-2 rounded-lg hover:bg-[var(--color_principal_hover)] transition">
          <i className="fa-solid fa-plus mr-2"></i>
          Nueva Categoría
        </button>
      </div>
    </div>
  );
}
