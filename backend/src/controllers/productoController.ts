// src/controllers/productoController.ts
import { Request, Response } from "express";
import prisma from "../config/database";
import { catchAsync, CustomError } from "../middlewares/errorHandler";

export const getProducts = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, activo = true, categoriaId } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {
    ...(activo !== undefined && { activo: activo === "true" }),
    ...(categoriaId && { categoriaId: String(categoriaId) }),
  };

  const [productos, total] = await Promise.all([
    prisma.producto.findMany({
      where,
      include: {
        categoria: {
          select: { id: true, nombre: true, icono: true },
        },
        ingredientes: {
          include: {
            ingrediente: {
              select: {
                id: true,
                nombre: true,
                tipo: true,
                puedeSerExtra: true,
                precioExtra: true,
                estaqueable: true,
              },
            },
          },
        },
      },
      orderBy: { nombre: "asc" },
      skip,
      take,
    }),
    prisma.producto.count({ where }),
  ]);

  res.json({
    success: true,
    data: productos,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / take),
      count: productos.length,
      total,
    },
  });
});

export const getProductById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        ingredientes: {
          include: {
            ingrediente: true,
          },
        },
      },
    });

    if (!producto) {
      throw new CustomError("Producto no encontrado", 404);
    }

    res.json({
      success: true,
      data: producto,
    });
  }
);

export const getProductsByCategory = catchAsync(
  async (req: Request, res: Response) => {
    const { categoriaId } = req.params;
    const { activo = true } = req.query;

    // Verificar que la categoría existe
    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId },
    });

    if (!categoria) {
      throw new CustomError("Categoría no encontrada", 404);
    }

    const productos = await prisma.producto.findMany({
      where: {
        categoriaId,
        ...(activo !== undefined && { activo: activo === "true" }),
      },
      include: {
        categoria: {
          select: { id: true, nombre: true, icono: true },
        },
        ingredientes: {
          include: {
            ingrediente: {
              select: {
                id: true,
                nombre: true,
                tipo: true,
                puedeSerExtra: true,
                precioExtra: true,
                estaqueable: true,
              },
            },
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    res.json({
      success: true,
      data: productos,
      count: productos.length,
      categoria: {
        id: categoria.id,
        nombre: categoria.nombre,
      },
    });
  }
);

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const {
    nombre,
    categoriaId,
    precioBase,
    descripcion,
    codigo,
    permiteExtras = true,
    permiteExclusiones = true,
    ingredientes = [],
  } = req.body;

  // Verificar que la categoría existe
  const categoria = await prisma.categoria.findUnique({
    where: { id: categoriaId },
  });

  if (!categoria) {
    throw new CustomError("Categoría no encontrada", 404);
  }

  // Crear producto con transacción
  const producto = await prisma.$transaction(async (tx) => {
    const nuevoProducto = await tx.producto.create({
      data: {
        nombre,
        categoriaId,
        precioBase,
        descripcion,
        codigo: codigo || `PROD-${Date.now()}`,
        permiteExtras,
        permiteExclusiones,
      },
      include: {
        categoria: true,
      },
    });

    // Agregar ingredientes si se proporcionan
    if (ingredientes.length > 0) {
      await tx.productoIngrediente.createMany({
        data: ingredientes.map((ing: any) => ({
          productoId: nuevoProducto.id,
          ingredienteId: ing.ingredienteId,
          cantidad: ing.cantidad || 1,
          esExtraOpcional: ing.esExtraOpcional || false,
          precioIncluido: ing.precioIncluido || 0,
        })),
      });
    }

    return nuevoProducto;
  });

  res.status(201).json({
    success: true,
    message: "Producto creado exitosamente",
    data: producto,
  });
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      ...updateData,
      updatedAt: new Date(),
    },
    include: {
      categoria: true,
      ingredientes: {
        include: {
          ingrediente: true,
        },
      },
    },
  });

  res.json({
    success: true,
    message: "Producto actualizado exitosamente",
    data: producto,
  });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Soft delete
  const producto = await prisma.producto.update({
    where: { id },
    data: { activo: false },
  });

  res.json({
    success: true,
    message: "Producto desactivado exitosamente",
    data: { id: producto.id },
  });
});
