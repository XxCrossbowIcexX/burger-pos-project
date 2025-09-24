import { Router } from "express";
import { getCategories } from "../controllers/categoriaController";

const router = Router();

// GET /api/categorias → Listar todas las categorías
router.get("/", getCategories);
export default router;
