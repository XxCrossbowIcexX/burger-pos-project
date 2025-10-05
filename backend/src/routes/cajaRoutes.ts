// src/routes/cajaRoutes.ts
import { Router } from "express";
import {
  abrirCaja,
  cerrarCaja,
  getCajas,
  getCajaById,
  updateCaja,
  deleteCaja,
  getCajaAbierta,
} from "../controllers/cajaController";
import { validate } from "../middlewares/validation";
import {
  abrirCajaSchema,
  cerrarCajaSchema,
  getCajaSchema,
  getCajasSchema,
  updateCajaSchema,
  deleteCajaSchema,
} from "../validators/cajaValidators";

const router = Router();

// Obtener caja abierta del usuario
router.get("/abierta", getCajaAbierta);

// Obtener todas las cajas con filtros
router.get("/", validate(getCajasSchema), getCajas);

// Obtener caja por ID
router.get("/:id", validate(getCajaSchema), getCajaById);

// Abrir nueva caja
router.post("/", validate(abrirCajaSchema), abrirCaja);

// Cerrar caja
router.post("/:id/cerrar", validate(cerrarCajaSchema), cerrarCaja);

// Actualizar caja
router.put("/:id", validate(updateCajaSchema), updateCaja);

// Eliminar caja
router.delete("/:id", validate(deleteCajaSchema), deleteCaja);

export default router;
