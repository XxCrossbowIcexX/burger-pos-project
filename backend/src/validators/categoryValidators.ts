import { z } from "zod";

// src/validators/categoryValidators.ts
export const createCategorySchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(1, "El nombre es requerido")
      .max(50, "Nombre muy largo"),
    permiteIngredientes: z.boolean().default(true),
    permiteModificar: z.boolean().default(true),
    icono: z.string().max(50, "Icono muy largo").optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de categoría inválido"),
  }),
  body: z.object({
    nombre: z.string().min(1).max(50).optional(),
    permiteIngredientes: z.boolean().optional(),
    permiteModificar: z.boolean().optional(),
    icono: z.string().max(50).optional(),
    activo: z.boolean().optional(),
  }),
});

export const getCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de categoría inválido"),
  }),
});
