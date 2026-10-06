import { Router } from "express";
// ⚠️ apne identifyUser middleware ka sahi path daalo
import { identifyUser } from "../middlewares/identifyUser.middleware.js";
import { confirm, cancel } from "../controllers/actions.controller.js";
import { listConnectors, startConnect, googleCallback, removeConnector } from "../controllers/connectors.controller.js";



const router = Router();


/**
 * @route   /api/connectors/google/callback
 */
router.get("/google/callback", googleCallback); // public: Google redirect, state se verify hota hai


/**
 * @route   /api/connectors/
 */
router.get("/", identifyUser, listConnectors);


/**
 * @route   /api/connectors/google/:service/start
 */
router.post("/google/:service/start", identifyUser, startConnect);



router.post("/actions/:id/confirm", identifyUser, confirm);
router.post("/actions/:id/cancel", identifyUser, cancel);


/**
 * @route   /api/connectors/:service
 */
router.delete("/:service", identifyUser, removeConnector);










export const connectorsRouter = router;