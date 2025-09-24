// src/validators/ingredientValidators.ts
import { z } from "zod";

export const createIngredientSchema = z.object({
  body: z
    .object({
      nombre: z
        .string()
        .min(1, "El nombre es requerido")
        .max(50, "Nombre muy largo"),
      tipo: z.enum(["pan", "carne", "queso", "vegetal", "salsa", "otro"], {
        errorMap: () => ({ message: "Tipo de ingrediente inválido" }),
      }),
      estaqueable: z.boolean().default(false),
      puedeSerExtra: z.boolean().default(false),
      precioExtra: z
        .number()
        .min(0, "El precio extra no puede ser negativo")
        .default(0),
      descripcion: z.string().max(200, "Descripción muy larga").optional(),
    })
    .refine(
      (data) => {
        // Si puedeSerExtra es true, precioExtra debe ser >= 0
        if (data.puedeSerExtra && data.precioExtra < 0) {
          return false;
        }
        return true;
      },
      {
        message:
          "Si el ingrediente puede ser extra, debe tener un precio extra válido",
        path: ["precioExtra"],
      }
    ),
});

export const updateIngredientSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de ingrediente inválido"),
  }),
  body: z.object({
    nombre: z.string().min(1).max(50).optional(),
    tipo: z
      .enum(["pan", "carne", "queso", "vegetal", "salsa", "otro"])
      .optional(),
    estaqueable: z.boolean().optional(),
    puedeSerExtra: z.boolean().optional(),
    precioExtra: z.number().min(0).optional(),
    descripcion: z.string().max(200).optional(),
    activo: z.boolean().optional(),
  }),
});

export const getIngredientSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de ingrediente inválido"),
  }),
});
