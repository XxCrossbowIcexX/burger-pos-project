import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

// Obtener todas las configuraciones
export const getConfiguraciones = async (req: Request, res: Response) => {
  try {
    const { categoria } = req.query;

    const where: any = {};
    if (categoria) {
      where.categoria = categoria;
    }

    const configuraciones = await prisma.configuracion.findMany({
      where,
      orderBy: {
        categoria: "asc",
      },
    });

    res.status(200).json({
      success: true,
      count: configuraciones.length,
      data: configuraciones,
    });
  } catch (error) {
    logger.error({ err: error }, "Error al obtener configuraciones");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener las configuraciones",
      },
    });
  }
};

// Obtener una configuración por clave
export const getConfiguracionByClave = async (req: Request, res: Response) => {
  try {
    const { clave } = req.params;

    const configuracion = await prisma.configuracion.findUnique({
      where: { clave },
    });

    if (!configuracion) {
      return res.status(404).json({
        success: false,
        error: {
          code: "CONFIGURACION_NOT_FOUND",
          message: "Configuración no encontrada",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: configuracion,
    });
  } catch (error) {
    logger.error({ err: error, clave: req.params.clave }, "Error al obtener configuración");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener la configuración",
      },
    });
  }
};

// Crear una configuración
export const createConfiguracion = async (req: Request, res: Response) => {
  try {
    const { clave, valor, tipo, descripcion, categoria } = req.body;

    const configuracionExistente = await prisma.configuracion.findUnique({
      where: { clave },
    });

    if (configuracionExistente) {
      return res.status(400).json({
        success: false,
        error: {
          code: "CONFIGURACION_ALREADY_EXISTS",
          message: "Ya existe una configuración con esa clave",
        },
      });
    }

    const configuracion = await prisma.configuracion.create({
      data: {
        clave,
        valor,
        tipo,
        descripcion,
        categoria,
      },
    });

    res.status(201).json({
      success: true,
      data: configuracion,
    });
  } catch (error) {
    logger.error({ err: error }, "Error al crear configuración");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al crear la configuración",
      },
    });
  }
};

// Actualizar una configuración
export const updateConfiguracion = async (req: Request, res: Response) => {
  try {
    const { clave } = req.params;
    const { valor, descripcion } = req.body;

    const configuracion = await prisma.configuracion.update({
      where: { clave },
      data: {
        valor,
        descripcion,
      },
    });

    res.status(200).json({
      success: true,
      data: configuracion,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: {
          code: "CONFIGURACION_NOT_FOUND",
          message: "Configuración no encontrada",
        },
      });
    }

    logger.error({ err: error, clave: req.params.clave }, "Error al actualizar configuración");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al actualizar la configuración",
      },
    });
  }
};

// Eliminar una configuración
export const deleteConfiguracion = async (req: Request, res: Response) => {
  try {
    const { clave } = req.params;

    await prisma.configuracion.delete({
      where: { clave },
    });

    res.status(200).json({
      success: true,
      message: "Configuración eliminada correctamente",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: {
          code: "CONFIGURACION_NOT_FOUND",
          message: "Configuración no encontrada",
        },
      });
    }

    logger.error({ err: error, clave: req.params.clave }, "Error al eliminar configuración");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al eliminar la configuración",
      },
    });
  }
};

// Inicializar configuraciones por defecto
export const initConfiguraciones = async () => {
  try {
    const configuracionesDefault = [
      {
        clave: "iva_porcentaje",
        valor: "22",
        tipo: "number",
        descripcion: "Porcentaje de IVA aplicado a las ventas",
        categoria: "impuestos",
      },
      {
        clave: "nombre_negocio",
        valor: "Burger POS",
        tipo: "string",
        descripcion: "Nombre del negocio",
        categoria: "general",
      },
      {
        clave: "moneda",
        valor: "$",
        tipo: "string",
        descripcion: "Símbolo de la moneda",
        categoria: "general",
      },
    ];

    for (const config of configuracionesDefault) {
      const existe = await prisma.configuracion.findUnique({
        where: { clave: config.clave },
      });

      if (!existe) {
        await prisma.configuracion.create({
          data: config,
        });
      }
    }

    logger.info("Configuraciones inicializadas correctamente");
  } catch (error) {
    logger.error({ err: error }, "Error al inicializar configuraciones");
  }
};
