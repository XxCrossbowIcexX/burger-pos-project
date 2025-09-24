// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err } as AppError;
  error.message = err.message;

  // Log del error
  console.error("💥 ERROR:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Errores de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        error = new CustomError(
          "Ya existe un registro con esos datos únicos",
          409
        );
        break;
      case "P2025":
        error = new CustomError("Registro no encontrado", 404);
        break;
      case "P2003":
        error = new CustomError("Error de relación en base de datos", 400);
        break;
      default:
        error = new CustomError("Error de base de datos", 500);
    }
  }

  // Errores de validación de Prisma
  if (err instanceof Prisma.PrismaClientValidationError) {
    error = new CustomError("Datos inválidos proporcionados", 400);
  }

  // Errores de conexión de Prisma
  if (err instanceof Prisma.PrismaClientInitializationError) {
    error = new CustomError("Error de conexión a base de datos", 503);
  }

  // Error por defecto
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || "Error interno del servidor",
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
        details: err,
      }),
    },
  });
};

// Wrapper para funciones async
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
