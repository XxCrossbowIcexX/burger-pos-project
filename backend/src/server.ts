// src/server.ts
import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Importar logger
import { logger } from "./utils/logger";

// Importar middlewares personalizados
import { errorHandler } from "./middlewares/errorHandler";
import { initConfiguraciones } from "./controllers/configuracionController";

// Importar rutas
import productoRoutes from "./routes/productoRoutes";
import categoriaRoutes from "./routes/categoriaRoutes";
import ingredienteRoutes from "./routes/ingredienteRoutes";
import usuarioRoutes from "./routes/usuarioRoutes";
import cajaRoutes from "./routes/cajaRoutes";
import ventaRoutes from "./routes/ventaRoutes";
import configuracionRoutes from "./routes/configuracionRoutes";
import movimientoRoutes from "./routes/movimientoRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ========================================
// MIDDLEWARES DE SEGURIDAD
// ========================================

// Helmet para headers de seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: NODE_ENV === "production" ? 100 : 1000, // Límite de requests
  message: {
    success: false,
    error: "Demasiadas peticiones, intenta de nuevo más tarde",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// CORS configurado
const corsOptions = {
  origin:
    NODE_ENV === "production"
      ? ["https://tu-dominio.com"] // Cambiar por tu dominio en producción
      : [
          "http://localhost:3000",
          "http://localhost:5173",
          "http://localhost:3001",
        ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ========================================
// MIDDLEWARES GENERALES
// ========================================

// Logging
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Headers personalizados
app.use((req: Request, res: Response, next) => {
  res.header("X-API-Version", "1.0");
  res.header("X-Powered-By", "Burger POS API");
  next();
});

// ========================================
// RUTAS
// ========================================

// Ruta de salud del API
app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "🍔 API Hamburguesería - Funcionando correctamente",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// Documentación básica de endpoints
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "🍔 Burger POS API",
    version: "1.0.0",
    documentation: {
      health: "GET /health",
      api: {
        productos: {
          list: "GET /api/productos",
          byId: "GET /api/productos/:id",
          byCategory: "GET /api/productos/categoria/:categoriaId",
          create: "POST /api/productos",
          update: "PUT /api/productos/:id",
          delete: "DELETE /api/productos/:id",
        },
        categorias: "GET /api/categorias",
        ingredientes: "GET /api/ingredientes",
      },
    },
  });
});

// Rutas del API
app.use("/api/productos", productoRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/ingredientes", ingredienteRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/cajas", cajaRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/configuraciones", configuracionRoutes);
app.use("/api/movimientos", movimientoRoutes);

// ========================================
// MANEJO DE ERRORES
// ========================================

// Ruta no encontrada
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Ruta ${req.originalUrl} no encontrada`,
    availableRoutes: {
      health: "/health",
      api: "/api/*",
    },
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// ========================================
// INICIO DEL SERVIDOR
// ========================================

const server = app.listen(PORT, async () => {
  logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  logger.info(`📚 Documentación: http://localhost:${PORT}`);
  logger.info(`💚 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌍 Entorno: ${NODE_ENV}`);

  // Inicializar configuraciones por defecto
  await initConfiguraciones();
});

// Manejo graceful de cierre del servidor
process.on("SIGTERM", () => {
  logger.info("👋 SIGTERM recibido, cerrando servidor gracefully...");
  server.close(() => {
    logger.info("✅ Servidor cerrado exitosamente");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("👋 SIGINT recibido, cerrando servidor gracefully...");
  server.close(() => {
    logger.info("✅ Servidor cerrado exitosamente");
    process.exit(0);
  });
});

export default app;
