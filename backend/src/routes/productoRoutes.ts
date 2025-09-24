// src/routes/productoRoutes.ts
import { Router } from "express";
import {
  getProducts,
  getProductById,
  getProductsByCategory,
} from "../controllers/productoController";

const router = Router();

// GET /api/productos → Listar todos los productos
router.get("/", getProducts);

// GET /api/productos/:id → Obtener un producto por ID
router.get("/:id", getProductById);

// GET /api/productos/categoria/:categoriaId → Obtener productos por categoría
router.get("/categoria/:categoriaId", getProductsByCategory);

export default router;
