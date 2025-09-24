-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre_usuario" TEXT NOT NULL,
    "contraseña" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'cliente',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "cajas" (
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
    CONSTRAINT "cajas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "permite_ingredientes" BOOLEAN NOT NULL DEFAULT true,
    "permite_modificar" BOOLEAN NOT NULL DEFAULT true,
    "icono" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ingredientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estaqueable" BOOLEAN NOT NULL DEFAULT false,
    "puede_ser_extra" BOOLEAN NOT NULL DEFAULT false,
    "precio_extra" DECIMAL DEFAULT 0,
    "descripcion" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "precio_base" DECIMAL NOT NULL,
    "descripcion" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "producto_ingrediente" (
    "producto_id" TEXT NOT NULL,
    "ingrediente_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "es_extra_opcional" BOOLEAN NOT NULL DEFAULT false,
    "precio_incluido" DECIMAL NOT NULL DEFAULT 0,

    PRIMARY KEY ("producto_id", "ingrediente_id"),
    CONSTRAINT "producto_ingrediente_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "producto_ingrediente_ingrediente_id_fkey" FOREIGN KEY ("ingrediente_id") REFERENCES "ingredientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "caja_id" TEXT,
    "total_base" DECIMAL NOT NULL,
    "impuesto" DECIMAL NOT NULL,
    "total_final" DECIMAL NOT NULL,
    "metodo_pago" TEXT NOT NULL DEFAULT 'efectivo',
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ventas_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items_venta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venta_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_base" DECIMAL NOT NULL,
    "ingredientes_modificados" JSONB,
    "extras_seleccionados" JSONB NOT NULL DEFAULT [],
    "total_item" DECIMAL NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "items_venta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "items_venta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_nombre_usuario_key" ON "usuarios"("nombre_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");
