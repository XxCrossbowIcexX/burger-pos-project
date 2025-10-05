import { z } from "zod";

export const getConfiguracionesSchema = z.object({
  query: z.object({
    categoria: z.string().optional(),
  }),
});

export const getConfiguracionSchema = z.object({
  params: z.object({
    clave: z.string().min(1, "La clave es requerida"),
  }),
});

export const createConfiguracionSchema = z.object({
  body: z.object({
    clave: z.string().min(1, "La clave es requerida"),
    valor: z.string().min(1, "El valor es requerido"),
    tipo: z.enum(["string", "number", "boolean", "json"]).default("string"),
    descripcion: z.string().optional(),
    categoria: z.string().default("general"),
  }),
});

export const updateConfiguracionSchema = z.object({
  params: z.object({
    clave: z.string().min(1, "La clave es requerida"),
  }),
  body: z.object({
    valor: z.string().min(1, "El valor es requerido"),
    descripcion: z.string().optional(),
  }),
});

export const deleteConfiguracionSchema = z.object({
  params: z.object({
    clave: z.string().min(1, "La clave es requerida"),
  }),
});
