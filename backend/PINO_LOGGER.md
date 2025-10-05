# Guía de uso de Pino Logger

## ¿Qué es Pino?

Pino es un logger de Node.js ultra-rápido y de bajo overhead. Es hasta 5 veces más rápido que alternativas como Winston o Bunyan.

## Ventajas de Pino

1. **Rendimiento**: Pino es extremadamente rápido, diseñado para no bloquear el event loop
2. **JSON estructurado**: Los logs están en formato JSON, ideales para herramientas de análisis
3. **Bajo overhead**: Consume muy poca memoria y CPU
4. **Child loggers**: Permite crear loggers con contexto compartido
5. **Niveles de log**: Soporta múltiples niveles (trace, debug, info, warn, error, fatal)
6. **Pretty printing**: `pino-pretty` para desarrollo con output legible y colorido

## Configuración en el proyecto

### Archivo de configuración

El logger está configurado en `backend/src/utils/logger.ts`:

```typescript
import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
          singleLine: false,
          messageFormat: "{levelLabel} - {msg}",
        },
      }
    : undefined, // En producción usa JSON (más eficiente)
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
```

### Variables de entorno

- `NODE_ENV`: Define si es `development` o `production`
- `LOG_LEVEL`: Define el nivel mínimo de logging (debug, info, warn, error, fatal)

## Uso básico

### 1. Importar el logger

```typescript
import { logger } from "../utils/logger";
```

### 2. Niveles de log

Los niveles están ordenados de menos a más severidad:

```typescript
// trace (10) - Información muy detallada, solo para debugging profundo
logger.trace("Detalles técnicos internos");

// debug (20) - Información de debugging para desarrollo
logger.debug("Variable X tiene valor Y");

// info (30) - Información general de operaciones normales
logger.info("Usuario inició sesión exitosamente");

// warn (40) - Advertencias, situaciones no ideales pero manejables
logger.warn("Intentos de login fallidos: 3");

// error (50) - Errores que requieren atención
logger.error("Error al procesar pago");

// fatal (60) - Errores críticos, la aplicación no puede continuar
logger.fatal("No se puede conectar a la base de datos");
```

### 3. Logs con contexto (objetos)

**Importante**: El objeto de contexto SIEMPRE va primero, el mensaje después.

```typescript
// ✅ CORRECTO
logger.info({ userId: "123", action: "login" }, "Usuario inició sesión");

// ❌ INCORRECTO
logger.info("Usuario inició sesión", { userId: "123", action: "login" });
```

### 4. Logging de errores

Para errores, usa la propiedad `err`:

```typescript
try {
  // código que puede fallar
} catch (error) {
  logger.error({ err: error, userId: "123" }, "Error al procesar venta");
}
```

### 5. Child loggers (contexto compartido)

Útil para mantener contexto a través de múltiples logs:

```typescript
// Crear un child logger con contexto
const userLogger = logger.child({ userId: "123", sessionId: "abc" });

// Todos los logs incluirán userId y sessionId automáticamente
userLogger.info("Acción realizada");
userLogger.warn("Advertencia específica");
```

## Ejemplos prácticos del proyecto

### En controladores

```typescript
// ventaController.ts
export const crearVenta = async (req: Request, res: Response) => {
  try {
    const venta = await prisma.venta.create({...});

    logger.info({ ventaId: venta.id, total: venta.totalFinal }, "Venta creada exitosamente");

    res.json({ success: true, data: venta });
  } catch (error) {
    logger.error({ err: error }, "Error al crear venta");
    res.status(500).json({ success: false, error: "Error al crear venta" });
  }
};
```

### En middleware de errores

```typescript
// errorHandler.ts
export const errorHandler = (err: AppError, req: Request, res: Response) => {
  logger.error({
    err,
    url: req.url,
    method: req.method,
    ip: req.ip,
  }, "Error en la aplicación");

  res.status(statusCode).json({ success: false, error: err.message });
};
```

### En el servidor

```typescript
// server.ts
const server = app.listen(PORT, async () => {
  logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  logger.info(`🌍 Entorno: ${NODE_ENV}`);

  await initConfiguraciones();
});
```

## Output en desarrollo vs producción

### Desarrollo (con pino-pretty)
```
[2025-01-04 10:30:45] INFO: 🚀 Servidor corriendo en http://localhost:3000
[2025-01-04 10:30:50] INFO (ventaId: "abc123", total: "150.00"): Venta creada exitosamente
[2025-01-04 10:31:00] ERROR: Error al procesar pago
    err: {
      "type": "Error",
      "message": "Saldo insuficiente",
      "stack": "Error: Saldo insuficiente\n    at ..."
    }
```

### Producción (JSON)
```json
{"level":"info","time":"2025-01-04T10:30:45.123Z","pid":1234,"hostname":"server","msg":"🚀 Servidor corriendo en http://localhost:3000"}
{"level":"info","time":"2025-01-04T10:30:50.456Z","pid":1234,"hostname":"server","ventaId":"abc123","total":"150.00","msg":"Venta creada exitosamente"}
{"level":"error","time":"2025-01-04T10:31:00.789Z","pid":1234,"hostname":"server","err":{"type":"Error","message":"Saldo insuficiente"},"msg":"Error al procesar pago"}
```

## Mejores prácticas

1. **Usa el nivel apropiado**:
   - `info` para operaciones exitosas
   - `warn` para situaciones anormales pero no críticas
   - `error` para errores que requieren investigación
   - `debug` solo en desarrollo

2. **Incluye contexto útil**:
   ```typescript
   // ✅ Bueno
   logger.error({ err, userId, ventaId }, "Error al procesar venta");

   // ❌ Malo
   logger.error("Error");
   ```

3. **No logues información sensible**:
   ```typescript
   // ❌ NUNCA hagas esto
   logger.info({ password: "123456" }, "Login attempt");

   // ✅ Haz esto
   logger.info({ userId: "123" }, "Login attempt");
   ```

4. **Usa child loggers para módulos**:
   ```typescript
   const paymentLogger = logger.child({ module: "payment" });
   paymentLogger.info("Procesando pago");
   ```

5. **En producción, usa herramientas de agregación**:
   - Los logs JSON de Pino se integran fácilmente con:
     - Elasticsearch + Kibana
     - Datadog
     - New Relic
     - CloudWatch (AWS)
     - Stackdriver (Google Cloud)

## Comandos útiles

```bash
# Ver logs en desarrollo con colores
npm run dev

# Filtrar logs por nivel en producción
node dist/server.js | pino-pretty --levelFirst

# Solo errores
node dist/server.js | pino-pretty --levelFirst -l error

# Buscar logs específicos
node dist/server.js | grep "userId"
```

## Comparación con console.log

| Característica | console.log | Pino |
|----------------|-------------|------|
| Velocidad | Lento | Muy rápido (5-10x) |
| Formato | Texto plano | JSON estructurado |
| Niveles de log | No | Sí (6 niveles) |
| Contexto | Manual | Automático |
| Análisis | Difícil | Fácil con JSON |
| Producción | No recomendado | Diseñado para ello |

## Recursos adicionales

- [Documentación oficial de Pino](https://getpino.io/)
- [pino-pretty](https://github.com/pinojs/pino-pretty)
- [Best practices](https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-pino-to-log-node-js-applications/)
