// src/routes/ingredienteRoutes.ts
import { Router } from "express";
import {
  getIngredients,
  getExtras,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getIngredientTypes,
} from "../controllers/ingredienteController";
import { validate } from "../middlewares/validation";
import {
  createIngredientSchema,
  updateIngredientSchema,
  getIngredientSchema,
} from "../validators/ingredientValidators";

const router = Router();

// GET /api/ingredientes → Listar ingredientes con filtros y paginación
router.get("/", getIngredients);

// GET /api/ingredientes/extras → Obtener ingredientes que pueden ser extras
router.get("/extras", getExtras);

// GET /api/ingredientes/tipos → Obtener estadísticas por tipo
router.get("/tipos", getIngredientTypes);

// GET /api/ingredientes/:id → Obtener un ingrediente por ID
router.get("/:id", validate(getIngredientSchema), getIngredientById);

// POST /api/ingredientes → Crear un nuevo ingrediente
router.post("/", validate(createIngredientSchema), createIngredient);

// PUT /api/ingredientes/:id → Actualizar un ingrediente
router.put("/:id", validate(updateIngredientSchema), updateIngredient);

// DELETE /api/ingredientes/:id → Eliminar/desactivar un ingrediente
router.delete("/:id", validate(getIngredientSchema), deleteIngredient);

export default router;
