import { Router } from "express";
import {
  getConfiguraciones,
  getConfiguracionByClave,
  createConfiguracion,
  updateConfiguracion,
  deleteConfiguracion,
} from "../controllers/configuracionController";
import { validate } from "../middlewares/validation";
import {
  getConfiguracionesSchema,
  getConfiguracionSchema,
  createConfiguracionSchema,
  updateConfiguracionSchema,
  deleteConfiguracionSchema,
} from "../validators/configuracionValidators";

const router = Router();

// Obtener todas las configuraciones
router.get("/", validate(getConfiguracionesSchema), getConfiguraciones);

// Obtener configuración por clave
router.get("/:clave", validate(getConfiguracionSchema), getConfiguracionByClave);

// Crear configuración
router.post("/", validate(createConfiguracionSchema), createConfiguracion);

// Actualizar configuración
router.put("/:clave", validate(updateConfiguracionSchema), updateConfiguracion);

// Eliminar configuración
router.delete("/:clave", validate(deleteConfiguracionSchema), deleteConfiguracion);

export default router;
