import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { pid } from "process";

const prisma = new PrismaClient();

export const getExtras = async (req: Request, res: Response) => {
  try {
    const ingredientes = await prisma.ingrediente.findMany({
      where: {
        puedeSerExtra: true,
      },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        estaqueable: true,
        precioExtra: true,
      },
    });
    res.json({
      success: true,
      count: ingredientes.length,
      data: ingredientes,
    });
  } catch (error) {
    console.log("Error al obtener los extras: ", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los extras.",
    });
  } finally {
    await prisma.$disconnect;
  }
};
