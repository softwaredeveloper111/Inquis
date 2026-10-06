import { Router } from "express";
import { identifyUser } from "../middlewares/identifyUser.middleware.js";
import { globalRateLimit, fileUploadLimit } from "../middlewares/rateLimiter.middleware.js";
import { uploadSingleFile, validateFileContent } from "../middlewares/upload.middleware.js";
import { fileIdValidation } from "../validations/file.validator.js";
import { uploadFile, getFileStatus } from "../controllers/file.controller.js";

const fileRouter = Router();

// POST /api/files  (form-data, key: file)
// rate limit multer se PEHLE, taaki limited user ki 10MB file buffer hi na ho
fileRouter.post(
  "/",
  globalRateLimit,
  identifyUser,
  fileUploadLimit,
  uploadSingleFile,
  validateFileContent,
  uploadFile
);

// GET /api/files/:fileId  (status poll)
fileRouter.get("/:fileId", globalRateLimit, identifyUser, fileIdValidation, getFileStatus);

export { fileRouter };