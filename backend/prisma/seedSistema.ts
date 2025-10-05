// prisma/seedSistema.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
async function main() {
  const sistema = await prisma.usuario.upsert({
    where: { nombreUsuario: "sistema" },
    update: {},
    create: {
      nombreUsuario: "BurguerPos",
      contraseña: await bcrypt.hashSync("burguerpos2025", 10),
      rol: "sistema",
    },
  });
  console.log("✅ Usuario de sistema creado:", {
    sistema: sistema.id,
  });
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
