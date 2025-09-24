// prisma/seed.ts
import { PrismaClient, TipoIngrediente } from "@prisma/client";

const prisma = new PrismaClient();

interface IngredienteData {
  nombre: string;
  tipo: TipoIngrediente;
  estaqueable: boolean;
  puedeSerExtra: boolean;
  precioExtra: number | null;
}

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1. Crear usuarios
  const admin = await prisma.usuario.upsert({
    where: { nombreUsuario: "admin" },
    update: {},
    create: {
      nombreUsuario: "admin",
      contraseña: "admin123", // ¡En producción usa bcrypt!
      rol: "administrador",
    },
  });

  const mostrador = await prisma.usuario.upsert({
    where: { nombreUsuario: "mostrador" },
    update: {},
    create: {
      nombreUsuario: "mostrador",
      contraseña: "mostrador123",
      rol: "mostrador",
    },
  });

  const cocina = await prisma.usuario.upsert({
    where: { nombreUsuario: "cocina" },
    update: {},
    create: {
      nombreUsuario: "cocina",
      contraseña: "cocina123",
      rol: "cocina",
    },
  });

  console.log("✅ Usuarios creados:", {
    admin: admin.id,
    mostrador: mostrador.id,
    cocina: cocina.id,
  });

  // 2. Crear categorías
  const categoriasData = [
    {
      nombre: "Hamburguesas",
      icono: "fa-burger",
      permiteIngredientes: true,
      permiteModificar: true,
    },
    {
      nombre: "Entradas",
      icono: "fa-utensils",
      permiteIngredientes: false,
      permiteModificar: true,
    },
    {
      nombre: "Bebidas",
      icono: "fa-champagne-glasses",
      permiteIngredientes: false,
      permiteModificar: false,
    },
    {
      nombre: "Postres",
      icono: "fa-ice-cream",
      permiteIngredientes: false,
      permiteModificar: true,
    },
  ];

  const categorias: { [key: string]: any } = {};
  for (const cat of categoriasData) {
    const categoria = await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: cat,
    });
    categorias[cat.nombre] = categoria;
    console.log(`✅ Categoría creada: ${cat.nombre}`);
  }

  // 3. Crear ingredientes
  const ingredientesData: IngredienteData[] = [
    // PANES
    {
      nombre: "Pan normal",
      tipo: TipoIngrediente.pan,
      estaqueable: false,
      puedeSerExtra: false,
      precioExtra: 0,
    },
    {
      nombre: "Pan de queso",
      tipo: TipoIngrediente.pan,
      estaqueable: false,
      puedeSerExtra: true,
      precioExtra: 30,
    },
    {
      nombre: "Pan integral",
      tipo: TipoIngrediente.pan,
      estaqueable: false,
      puedeSerExtra: true,
      precioExtra: 20,
    },

    // CARNES
    {
      nombre: "Carne de res",
      tipo: TipoIngrediente.carne,
      estaqueable: true,
      puedeSerExtra: false,
      precioExtra: 0,
    },
    {
      nombre: "Pollo",
      tipo: TipoIngrediente.carne,
      estaqueable: true,
      puedeSerExtra: true,
      precioExtra: 0,
    },
    {
      nombre: "Bacon",
      tipo: TipoIngrediente.carne,
      estaqueable: true,
      puedeSerExtra: true,
      precioExtra: 40,
    },

    // QUESOS
    {
      nombre: "Queso cheddar",
      tipo: TipoIngrediente.queso,
      estaqueable: true,
      puedeSerExtra: true,
      precioExtra: 30,
    },
    {
      nombre: "Queso azul",
      tipo: TipoIngrediente.queso,
      estaqueable: true,
      puedeSerExtra: true,
      precioExtra: 40,
    },
    {
      nombre: "Queso crema",
      tipo: TipoIngrediente.queso,
      estaqueable: true,
      puedeSerExtra: true,
      precioExtra: 25,
    },

    // VEGETALES
    {
      nombre: "Lechuga",
      tipo: TipoIngrediente.vegetal,
      estaqueable: false,
      puedeSerExtra: false,
      precioExtra: 0,
    },
    {
      nombre: "Tomate",
      tipo: TipoIngrediente.vegetal,
      estaqueable: false,
      puedeSerExtra: true,
      precioExtra: 20,
    },
    {
      nombre: "Cebolla",
      tipo: TipoIngrediente.vegetal,
      estaqueable: false,
      puedeSerExtra: true,
      precioExtra: 15,
    },

    // SALSAS
    {
      nombre: "Mayonesa",
      tipo: TipoIngrediente.salsa,
      estaqueable: false,
      puedeSerExtra: false,
      precioExtra: 0,
    },
    {
      nombre: "Ketchup",
      tipo: TipoIngrediente.salsa,
      estaqueable: false,
      puedeSerExtra: false,
      precioExtra: 0,
    },
    {
      nombre: "Mostaza",
      tipo: TipoIngrediente.salsa,
      estaqueable: false,
      puedeSerExtra: false,
      precioExtra: 0,
    },
    {
      nombre: "Salsa BBQ",
      tipo: TipoIngrediente.salsa,
      estaqueable: false,
      puedeSerExtra: true,
      precioExtra: 15,
    },
    {
      nombre: "Salsa Cheddar",
      tipo: TipoIngrediente.salsa,
      estaqueable: false,
      puedeSerExtra: true,
      precioExtra: 40,
    },
  ];

  // const ingredientes: { [key: string]: any } = {};
  // for (const ing of ingredientesData) {
  //   const ingrediente = await prisma.ingrediente.upsert({
  //     where: { nombre: ing.nombre },
  //     update: {},
  //     create: ing,
  //   });
  //   ingredientes[ing.nombre] = ingrediente;
  //   console.log(`✅ Ingrediente creado: ${ing.nombre}`);
  // }

  const ingredientes: { [key: string]: any } = {};
  for (const ing of ingredientesData) {
    // nombre no es unique en el schema, por eso no podemos usar upsert({ where: { nombre } })
    const existente = await prisma.ingrediente.findFirst({
      where: { nombre: ing.nombre },
    });

    if (existente) {
      const actualizado = await prisma.ingrediente.update({
        where: { id: existente.id },
        data: ing,
      });
      ingredientes[ing.nombre] = actualizado;
      console.log(`♻️ Ingrediente actualizado: ${ing.nombre}`);
    } else {
      const creado = await prisma.ingrediente.create({ data: ing });
      ingredientes[ing.nombre] = creado;
      console.log(`✅ Ingrediente creado: ${ing.nombre}`);
    }
  }

  // 4. Crear productos
  const productosData = [
    {
      nombre: "Hamburguesa Clásica",
      categoria: "Hamburguesas",
      precioBase: 220,
      ingredientesBase: [
        {
          nombre: "Pan normal",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Carne de res",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Lechuga",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Tomate",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Queso cheddar",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Mayonesa",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
      ],
    },
    {
      nombre: "Hamburguesa Doble",
      categoria: "Hamburguesas",
      precioBase: 300,
      ingredientesBase: [
        {
          nombre: "Pan normal",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Carne de res",
          cantidad: 2,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Lechuga",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Tomate",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Queso cheddar",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Mayonesa",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
      ],
    },
    {
      nombre: "Hamburguesa BBQ",
      categoria: "Hamburguesas",
      precioBase: 350,
      ingredientesBase: [
        {
          nombre: "Pan normal",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Carne de res",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Lechuga",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Tomate",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Queso cheddar",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Bacon",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
        {
          nombre: "Salsa BBQ",
          cantidad: 1,
          esExtraOpcional: false,
          precioIncluido: 0,
        },
      ],
    },
    {
      nombre: "Papas Fritas",
      categoria: "Entradas",
      precioBase: 120,
      ingredientesBase: [],
    },
    {
      nombre: "Aros de Cebolla",
      categoria: "Entradas",
      precioBase: 150,
      ingredientesBase: [],
    },
    {
      nombre: "Gaseosa 500ml",
      categoria: "Bebidas",
      precioBase: 80,
      ingredientesBase: [],
    },
    {
      nombre: "Helado de Chocolate",
      categoria: "Postres",
      precioBase: 180,
      ingredientesBase: [],
    },
  ];

  for (const prod of productosData) {
    const producto = await prisma.producto.create({
      data: {
        nombre: prod.nombre,
        precioBase: prod.precioBase,
        categoria: {
          connect: {
            id: categorias[prod.categoria].id,
          },
        },
        ingredientes: {
          create: prod.ingredientesBase.map((ing) => ({
            ingrediente: {
              connect: {
                id: ingredientes[ing.nombre].id,
              },
            },
            cantidad: ing.cantidad,
            esExtraOpcional: ing.esExtraOpcional,
            precioIncluido: ing.precioIncluido,
          })),
        },
      },
      include: {
        ingredientes: {
          include: {
            ingrediente: true,
          },
        },
      },
    });
    console.log(`✅ Producto creado: ${producto.nombre}`);
  }

  console.log("🎉 ¡Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
