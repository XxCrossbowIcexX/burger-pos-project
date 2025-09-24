-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_productos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "precio_base" DECIMAL NOT NULL,
    "descripcion" TEXT,
    "permiteExtras" BOOLEAN NOT NULL DEFAULT true,
    "permiteExclusiones" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_productos" ("activo", "actualizado_en", "categoriaId", "creado_en", "descripcion", "id", "nombre", "precio_base") SELECT "activo", "actualizado_en", "categoriaId", "creado_en", "descripcion", "id", "nombre", "precio_base" FROM "productos";
DROP TABLE "productos";
ALTER TABLE "new_productos" RENAME TO "productos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
