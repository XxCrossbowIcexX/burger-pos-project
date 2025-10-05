-- CreateTable
CREATE TABLE "configuraciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'string',
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'general',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_clave_key" ON "configuraciones"("clave");
