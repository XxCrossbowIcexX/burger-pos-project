// src/validators/ventaValidators.ts
import { z } from "zod";

const MetodoPagoEnum = z.enum(["efectivo", "transferencia"]);
const EstadoVentaEnum = z.enum(["pendiente", "completada", "cancelada"]);

// Validator para item de venta
const ItemVentaSchema = z.object({
  productoId: z.string().uuid("ID de producto inválido"),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
  precioUnitario: z
    .number()
    .positive("El precio unitario debe ser positivo")
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "El precio unitario debe ser un número positivo",
    }),
  subtotal: z
    .number()
    .nonnegative("El subtotal no puede ser negativo")
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "El subtotal debe ser un número válido",
    }),
  extras: z
    .array(
      z.object({
        ingredienteId: z.string().uuid(),
        cantidad: z.number().int().positive(),
        precioExtra: z.number().nonnegative(),
      })
    )
    .optional()
    .default([]),
  exclusiones: z.array(z.string().uuid()).optional().default([]),
  notas: z.string().optional(),
});

// Validator para crear venta
export const createVentaSchema = z.object({
  body: z.object({
    usuarioId: z.string().uuid("ID de usuario inválido").optional(),
    cajaId: z.string().uuid("ID de caja inválido").optional(),
    items: z
      .array(ItemVentaSchema)
      .min(1, "Debe incluir al menos un item en la venta"),
    totalBase: z
      .number()
      .nonnegative()
      .or(z.string().transform((val) => parseFloat(val)))
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "El total base debe ser un número válido",
      }),
    impuesto: z
      .number()
      .nonnegative()
      .or(z.string().transform((val) => parseFloat(val)))
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "El impuesto debe ser un número válido",
      }),
    totalFinal: z
      .number()
      .positive()
      .or(z.string().transform((val) => parseFloat(val)))
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "El total final debe ser un número positivo",
      }),
    metodoPago: MetodoPagoEnum,
    montoPagado: z
      .number()
      .nonnegative()
      .or(z.string().transform((val) => parseFloat(val)))
      .optional(),
    cambio: z
      .number()
      .nonnegative()
      .or(z.string().transform((val) => parseFloat(val)))
      .optional(),
  }),
});

// Validator para obtener venta por ID
export const getVentaSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de venta inválido"),
  }),
});

// Validator para obtener ventas con filtros
export const getVentasSchema = z.object({
  query: z.object({
    usuarioId: z.string().uuid("ID de usuario inválido").optional(),
    cajaId: z.string().uuid("ID de caja inválido").optional(),
    metodoPago: MetodoPagoEnum.optional(),
    estado: EstadoVentaEnum.optional(),
    fechaInicio: z.string().datetime().optional(),
    fechaFin: z.string().datetime().optional(),
  }),
});

// Validator para actualizar venta
export const updateVentaSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de venta inválido"),
  }),
  body: z.object({
    estado: EstadoVentaEnum.optional(),
    metodoPago: MetodoPagoEnum.optional(),
  }),
});

// Validator para cancelar venta
export const cancelVentaSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de venta inválido"),
  }),
});
