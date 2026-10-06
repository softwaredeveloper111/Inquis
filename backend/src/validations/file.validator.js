import { validationErrorHandler } from "../middlewares/validation.middleware.js";
import { param } from "express-validator";

export const fileIdValidation = [
  param("fileId").trim().notEmpty().withMessage("file id is required").isMongoId().withMessage("invalid file id"),
  validationErrorHandler,
];