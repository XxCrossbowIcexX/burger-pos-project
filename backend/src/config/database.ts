// src/config/database.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

// Singleton de Prisma para evitar múltiples conexiones
const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

// Manejo graceful del cierre
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
