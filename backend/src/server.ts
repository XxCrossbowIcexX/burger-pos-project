// src/server.ts
import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

// Importar rutas
import productoRoutes from "./routes/productoRoutes";
import categoriaRoutes from "./routes/categoriaRoutes";
import ingredienteRoutes from "./routes/ingredienteRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/productos", productoRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/ingredientes", ingredienteRoutes);

// Ruta de prueba
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "🍔 API Hamburguesería - Funcionando correctamente",
    endpoints: {
      productos: "GET /api/productos",
    },
  });
});

// Manejo de errores 404
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 Documentación de endpoints: http://localhost:${PORT}`);
});
