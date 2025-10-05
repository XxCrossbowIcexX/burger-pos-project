// src/validators/cajaValidators.ts
import { z } from "zod";

const EstadoCajaEnum = z.enum(["abierta", "cerrada"]);

// Validator para abrir caja
export const abrirCajaSchema = z.object({
  body: z.object({
    usuarioId: z.string().uuid("ID de usuario inválido"),
    montoInicial: z
      .number()
      .positive("El monto inicial debe ser positivo")
      .or(z.string().transform((val) => parseFloat(val)))
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "El monto inicial debe ser un número positivo",
      }),
  }),
});

// Validator para cerrar caja
export const cerrarCajaSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de caja inválido"),
  }),
  body: z.object({
    montoFinal: z
      .number()
      .nonnegative("El monto final no puede ser negativo")
      .or(z.string().transform((val) => parseFloat(val)))
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "El monto final debe ser un número válido",
      }),
  }),
});

// Validator para obtener caja por ID
export const getCajaSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de caja inválido"),
  }),
});

// Validator para obtener cajas con filtros
export const getCajasSchema = z.object({
  query: z.object({
    usuarioId: z.string().uuid("ID de usuario inválido").optional(),
    estado: EstadoCajaEnum.optional(),
    activo: z
      .string()
      .refine((val) => val === "true" || val === "false" || val === "all", {
        message: "activo debe ser 'true', 'false' o 'all'",
      })
      .optional()
      .default("true"),
    fechaInicio: z.string().datetime().optional(),
    fechaFin: z.string().datetime().optional(),
  }),
});

// Validator para actualizar caja
export const updateCajaSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de caja inválido"),
  }),
  body: z.object({
    montoInicial: z
      .number()
      .positive()
      .or(z.string().transform((val) => parseFloat(val)))
      .optional(),
    montoFinal: z
      .number()
      .nonnegative()
      .or(z.string().transform((val) => parseFloat(val)))
      .optional(),
    estado: EstadoCajaEnum.optional(),
    activo: z.boolean().optional(),
  }),
});

// Validator para eliminar caja
export const deleteCajaSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de caja inválido"),
  }),
});
