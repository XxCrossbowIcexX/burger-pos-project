// src/controllers/productoController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProducts = async (req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
        ingredientes: {
          include: {
            ingrediente: true,
          },
        },
      },
      orderBy: {
        nombre: "asc",
      },
    });

    res.json({
      success: true,
      count: productos.length,
      data: productos,
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener productos",
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
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
      return res.status(404).json({
        success: false,
        error: "Producto no encontrado",
      });
    }

    res.json({
      success: true,
      data: producto,
    });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener producto",
    });
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoriaId } = req.params;
    const productos = await prisma.producto.findMany({
      where: { categoriaId },
      include: {
        categoria: true,
        ingredientes: {
          include: {
            ingrediente: true,
          },
        },
      },
      orderBy: {
        nombre: "asc",
      },
    });
    res.json({
      success: true,
      count: productos.length,
      data: productos,
    });
  } catch (error) {
    console.error("Error al obtener productos por categoría: ", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener productos por categoría",
    });
  } finally {
    await prisma.$disconnect();
  }
};
