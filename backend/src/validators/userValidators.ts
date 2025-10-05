// src/validators/userValidators.ts
import { z } from "zod";

// Enum de roles de usuario
export const RolUsuarioEnum = z.enum([
  "administrador",
  "mostrador",
  "cocina",
  "cliente",
]);

// Schema para crear usuario
export const createUserSchema = z.object({
  body: z.object({
    nombreUsuario: z
      .string()
      .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
      .max(50, "El nombre de usuario no puede exceder 50 caracteres")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "El nombre de usuario solo puede contener letras, números, guiones y guiones bajos"
      ),
    contraseña: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .max(100, "La contraseña no puede exceder 100 caracteres"),
    rol: RolUsuarioEnum.optional().default("cliente"),
    activo: z.boolean().optional().default(true),
  }),
});

// Schema para actualizar usuario
export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de usuario inválido"),
  }),
  body: z.object({
    nombreUsuario: z
      .string()
      .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
      .max(50, "El nombre de usuario no puede exceder 50 caracteres")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "El nombre de usuario solo puede contener letras, números, guiones y guiones bajos"
      )
      .optional(),
    contraseña: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .max(100, "La contraseña no puede exceder 100 caracteres")
      .optional(),
    rol: RolUsuarioEnum.optional(),
    activo: z.boolean().optional(),
  }),
});

// Schema para obtener usuario por ID
export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de usuario inválido"),
  }),
});

// Schema para cambiar contraseña
export const changePasswordSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de usuario inválido"),
  }),
  body: z.object({
    contraseñaActual: z.string(),
    contraseñaNueva: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .max(100, "La contraseña no puede exceder 100 caracteres"),
  }),
});
