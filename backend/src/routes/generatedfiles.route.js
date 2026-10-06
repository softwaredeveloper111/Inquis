import { Router } from "express";
import { downloadGeneratedFile } from "../controllers/generatedfiles.controller.js";

const router = Router();
router.get("/:token", downloadGeneratedFile);

export const generatedFilesRouter = router;