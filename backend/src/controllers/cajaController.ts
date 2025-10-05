// src/controllers/cajaController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

// Abrir nueva caja
export const abrirCaja = async (req: Request, res: Response) => {
  try {
    const { usuarioId, montoInicial } = req.body;

    // Verificar si el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "Usuario no encontrado",
        },
      });
    }

    // Verificar si el usuario ya tiene una caja abierta
    const cajaAbierta = await prisma.caja.findFirst({
      where: {
        usuarioId,
        estado: "abierta",
        activo: true,
      },
    });

    if (cajaAbierta) {
      return res.status(400).json({
        success: false,
        error: {
          code: "CAJA_ALREADY_OPEN",
          message: "El usuario ya tiene una caja abierta",
        },
      });
    }

    // Crear nueva caja
    const caja = await prisma.caja.create({
      data: {
        usuarioId,
        montoInicial: parseFloat(montoInicial.toString()),
        estado: "abierta",
        activo: true,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombreUsuario: true,
            rol: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: caja,
    });
  } catch (error) {
    logger.error({ err: error }, "Error al abrir caja");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al abrir la caja",
      },
    });
  }
};

// Cerrar caja
export const cerrarCaja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { montoFinal } = req.body;

    // Buscar la caja
    const caja = await prisma.caja.findUnique({
      where: { id },
      include: {
        ventas: true,
      },
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
          code: "CAJA_ALREADY_CLOSED",
          message: "La caja ya está cerrada",
        },
      });
    }

    // Calcular totales de ventas
    const ventasEfectivo = caja.ventas
      .filter((v) => v.metodoPago === "efectivo")
      .reduce((sum, v) => sum + parseFloat(v.totalFinal.toString()), 0);

    const ventasTransferencia = caja.ventas
      .filter((v) => v.metodoPago === "transferencia")
      .reduce((sum, v) => sum + parseFloat(v.totalFinal.toString()), 0);

    const totalVentas = ventasEfectivo + ventasTransferencia;
    const montoFinalNum = parseFloat(montoFinal.toString());
    const montoInicialNum = parseFloat(caja.montoInicial.toString());

    // Obtener ingresos y retiros de la caja
    const ingresosExtra = parseFloat(caja.ingresosExtra.toString());
    const retirosEfectivo = parseFloat(caja.retirosEfectivo.toString());

    // Calcular diferencia: MontoFinal - (MontoInicial + VentasEfectivo + IngresosExtra - RetirosEfectivo)
    const montoEsperado = montoInicialNum + ventasEfectivo + ingresosExtra - retirosEfectivo;
    const diferencia = montoFinalNum - montoEsperado;

    // Actualizar caja
    const cajaActualizada = await prisma.caja.update({
      where: { id },
      data: {
        montoFinal: montoFinalNum,
        ventasEfectivo,
        ventasTransferencia,
        totalVentas,
        diferencia,
        estado: "cerrada",
        fechaCierre: new Date(),
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombreUsuario: true,
            rol: true,
          },
        },
        ventas: true,
      },
    });

    res.status(200).json({
      success: true,
      data: cajaActualizada,
    });
  } catch (error) {
    logger.error({ err: error, cajaId: req.params.id }, "Error al cerrar caja");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al cerrar la caja",
      },
    });
  }
};

// Obtener todas las cajas con filtros
export const getCajas = async (req: Request, res: Response) => {
  try {
    const { usuarioId, estado, activo, fechaInicio, fechaFin } = req.query;

    const where: any = {};

    // Filtro por usuario
    if (usuarioId) {
      where.usuarioId = usuarioId as string;
    }

    // Filtro por estado
    if (estado) {
      where.estado = estado as string;
    }

    // Filtro por activo
    if (activo !== "all" && activo !== undefined) {
      where.activo = activo === "false" ? false : true;
    }

    // Filtro por rango de fechas
    if (fechaInicio || fechaFin) {
      where.fechaApertura = {};
      if (fechaInicio) {
        where.fechaApertura.gte = new Date(fechaInicio as string);
      }
      if (fechaFin) {
        where.fechaApertura.lte = new Date(fechaFin as string);
      }
    }

    const cajas = await prisma.caja.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombreUsuario: true,
            rol: true,
          },
        },
        _count: {
          select: {
            ventas: true,
          },
        },
      },
      orderBy: {
        fechaApertura: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: cajas,
    });
  } catch (error) {
    logger.error({ err: error }, "Error al obtener cajas");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener las cajas",
      },
    });
  }
};

// Obtener caja por ID
export const getCajaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const caja = await prisma.caja.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nombreUsuario: true,
            rol: true,
          },
        },
        ventas: {
          include: {
            items: {
              include: {
                producto: true,
              },
            },
          },
        },
      },
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

    res.status(200).json({
      success: true,
      data: caja,
    });
  } catch (error) {
    logger.error({ err: error, cajaId: req.params.id }, "Error al obtener caja");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener la caja",
      },
    });
  }
};

// Actualizar caja
export const updateCaja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const caja = await prisma.caja.findUnique({
      where: { id },
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

    // Convertir valores decimales si existen
    if (updateData.montoInicial) {
      updateData.montoInicial = parseFloat(updateData.montoInicial.toString());
    }
    if (updateData.montoFinal) {
      updateData.montoFinal = parseFloat(updateData.montoFinal.toString());
    }

    const cajaActualizada = await prisma.caja.update({
      where: { id },
      data: updateData,
      include: {
        usuario: {
          select: {
            id: true,
            nombreUsuario: true,
            rol: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: cajaActualizada,
    });
  } catch (error) {
    logger.error({ err: error, cajaId: req.params.id }, "Error al actualizar caja");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al actualizar la caja",
      },
    });
  }
};

// Eliminar caja (soft delete)
export const deleteCaja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const caja = await prisma.caja.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ventas: true,
          },
        },
      },
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

    // Si tiene ventas, solo desactivar
    if (caja._count.ventas > 0) {
      const cajaDesactivada = await prisma.caja.update({
        where: { id },
        data: { activo: false },
      });

      return res.status(200).json({
        success: true,
        data: cajaDesactivada,
        message: "Caja desactivada (tiene ventas asociadas)",
      });
    }

    // Si no tiene ventas, eliminar físicamente
    await prisma.caja.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Caja eliminada correctamente",
    });
  } catch (error) {
    logger.error({ err: error, cajaId: req.params.id }, "Error al eliminar caja");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al eliminar la caja",
      },
    });
  }
};

// Obtener caja abierta del usuario
export const getCajaAbierta = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "USUARIO_ID_REQUIRED",
          message: "Se requiere el ID del usuario",
        },
      });
    }

    const cajaAbierta = await prisma.caja.findFirst({
      where: {
        usuarioId: usuarioId as string,
        estado: "abierta",
        activo: true,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombreUsuario: true,
            rol: true,
          },
        },
        _count: {
          select: {
            ventas: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: cajaAbierta,
    });
  } catch (error) {
    logger.error({ err: error }, "Error al obtener caja abierta");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener la caja abierta",
      },
    });
  }
};
