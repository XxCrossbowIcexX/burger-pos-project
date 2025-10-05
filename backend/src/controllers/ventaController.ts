// src/controllers/ventaController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

// Generar número de ticket
const generarNumeroTicket = async (): Promise<string> => {
  const hoy = new Date();
  const fecha = hoy.toISOString().split("T")[0].replace(/-/g, "");

  const ultimaVenta = await prisma.venta.findFirst({
    where: {
      createdAt: {
        gte: new Date(hoy.setHours(0, 0, 0, 0)),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let contador = 1;
  if (ultimaVenta) {
    const ultimoNumero = ultimaVenta.id.split("-")[0];
    if (ultimoNumero.startsWith(fecha)) {
      contador = parseInt(ultimoNumero.slice(-4)) + 1;
    }
  }

  return `${fecha}-${contador.toString().padStart(4, "0")}`;
};

// Crear venta
export const createVenta = async (req: Request, res: Response) => {
  try {
    const {
      usuarioId,
      cajaId,
      items,
      totalBase,
      impuesto,
      totalFinal,
      metodoPago,
      tipoEntrega = "local",
      montoPagado,
      cambio,
    } = req.body;

    // Verificar que haya items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_ITEMS",
          message: "La venta debe tener al menos un item",
        },
      });
    }

    // Verificar caja si se proporciona
    if (cajaId) {
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
            message: "La caja está cerrada",
          },
        });
      }
    }

    // Si no hay usuarioId, buscar un usuario por defecto (el primero disponible)
    let finalUsuarioId = usuarioId;
    if (!finalUsuarioId) {
      const defaultUser = await prisma.usuario.findFirst({
        where: { activo: true },
      });
      if (defaultUser) {
        finalUsuarioId = defaultUser.id;
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: "NO_USER_AVAILABLE",
            message: "No hay usuarios disponibles para asignar la venta",
          },
        });
      }
    }

    // Crear venta con items
    const venta = await prisma.venta.create({
      data: {
        usuarioId: finalUsuarioId,
        cajaId: cajaId || null,
        totalBase: parseFloat(totalBase.toString()),
        impuesto: parseFloat(impuesto.toString()),
        totalFinal: parseFloat(totalFinal.toString()),
        metodoPago,
        tipoEntrega,
        estado: "pendiente", // Cambiado a pendiente para que aparezca en cocina
        items: {
          create: items.map((item: any) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioBase: parseFloat(item.precioUnitario.toString()),
            totalItem: parseFloat(item.subtotal.toString()),
            extrasSeleccionados: JSON.stringify(item.extras || []),
            ingredientesModificados:
              item.exclusiones && item.exclusiones.length > 0
                ? JSON.stringify({ exclusiones: item.exclusiones })
                : null,
          })),
        },
      },
      include: {
        items: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nombreUsuario: true,
            rol: true,
          },
        },
        caja: true,
      },
    });

    // Actualizar totales de la caja si existe
    if (cajaId) {
      const totalVentaFinal = parseFloat(totalFinal.toString());

      await prisma.caja.update({
        where: { id: cajaId },
        data: {
          ventasEfectivo: {
            increment: metodoPago === "efectivo" ? totalVentaFinal : 0,
          },
          ventasTransferencia: {
            increment: metodoPago === "transferencia" ? totalVentaFinal : 0,
          },
          totalVentas: {
            increment: totalVentaFinal,
          },
        },
      });
    }

    // Generar ticket de impresión
    const ticket = generarTicket(venta, metodoPago, montoPagado, cambio);

    res.status(201).json({
      success: true,
      data: venta,
      ticket,
    });
  } catch (error: any) {
    logger.error({ err: error, details: error.message }, "Error al crear venta");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al crear la venta",
        details: error.message,
      },
    });
  }
};

// Generar ticket de impresión
const generarTicket = (
  venta: any,
  metodoPago: string,
  montoPagado?: number,
  cambio?: number
): string => {
  const fecha = new Date(venta.createdAt);
  const fechaFormateada = fecha.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  let ticket = `
╔══════════════════════════════════════╗
║         BURGER POS - TICKET          ║
╚══════════════════════════════════════╝

Ticket #: ${venta.id.substring(0, 12)}
Fecha: ${fechaFormateada}
${venta.usuario ? `Atendido por: ${venta.usuario.nombreUsuario}` : ""}
${venta.caja ? `Caja: ${venta.caja.id.substring(0, 8)}` : ""}

────────────────────────────────────────
PRODUCTOS
────────────────────────────────────────
`;

  venta.items.forEach((item: any) => {
    const nombreProducto = item.producto.nombre.padEnd(25);
    const cantidad = `x${item.cantidad}`.padStart(3);
    const precio = `$${parseFloat(item.totalItem.toString()).toFixed(
      2
    )}`.padStart(8);

    ticket += `${nombreProducto} ${cantidad} ${precio}\n`;

    if (item.notas) {
      ticket += `  Nota: ${item.notas}\n`;
    }

    // Parse JSON fields
    const extras =
      typeof item.extrasSeleccionados === "string"
        ? JSON.parse(item.extrasSeleccionados)
        : item.extrasSeleccionados;

    const modificados = item.ingredientesModificados
      ? typeof item.ingredientesModificados === "string"
        ? JSON.parse(item.ingredientesModificados)
        : item.ingredientesModificados
      : null;

    if (extras && extras.length > 0) {
      ticket += `  Extras: ${extras.length} items\n`;
    }

    if (
      modificados &&
      modificados.exclusiones &&
      modificados.exclusiones.length > 0
    ) {
      ticket += `  Sin: ${modificados.exclusiones.length} ingredientes\n`;
    }
  });

  ticket += `
────────────────────────────────────────
Subtotal:                    $${parseFloat(venta.totalBase.toString()).toFixed(
    2
  )}
Impuesto:                    $${parseFloat(venta.impuesto.toString()).toFixed(
    2
  )}
────────────────────────────────────────
TOTAL:                       $${parseFloat(venta.totalFinal.toString()).toFixed(
    2
  )}
────────────────────────────────────────
`;

  if (metodoPago === "efectivo") {
    ticket += `
Método de Pago: EFECTIVO
Monto Pagado:                $${montoPagado?.toFixed(2) || "0.00"}
Cambio:                      $${cambio?.toFixed(2) || "0.00"}
`;
  } else {
    ticket += `
Método de Pago: TRANSFERENCIA
`;
  }

  ticket += `
────────────────────────────────────────
       ¡Gracias por su compra!
           Vuelva pronto :)
────────────────────────────────────────
`;

  return ticket;
};

// Obtener todas las ventas con filtros
export const getVentas = async (req: Request, res: Response) => {
  try {
    const { usuarioId, cajaId, metodoPago, estado, fechaInicio, fechaFin } =
      req.query;

    const where: any = {};

    if (usuarioId) {
      where.usuarioId = usuarioId as string;
    }

    if (cajaId) {
      where.cajaId = cajaId as string;
    }

    if (metodoPago) {
      where.metodoPago = metodoPago as string;
    }

    if (estado) {
      where.estado = estado as string;
    }

    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) {
        where.createdAt.gte = new Date(fechaInicio as string);
      }
      if (fechaFin) {
        where.createdAt.lte = new Date(fechaFin as string);
      }
    }

    const ventas = await prisma.venta.findMany({
      where,
      include: {
        items: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nombreUsuario: true,
            rol: true,
          },
        },
        caja: {
          select: {
            id: true,
            estado: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Obtener todos los ingredientes para mapear nombres
    const ingredientes = await prisma.ingrediente.findMany();
    const ingredientesMap = new Map(ingredientes.map(ing => [ing.id, ing]));

    // Enriquecer los items con información de ingredientes
    const ventasEnriquecidas = ventas.map(venta => ({
      ...venta,
      items: venta.items.map(item => {
        // Parsear extras
        let extras: any[] = [];
        try {
          const extrasJson = typeof item.extrasSeleccionados === 'string'
            ? JSON.parse(item.extrasSeleccionados)
            : item.extrasSeleccionados;
          extras = Array.isArray(extrasJson) ? extrasJson.map((e: any) => ({
            cantidad: e.cantidad,
            ingrediente: ingredientesMap.get(e.ingredienteId) || { id: e.ingredienteId, nombre: 'Desconocido' }
          })) : [];
        } catch {}

        // Parsear exclusiones
        let exclusiones: any[] = [];
        try {
          if (item.ingredientesModificados) {
            const modificaciones = typeof item.ingredientesModificados === 'string'
              ? JSON.parse(item.ingredientesModificados as string)
              : item.ingredientesModificados;
            if (modificaciones?.exclusiones && Array.isArray(modificaciones.exclusiones)) {
              exclusiones = modificaciones.exclusiones.map((id: string) => ({
                ingrediente: ingredientesMap.get(id) || { id, nombre: 'Desconocido' }
              }));
            }
          }
        } catch {}

        return {
          ...item,
          extras,
          exclusiones
        };
      })
    }));

    res.status(200).json({
      success: true,
      data: ventasEnriquecidas,
    });
  } catch (error) {
    logger.error({ err: error }, "Error al obtener ventas");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener las ventas",
      },
    });
  }
};

// Obtener venta por ID
export const getVentaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const venta = await prisma.venta.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nombreUsuario: true,
            rol: true,
          },
        },
        caja: true,
      },
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        error: {
          code: "VENTA_NOT_FOUND",
          message: "Venta no encontrada",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: venta,
    });
  } catch (error) {
    logger.error({ err: error, ventaId: req.params.id }, "Error al obtener venta");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener la venta",
      },
    });
  }
};

// Actualizar venta
export const updateVenta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const venta = await prisma.venta.findUnique({
      where: { id },
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        error: {
          code: "VENTA_NOT_FOUND",
          message: "Venta no encontrada",
        },
      });
    }

    const ventaActualizada = await prisma.venta.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            producto: true,
          },
        },
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
      data: ventaActualizada,
    });
  } catch (error) {
    logger.error({ err: error, ventaId: req.params.id }, "Error al actualizar venta");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al actualizar la venta",
      },
    });
  }
};

// Cancelar venta
export const cancelVenta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const venta = await prisma.venta.findUnique({
      where: { id },
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        error: {
          code: "VENTA_NOT_FOUND",
          message: "Venta no encontrada",
        },
      });
    }

    if (venta.estado === "cancelada") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VENTA_ALREADY_CANCELED",
          message: "La venta ya está cancelada",
        },
      });
    }

    const ventaCancelada = await prisma.venta.update({
      where: { id },
      data: { estado: "cancelada" },
    });

    res.status(200).json({
      success: true,
      data: ventaCancelada,
      message: "Venta cancelada correctamente",
    });
  } catch (error) {
    logger.error({ err: error, ventaId: req.params.id }, "Error al cancelar venta");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al cancelar la venta",
      },
    });
  }
};

// Obtener estadísticas de ventas
// Obtener ticket de una venta
export const getTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const venta = await prisma.venta.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
          },
        },
        usuario: true,
        caja: true,
      },
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        error: {
          code: "VENTA_NOT_FOUND",
          message: "Venta no encontrada",
        },
      });
    }

    const ticket = generarTicket(venta, venta.metodoPago);

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    logger.error({ err: error, ventaId: req.params.id }, "Error al obtener ticket");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener el ticket",
      },
    });
  }
};

export const getVentasStats = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const where: any = {
      estado: "completada",
    };

    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) {
        where.createdAt.gte = new Date(fechaInicio as string);
      }
      if (fechaFin) {
        where.createdAt.lte = new Date(fechaFin as string);
      }
    }

    const ventas = await prisma.venta.findMany({
      where,
      include: {
        items: true,
      },
    });

    const totalVentas = ventas.length;
    const totalIngresos = ventas.reduce(
      (sum, v) => sum + parseFloat(v.totalFinal.toString()),
      0
    );
    const ventasEfectivo = ventas.filter(
      (v) => v.metodoPago === "efectivo"
    ).length;
    const ventasTransferencia = ventas.filter(
      (v) => v.metodoPago === "transferencia"
    ).length;
    const promedioVenta = totalVentas > 0 ? totalIngresos / totalVentas : 0;

    res.status(200).json({
      success: true,
      data: {
        totalVentas,
        totalIngresos,
        ventasEfectivo,
        ventasTransferencia,
        promedioVenta,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error al obtener estadísticas");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Error al obtener estadísticas",
      },
    });
  }
};
