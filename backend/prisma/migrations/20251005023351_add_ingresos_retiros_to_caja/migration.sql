-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cajas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "monto_inicial" DECIMAL NOT NULL,
    "monto_final" DECIMAL,
    "ventas_efectivo" DECIMAL NOT NULL DEFAULT 0,
    "ventas_transferencia" DECIMAL NOT NULL DEFAULT 0,
    "total_ventas" DECIMAL NOT NULL DEFAULT 0,
    "ingresos_extra" DECIMAL NOT NULL DEFAULT 0,
    "retiros_efectivo" DECIMAL NOT NULL DEFAULT 0,
    "diferencia" DECIMAL,
    "estado" TEXT NOT NULL DEFAULT 'abierta',
    "fecha_apertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" DATETIME,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "cajas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cajas" ("activo", "diferencia", "estado", "fecha_apertura", "fecha_cierre", "id", "monto_final", "monto_inicial", "total_ventas", "usuario_id", "ventas_efectivo", "ventas_transferencia") SELECT "activo", "diferencia", "estado", "fecha_apertura", "fecha_cierre", "id", "monto_final", "monto_inicial", "total_ventas", "usuario_id", "ventas_efectivo", "ventas_transferencia" FROM "cajas";
DROP TABLE "cajas";
ALTER TABLE "new_cajas" RENAME TO "cajas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
