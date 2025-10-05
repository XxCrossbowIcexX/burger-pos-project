import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

// Crear movimiento (ingreso o retiro)
export const crearMovimiento = async (req: Request, res: Response) => {
  try {
    const { cajaId, tipo, monto, concepto } = req.body;

    // Verificar que la caja existe y está abierta
    const caja = await prisma.caja.findUnique({
      where: { id: cajaId },
    });

    if (!caja) {
      return res.status(404).json({
        success: false,
        error: {
          code: "CAJA_NOT_FOUND",
          message: "Caja no encontrada",
        },
      });
    }

    if (caja.estado === "cerrada") {
      return res.status(400).json({
        success: false,
        error: {
          code: "CAJA_CLOSED",
          message: "No se pueden registrar movimientos en una caja cerrada",
        },
      });
    }

    // Crear el movimiento
    const movimiento = await prisma.movimientoCaja.create({
      data: {
        cajaId,
        tipo,
        monto: parseFloat(monto.toString()),
        concepto,
      },
    });

    // Actualizar los campos de ingresos o retiros según el tipo de movimiento
    if (tipo === "ingreso") {
      await prisma.caja.update({
        where: { id: cajaId },
        data: {
          ingresosExtra: {
            increment: parseFloat(monto.toString()),
          },
        },
      });
    } else if (tipo === "retiro") {
      await prisma.caja.update({
        where: { id: cajaId },
        data: {
          retirosEfectivo: {
            increment: parseFloat(monto.toString()),
          },
        },
      });
    }

    logger.info(
      { movimientoId: movimiento.id, cajaId, tipo, monto },
      "Movimiento de caja creado"
    );

    res.status(201).json({
      success: true,
      data: movimiento,
    });
  } catch (error) {
    logger.error({ err: error }, "Error al crear movimiento de caja");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al crear el movimiento",
      },
    });
  }
};

// Obtener movimientos de una caja
export const getMovimientosByCaja = async (req: Request, res: Response) => {
  try {
    const { cajaId } = req.params;

    const movimientos = await prisma.movimientoCaja.findMany({
      where: { cajaId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: movimientos,
    });
  } catch (error) {
    logger.error({ err: error }, "Error al obtener movimientos de caja");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener los movimientos",
      },
    });
  }
};
