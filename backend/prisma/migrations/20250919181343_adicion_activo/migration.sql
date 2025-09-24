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
    "diferencia" DECIMAL,
    "estado" TEXT NOT NULL DEFAULT 'abierta',
    "fecha_apertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" DATETIME,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "cajas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cajas" ("diferencia", "estado", "fecha_apertura", "fecha_cierre", "id", "monto_final", "monto_inicial", "total_ventas", "usuario_id", "ventas_efectivo", "ventas_transferencia") SELECT "diferencia", "estado", "fecha_apertura", "fecha_cierre", "id", "monto_final", "monto_inicial", "total_ventas", "usuario_id", "ventas_efectivo", "ventas_transferencia" FROM "cajas";
DROP TABLE "cajas";
ALTER TABLE "new_cajas" RENAME TO "cajas";
CREATE TABLE "new_categorias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "permite_ingredientes" BOOLEAN NOT NULL DEFAULT true,
    "permite_modificar" BOOLEAN NOT NULL DEFAULT true,
    "icono" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_categorias" ("actualizado_en", "creado_en", "icono", "id", "nombre", "permite_ingredientes", "permite_modificar") SELECT "actualizado_en", "creado_en", "icono", "id", "nombre", "permite_ingredientes", "permite_modificar" FROM "categorias";
DROP TABLE "categorias";
ALTER TABLE "new_categorias" RENAME TO "categorias";
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");
CREATE TABLE "new_ingredientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estaqueable" BOOLEAN NOT NULL DEFAULT false,
    "puede_ser_extra" BOOLEAN NOT NULL DEFAULT false,
    "precio_extra" DECIMAL DEFAULT 0,
    "descripcion" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_ingredientes" ("actualizado_en", "creado_en", "descripcion", "estaqueable", "id", "nombre", "precio_extra", "puede_ser_extra", "tipo") SELECT "actualizado_en", "creado_en", "descripcion", "estaqueable", "id", "nombre", "precio_extra", "puede_ser_extra", "tipo" FROM "ingredientes";
DROP TABLE "ingredientes";
ALTER TABLE "new_ingredientes" RENAME TO "ingredientes";
CREATE TABLE "new_productos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "precio_base" DECIMAL NOT NULL,
    "descripcion" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_productos" ("actualizado_en", "categoriaId", "creado_en", "descripcion", "id", "nombre", "precio_base") SELECT "actualizado_en", "categoriaId", "creado_en", "descripcion", "id", "nombre", "precio_base" FROM "productos";
DROP TABLE "productos";
ALTER TABLE "new_productos" RENAME TO "productos";
CREATE TABLE "new_usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre_usuario" TEXT NOT NULL,
    "contraseña" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'cliente',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_usuarios" ("actualizado_en", "contraseña", "creado_en", "id", "nombre_usuario", "rol") SELECT "actualizado_en", "contraseña", "creado_en", "id", "nombre_usuario", "rol" FROM "usuarios";
DROP TABLE "usuarios";
ALTER TABLE "new_usuarios" RENAME TO "usuarios";
CREATE UNIQUE INDEX "usuarios_nombre_usuario_key" ON "usuarios"("nombre_usuario");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
