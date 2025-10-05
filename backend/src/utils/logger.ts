import pino from "pino";
import pretty from "pino-pretty";

const isDevelopment = process.env.NODE_ENV === "development";

// Configuración de Pino
export const logger = isDevelopment
  ? pino(
      {
        level: process.env.LOG_LEVEL || "info",
      },
      pretty({
        colorize: true,
        translateTime: "SYS:dd/mm/yyyy HH:MM:ss", // Hora local del sistema
        ignore: "pid,hostname",
      })
    )
  : pino({
      level: process.env.LOG_LEVEL || "info",
      timestamp: pino.stdTimeFunctions.isoTime,
    });

/**
 * Cómo usar el logger:
 *
 * 1. Importar:
 *    import { logger } from './utils/logger';
 *
 * 2. Niveles de log (de menor a mayor severidad):
 *    - logger.trace('Muy detallado')           // Solo para debugging profundo
 *    - logger.debug('Info de debugging')       // Para desarrollo
 *    - logger.info('Información general')      // Operaciones normales
 *    - logger.warn('Advertencia')              // Situaciones no ideales
 *    - logger.error('Error')                   // Errores
 *    - logger.fatal('Error fatal')             // Errores críticos
 *
 * 3. Con contexto adicional (objetos):
 *    logger.info({ userId: '123', action: 'login' }, 'Usuario inició sesión');
 *
 * 4. Para errores:
 *    logger.error({ err: error, userId: '123' }, 'Error al procesar venta');
 *
 * 5. Child loggers (con contexto compartido):
 *    const userLogger = logger.child({ userId: '123' });
 *    userLogger.info('Acción realizada'); // Siempre incluirá userId
 */

export default logger;
