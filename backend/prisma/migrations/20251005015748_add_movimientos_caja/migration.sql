-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caja_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    "concepto" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimientos_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
