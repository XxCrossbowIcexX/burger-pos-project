// src/controllers/usuarioController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/database";
import { catchAsync, CustomError } from "../middlewares/errorHandler";

// Login de usuario
export const login = catchAsync(async (req: Request, res: Response) => {
  const { nombreUsuario, contraseña } = req.body;

  // Buscar usuario por nombre
  const usuario = await prisma.usuario.findUnique({
    where: { nombreUsuario },
  });

  if (!usuario) {
    throw new CustomError("Usuario o contraseña incorrectos", 401);
  }

  // Verificar que el usuario esté activo
  if (!usuario.activo) {
    throw new CustomError("Usuario desactivado. Contacte al administrador", 403);
  }

  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(contraseña, usuario.contraseña);

  if (!isValidPassword) {
    throw new CustomError("Usuario o contraseña incorrectos", 401);
  }

  // Retornar datos del usuario (sin la contraseña)
  res.json({
    success: true,
    message: "Login exitoso",
    data: {
      id: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      rol: usuario.rol,
      activo: usuario.activo,
    },
  });
});

// Obtener todos los usuarios con paginación y filtros
export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 50,
    activo,
    rol,
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};

  // Si activo es "all", no filtrar por estado activo
  if (activo !== undefined && activo !== "all") {
    where.activo = activo === "true";
  }

  if (rol) {
    where.rol = rol;
  }

  const [usuarios, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombreUsuario: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ventas: true,
            Caja: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.usuario.count({ where }),
  ]);

  res.json({
    success: true,
    data: usuarios,
    pagination: {
      current: Number(page),
      pages: Math.ceil(total / take),
      count: usuarios.length,
      total,
    },
  });
});

// Obtener usuario por ID
export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nombreUsuario: true,
      rol: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          ventas: true,
          Caja: true,
        },
      },
    },
  });

  if (!usuario) {
    throw new CustomError("Usuario no encontrado", 404);
  }

  res.json({
    success: true,
    data: usuario,
  });
});

// Crear nuevo usuario
export const createUser = catchAsync(async (req: Request, res: Response) => {
  const { nombreUsuario, contraseña, rol = "cliente", activo = true } = req.body;

  // Verificar si el usuario ya existe
  const existingUser = await prisma.usuario.findUnique({
    where: { nombreUsuario },
  });

  if (existingUser) {
    throw new CustomError("El nombre de usuario ya está en uso", 409);
  }

  // Hashear la contraseña
  const hashedPassword = await bcrypt.hash(contraseña, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nombreUsuario,
      contraseña: hashedPassword,
      rol,
      activo,
    },
    select: {
      id: true,
      nombreUsuario: true,
      rol: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(201).json({
    success: true,
    message: "Usuario creado exitosamente",
    data: usuario,
  });
});

// Actualizar usuario
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombreUsuario, contraseña, rol, activo } = req.body;

  // Verificar que el usuario existe
  const existingUser = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new CustomError("Usuario no encontrado", 404);
  }

  // Si se está cambiando el nombre de usuario, verificar que no exista otro con ese nombre
  if (nombreUsuario && nombreUsuario !== existingUser.nombreUsuario) {
    const userWithSameName = await prisma.usuario.findUnique({
      where: { nombreUsuario },
    });

    if (userWithSameName) {
      throw new CustomError("El nombre de usuario ya está en uso", 409);
    }
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (nombreUsuario) updateData.nombreUsuario = nombreUsuario;
  if (rol) updateData.rol = rol;
  if (activo !== undefined) updateData.activo = activo;

  // Si se proporciona una nueva contraseña, hashearla
  if (contraseña) {
    updateData.contraseña = await bcrypt.hash(contraseña, 10);
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      nombreUsuario: true,
      rol: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    message: "Usuario actualizado exitosamente",
    data: usuario,
  });
});

// Eliminar usuario
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verificar que el usuario existe
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          ventas: true,
          Caja: true,
        },
      },
    },
  });

  if (!usuario) {
    throw new CustomError("Usuario no encontrado", 404);
  }

  // Si el usuario tiene ventas o cajas asociadas, hacer soft delete
  if (usuario._count.ventas > 0 || usuario._count.Caja > 0) {
    const updatedUser = await prisma.usuario.update({
      where: { id },
      data: { activo: false },
      select: {
        id: true,
        nombreUsuario: true,
        rol: true,
        activo: true,
      },
    });

    return res.json({
      success: true,
      message: `Usuario desactivado exitosamente. Tiene ${usuario._count.ventas} venta(s) y ${usuario._count.Caja} caja(s) asociada(s).`,
      data: updatedUser,
    });
  }

  // Hard delete si no tiene datos asociados
  await prisma.usuario.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: "Usuario eliminado exitosamente",
    data: { id },
  });
});

// Cambiar contraseña
export const changePassword = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { contraseñaActual, contraseñaNueva } = req.body;

    // Obtener usuario con contraseña
    const usuario = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new CustomError("Usuario no encontrado", 404);
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(
      contraseñaActual,
      usuario.contraseña
    );

    if (!isValidPassword) {
      throw new CustomError("La contraseña actual es incorrecta", 401);
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(contraseñaNueva, 10);

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id },
      data: { contraseña: hashedPassword },
    });

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  }
);

// Obtener estadísticas de usuarios
export const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const [totalUsuarios, usuariosActivos, usuariosPorRol] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { activo: true } }),
    prisma.usuario.groupBy({
      by: ["rol"],
      _count: true,
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsuarios,
      usuariosActivos,
      usuariosInactivos: totalUsuarios - usuariosActivos,
      usuariosPorRol: usuariosPorRol.map((item) => ({
        rol: item.rol,
        cantidad: item._count,
      })),
    },
  });
});
