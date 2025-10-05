import { Router } from "express";
import {
  crearMovimiento,
  getMovimientosByCaja,
} from "../controllers/movimientoController";

const router = Router();

// Crear movimiento (ingreso o retiro)
router.post("/", crearMovimiento);

// Obtener movimientos por caja
router.get("/caja/:cajaId", getMovimientosByCaja);

export default router;
