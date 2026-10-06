import { Router } from "express";
import { globalRateLimit } from "../middlewares/rateLimiter.middleware.js";
import { startGoogleAuth, googleCallback } from "../controllers/googleAuth.controller.js";

const googleAuthRouter = Router();

googleAuthRouter.get("/", globalRateLimit, startGoogleAuth);
googleAuthRouter.get("/callback", globalRateLimit, googleCallback);

export { googleAuthRouter };