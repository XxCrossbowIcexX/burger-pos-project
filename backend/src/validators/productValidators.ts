// src/validators/productValidators.ts
import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(1, "El nombre es requerido")
      .max(100, "Nombre muy largo"),
    categoriaId: z.string().uuid("ID de categoría inválido"),
    precioBase: z.number().positive("El precio debe ser positivo"),
    descripcion: z.string().optional(),
    codigo: z.string().optional(),
    permiteExtras: z.boolean().default(true),
    permiteExclusiones: z.boolean().default(true),
    ingredientes: z
      .array(
        z.object({
          ingredienteId: z.string().uuid(),
          cantidad: z.number().positive().default(1),
          esExtraOpcional: z.boolean().default(false),
          precioIncluido: z.number().default(0),
        })
      )
      .optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de producto inválido"),
  }),
  body: z.object({
    nombre: z.string().min(1).max(100).optional(),
    categoriaId: z.string().uuid().optional(),
    precioBase: z.number().positive().optional(),
    descripcion: z.string().optional(),
    codigo: z.string().optional(),
    permiteExtras: z.boolean().optional(),
    permiteExclusiones: z.boolean().optional(),
    activo: z.boolean().optional(),
  }),
});

export const getProductSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de producto inválido"),
  }),
});

export const getProductsByCategorySchema = z.object({
  params: z.object({
    categoriaId: z.string().uuid("ID de categoría inválido"),
  }),
});
