// src/controllers/ingredienteController.ts
import { Request, Response } from "express";
import prisma from "../config/database";
import { catchAsync, CustomError } from "../middlewares/errorHandler";

export const getIngredients = catchAsync(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 50,
      activo = true,
      tipo,
      puedeSerExtra,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Import or define your enum for TipoIngrediente at the top if not already imported
    // import { TipoIngrediente } from '@prisma/client';

    const where = {
      ...(activo !== undefined && { activo: activo === "true" }),
      ...(tipo && { tipo: tipo as any }), // Cast to enum type if needed, or use TipoIngrediente[tipo as keyof typeof TipoIngrediente]
      ...(puedeSerExtra !== undefined && {
        puedeSerExtra: puedeSerExtra === "true",
      }),
    };

    const [ingredientes, total] = await Promise.all([
      prisma.ingrediente.findMany({
        where,
        orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
        skip,
        take,
      }),
      prisma.ingrediente.count({ where }),
    ]);

    res.json({
      success: true,
      data: ingredientes,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / take),
        count: ingredientes.length,
        total,
      },
    });
  }
);

export const getExtras = catchAsync(async (req: Request, res: Response) => {
  const { activo = true } = req.query;

  const ingredientes = await prisma.ingrediente.findMany({
    where: {
      puedeSerExtra: true,
      ...(activo !== undefined && { activo: activo === "true" }),
    },
    select: {
      id: true,
      nombre: true,
      tipo: true,
      estaqueable: true,
      precioExtra: true,
      descripcion: true,
    },
    orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
  });

  // Agrupar por tipo para mejor organización en el frontend
  const ingredientesPorTipo = ingredientes.reduce((acc, ingrediente) => {
    const tipo = ingrediente.tipo;
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(ingrediente);
    return acc;
  }, {} as Record<string, typeof ingredientes>);

  res.json({
    success: true,
    count: ingredientes.length,
    data: ingredientes,
    groupedByType: ingredientesPorTipo,
  });
});

export const getIngredientById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const ingrediente = await prisma.ingrediente.findUnique({
      where: { id },
      include: {
        productos: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                categoria: {
                  select: { nombre: true },
                },
              },
            },
          },
        },
      },
    });

    if (!ingrediente) {
      throw new CustomError("Ingrediente no encontrado", 404);
    }

    res.json({
      success: true,
      data: ingrediente,
    });
  }
);

export const createIngredient = catchAsync(
  async (req: Request, res: Response) => {
    const {
      nombre,
      tipo,
      estaqueable = false,
      puedeSerExtra = false,
      precioExtra = 0,
      descripcion,
    } = req.body;

    const ingrediente = await prisma.ingrediente.create({
      data: {
        nombre,
        tipo,
        estaqueable,
        puedeSerExtra,
        precioExtra: puedeSerExtra ? precioExtra : 0,
        descripcion,
      },
    });

    res.status(201).json({
      success: true,
      message: "Ingrediente creado exitosamente",
      data: ingrediente,
    });
  }
);

export const updateIngredient = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Si cambia puedeSerExtra a false, resetear precioExtra
    if (updateData.puedeSerExtra === false) {
      updateData.precioExtra = 0;
    }

    const ingrediente = await prisma.ingrediente.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Ingrediente actualizado exitosamente",
      data: ingrediente,
    });
  }
);

export const deleteIngredient = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Verificar si el ingrediente está siendo usado en productos
    const productosUsandoIngrediente = await prisma.productoIngrediente.count({
      where: { ingredienteId: id },
    });

    if (productosUsandoIngrediente > 0) {
      // Soft delete si está en uso
      const ingrediente = await prisma.ingrediente.update({
        where: { id },
        data: { activo: false },
      });

      return res.json({
        success: true,
        message: `Ingrediente desactivado exitosamente. Se encontró en ${productosUsandoIngrediente} producto(s).`,
        data: {
          id: ingrediente.id,
          productosAfectados: productosUsandoIngrediente,
        },
      });
    }

    // Hard delete si no está en uso
    await prisma.ingrediente.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Ingrediente eliminado exitosamente",
      data: { id },
    });
  }
);

export const getIngredientTypes = catchAsync(
  async (req: Request, res: Response) => {
    const tipos = await prisma.ingrediente.groupBy({
      by: ["tipo"],
      _count: {
        tipo: true,
      },
      where: {
        activo: true,
      },
    });

    res.json({
      success: true,
      data: tipos.map((t) => ({
        tipo: t.tipo,
        count: t._count.tipo,
      })),
    });
  }
);
