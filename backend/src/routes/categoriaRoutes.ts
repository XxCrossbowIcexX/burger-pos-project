// src/routes/categoriaRoutes.ts
import { Router } from "express";
import {
  getCategories,
  getCategoriesSimple,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
} from "../controllers/categoriaController";
import { validate } from "../middlewares/validation";
import {
  createCategorySchema,
  updateCategorySchema,
  getCategorySchema,
} from "../validators/categoryValidators";

const router = Router();

// GET /api/categorias → Mantener compatibilidad con frontend actual
router.get("/", getCategoriesSimple);

// GET /api/categorias/full → Listar categorías con paginación completa
router.get("/full", getCategories);

// GET /api/categorias/stats → Obtener estadísticas de categorías
router.get("/stats", getCategoryStats);

// GET /api/categorias/:id → Obtener una categoría por ID
router.get("/:id", validate(getCategorySchema), getCategoryById);

// POST /api/categorias → Crear una nueva categoría
router.post("/", validate(createCategorySchema), createCategory);

// PUT /api/categorias/:id → Actualizar una categoría
router.put("/:id", validate(updateCategorySchema), updateCategory);

// DELETE /api/categorias/:id → Eliminar/desactivar una categoría
router.delete("/:id", validate(getCategorySchema), deleteCategory);

export default router;
