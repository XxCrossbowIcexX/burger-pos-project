import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { CustomError } from "./errorHandler";

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return next(
          new CustomError(
            `Errores de validación: ${errorMessages
              .map((e) => e.message)
              .join(", ")}`,
            400
          )
        );
      }
      next(error);
    }
  };
};
