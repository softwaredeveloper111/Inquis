import { AppError } from "../utils/appError.util.js";
import { asyncWrapper } from "../utils/asyncWrapper.util.js";
import { logger } from "../lib/logger.js";
import { SERVICES } from "../constants/connectors.constants.js";
import {
  ConnectorError,
  FRONTEND,
  isConfigured,
  createAuthUrl,
  consumeState,
  completeConnection,
  listStatuses,
  disconnect,
} from "../services/connectors.service.js";

const assertService = (service) => {
  if (!Object.hasOwn(SERVICES, service)) throw new AppError("unknown connector", 400);
};

/** GET /api/connectors */
export const listConnectors = asyncWrapper(async (req, res) => {
  const data = await listStatuses(req.user._id);
  res.status(200).json({ success: true, data });
});

/** POST /api/connectors/google/:service/start  -> { url } */
export const startConnect = asyncWrapper(async (req, res) => {
  const { service } = req.params;
  assertService(service);
  if (!isConfigured()) throw new AppError("Google connectors are not configured", 503);

  const url = await createAuthUrl(req.user._id, service);
  res.status(200).json({ success: true, data: { url } });
});

/**
 * GET /api/connectors/google/callback  (Google yahan redirect karta hai)
 * Auth cookie par depend nahi karta (dev mein sameSite=strict cookie cross-site redirect par jaati nahi),
 * user ki pehchaan Redis wale state se aati hai.
 */
export const googleCallback = asyncWrapper(async (req, res) => {
  const { code, state, error } = req.query;
  const fail = (c) => res.redirect(`${FRONTEND}/connectors?connector_error=${c}`);

  if (typeof state !== "string") return fail("state_invalid");
  const stateData = await consumeState(state);
  if (!stateData) return fail("state_invalid");

  if (error) return fail(error === "access_denied" ? "denied" : "google_failed");
  if (typeof code !== "string") return fail("google_failed");

  try {
    await completeConnection(code, stateData);
    return res.redirect(`${FRONTEND}/connectors?connected=${stateData.service}`);
  } catch (err) {
    logger.error({ error: err?.message }, "connector connect failed");
    return fail(err instanceof ConnectorError ? err.code : "google_failed");
  }
});

/** DELETE /api/connectors/:service */
export const removeConnector = asyncWrapper(async (req, res) => {
  const { service } = req.params;
  assertService(service);
  const removed = await disconnect(req.user._id, service);
  if (!removed) throw new AppError("connector not connected", 404);
  res.status(200).json({ success: true });
});