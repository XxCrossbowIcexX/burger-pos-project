// src/routes/usuarioRoutes.ts
import { Router } from "express";
import {
  login,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  getUserStats,
} from "../controllers/usuarioController";
import { validate } from "../middlewares/validation";
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  changePasswordSchema,
} from "../validators/userValidators";

const router = Router();

// POST /api/usuarios/login → Login de usuario
router.post("/login", login);

// GET /api/usuarios → Listar usuarios con paginación
router.get("/", getUsers);

// GET /api/usuarios/stats → Obtener estadísticas de usuarios
router.get("/stats", getUserStats);

// GET /api/usuarios/:id → Obtener un usuario por ID
router.get("/:id", validate(getUserSchema), getUserById);

// POST /api/usuarios → Crear un nuevo usuario
router.post("/", validate(createUserSchema), createUser);

// PUT /api/usuarios/:id → Actualizar un usuario
router.put("/:id", validate(updateUserSchema), updateUser);

// PUT /api/usuarios/:id/password → Cambiar contraseña
router.put("/:id/password", validate(changePasswordSchema), changePassword);

// DELETE /api/usuarios/:id → Eliminar/desactivar un usuario
router.delete("/:id", validate(getUserSchema), deleteUser);

export default router;
