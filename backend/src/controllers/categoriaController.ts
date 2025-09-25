// src/controllers/categoriaController.ts
import { Request, Response } from "express";
import prisma from "../config/database";
import { catchAsync, CustomError } from "../middlewares/errorHandler";

export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 50,
    activo = true,
    includeProductCount = false,
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {
    ...(activo !== undefined && { activo: activo === "true" }),
  };

  const includeOptions =
    includeProductCount === "true"
      ? {
          _count: {
            select: { productos: true },
          },
        }
      : {};

  const [categorias, total] = await Promise.all([
    prisma.categoria.findMany({
      where,
      include: includeOptions,
      orderBy: { nombre: "asc" },
      skip,
      take,
    }),
    prisma.categoria.count({ where }),
  ]);

  res.json({
    success: true,
    data: categorias,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / take),
      count: categorias.length,
      total,
    },
  });
});

export const getCategoriesSimple = catchAsync(
  async (req: Request, res: Response) => {
    const categories = await prisma.categoria.findMany({
      select: {
        id: true,
        nombre: true,
        icono: true,
        permiteIngredientes: true,
        permiteModificar: true,
      },
    });

    res.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  }
);

export const getCategoryById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { includeProducts = false } = req.query;

    const includeOptions =
      includeProducts === "true"
        ? {
            productos: {
              where: { activo: true },
              select: {
                id: true,
                nombre: true,
                precioBase: true,
                descripcion: true,
                activo: true,
              },
            },
          }
        : {};

    const categoria = await prisma.categoria.findUnique({
      where: { id },
      include: {
        ...includeOptions,
        _count: {
          select: { productos: true },
        },
      },
    });

    if (!categoria) {
      throw new CustomError("Categoría no encontrada", 404);
    }

    res.json({
      success: true,
      data: categoria,
    });
  }
);

export const createCategory = catchAsync(
  async (req: Request, res: Response) => {
    const {
      nombre,
      permiteIngredientes = true,
      permiteModificar = true,
      icono,
    } = req.body;

    const categoria = await prisma.categoria.create({
      data: {
        nombre,
        permiteIngredientes,
        permiteModificar,
        icono,
      },
    });

    res.status(201).json({
      success: true,
      message: "Categoría creada exitosamente",
      data: categoria,
    });
  }
);

export const updateCategory = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const categoria = await prisma.categoria.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: { productos: true },
        },
      },
    });

    res.json({
      success: true,
      message: "Categoría actualizada exitosamente",
      data: categoria,
    });
  }
);

export const deleteCategory = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Verificar si la categoría tiene productos
    const productosEnCategoria = await prisma.producto.count({
      where: { categoriaId: id },
    });

    if (productosEnCategoria > 0) {
      // Soft delete si tiene productos
      const categoria = await prisma.categoria.update({
        where: { id },
        data: { activo: false },
      });

      return res.json({
        success: true,
        message: `Categoría desactivada exitosamente. Tiene ${productosEnCategoria} producto(s) asociado(s).`,
        data: { id: categoria.id, productosAfectados: productosEnCategoria },
      });
    }

    // Hard delete si no tiene productos
    await prisma.categoria.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Categoría eliminada exitosamente",
      data: { id },
    });
  }
);

export const getCategoryStats = catchAsync(
  async (req: Request, res: Response) => {
    const stats = await prisma.categoria.findMany({
      select: {
        id: true,
        nombre: true,
        _count: {
          select: {
            productos: {
              where: { activo: true },
            },
          },
        },
      },
      where: { activo: true },
    });

    const totalCategorias = stats.length;
    const totalProductos = stats.reduce(
      (sum, cat) => sum + cat._count.productos,
      0
    );

    res.json({
      success: true,
      data: {
        totalCategorias,
        totalProductos,
        categorias: stats.map((cat) => ({
          id: cat.id,
          nombre: cat.nombre,
          cantidadProductos: cat._count.productos,
        })),
      },
    });
  }
);
