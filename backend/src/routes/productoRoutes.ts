// src/routes/productoRoutes.ts
import { Router } from "express";
import {
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productoController";
import { validate } from "../middlewares/validation";
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  getProductsByCategorySchema,
} from "../validators/productValidators";

const router = Router();

// GET /api/productos → Listar productos con paginación y filtros
router.get("/", getProducts);

// GET /api/productos/:id → Obtener un producto por ID
router.get("/:id", validate(getProductSchema), getProductById);

// GET /api/productos/categoria/:categoriaId → Obtener productos por categoría
router.get(
  "/categoria/:categoriaId",
  validate(getProductsByCategorySchema),
  getProductsByCategory
);

// POST /api/productos → Crear un nuevo producto
router.post("/", validate(createProductSchema), createProduct);

// PUT /api/productos/:id → Actualizar un producto
router.put("/:id", validate(updateProductSchema), updateProduct);

// DELETE /api/productos/:id → Desactivar un producto (soft delete)
router.delete("/:id", validate(getProductSchema), deleteProduct);

export default router;
