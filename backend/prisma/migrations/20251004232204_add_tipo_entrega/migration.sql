-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ventas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "caja_id" TEXT,
    "total_base" DECIMAL NOT NULL,
    "impuesto" DECIMAL NOT NULL,
    "total_final" DECIMAL NOT NULL,
    "metodo_pago" TEXT NOT NULL DEFAULT 'efectivo',
    "tipo_entrega" TEXT NOT NULL DEFAULT 'local',
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ventas_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ventas" ("actualizado_en", "caja_id", "creado_en", "estado", "id", "impuesto", "metodo_pago", "total_base", "total_final", "usuario_id") SELECT "actualizado_en", "caja_id", "creado_en", "estado", "id", "impuesto", "metodo_pago", "total_base", "total_final", "usuario_id" FROM "ventas";
DROP TABLE "ventas";
ALTER TABLE "new_ventas" RENAME TO "ventas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
