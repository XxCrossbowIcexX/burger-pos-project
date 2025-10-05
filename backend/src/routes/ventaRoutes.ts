// src/routes/ventaRoutes.ts
import { Router } from "express";
import {
  createVenta,
  getVentas,
  getVentaById,
  updateVenta,
  cancelVenta,
  getVentasStats,
  getTicket,
} from "../controllers/ventaController";
import { validate } from "../middlewares/validation";
import {
  createVentaSchema,
  getVentaSchema,
  getVentasSchema,
  updateVentaSchema,
  cancelVentaSchema,
} from "../validators/ventaValidators";

const router = Router();

// Obtener estadísticas
router.get("/stats", getVentasStats);

// Obtener todas las ventas con filtros
router.get("/", validate(getVentasSchema), getVentas);

// Obtener ticket de una venta
router.get("/:id/ticket", validate(getVentaSchema), getTicket);

// Obtener venta por ID
router.get("/:id", validate(getVentaSchema), getVentaById);

// Crear venta
router.post("/", validate(createVentaSchema), createVenta);

// Actualizar venta
router.put("/:id", validate(updateVentaSchema), updateVenta);

// Cancelar venta
router.post("/:id/cancelar", validate(cancelVentaSchema), cancelVenta);

export default router;
