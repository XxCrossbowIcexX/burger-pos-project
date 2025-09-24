import { Router } from "express";
import { getExtras } from "../controllers/ingredienteController";

const router = Router();

router.get("/extras", getExtras);

export default router;
