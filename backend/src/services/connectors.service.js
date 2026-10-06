import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config/config.js";
import { redis } from "../config/cache.js";
import { logger } from "../lib/logger.js";
import { SERVICES, SERVICE_KEYS, BASE_SCOPES } from "../constants/connectors.constants.js";
import { connectorAccountModel } from "../models/connectoraccount.model.js";
import { encrypt, decrypt } from "../utils/crypto.util.js";

const trim = (u) => u.replace(/\/+$/, "");
export const REDIRECT_URI = `${trim(config.BACKEND_URL)}/api/connectors/google/callback`;
export const FRONTEND = trim(config.FRONTEND_URL);

const STATE_TTL_SEC = 600;
const stateKey = (s) => `connector:oauth:${s}`;

export class ConnectorError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const newClient = () =>
  new OAuth2Client(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, REDIRECT_URI);

export const isConfigured = () => Boolean(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET);

/** 1) consent URL banao. state Redis mein userId ke saath bandha hai (single-use, 10 min) */
export async function createAuthUrl(userId, service) {
  const state = crypto.randomBytes(24).toString("hex");
  await redis.set(stateKey(state), JSON.stringify({ userId: String(userId), service }), "EX", STATE_TTL_SEC);

  return newClient().generateAuthUrl({
    access_type: "offline", // refresh token ke liye
    prompt: "consent", // har baar refresh token mile
    scope: [...BASE_SCOPES, ...SERVICES[service].scopes],
    state,
  });
}

/** state ko read + delete (atomic). Replay nahi ho sakta */
export async function consumeState(state) {
  const results = await redis.multi().get(stateKey(state)).del(stateKey(state)).exec();
  const raw = results?.[0]?.[1];
  return raw ? JSON.parse(raw) : null;
}

/** 2) callback: code exchange, scope verify, token encrypt karke save */
export async function completeConnection(code, { userId, service }) {
  const client = newClient();
  const { tokens } = await client.getToken(code);

  // Google ki consent screen par user kuch scopes untick kar sakta hai
  const granted = (tokens.scope || "").split(" ");
  if (!SERVICES[service].scopes.every((s) => granted.includes(s))) throw new ConnectorError("scope_missing");
  if (!tokens.refresh_token) throw new ConnectorError("no_refresh_token");

  let email;
  if (tokens.id_token) {
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: config.GOOGLE_CLIENT_ID });
    email = ticket.getPayload()?.email;
  }

  await connectorAccountModel.findOneAndUpdate(
    { userId, service },
    { googleEmail: email, scopes: granted, refreshTokenEnc: encrypt(tokens.refresh_token) },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

/** UI ke liye: teeno services ka status */
export async function listStatuses(userId) {
  const docs = await connectorAccountModel.find({ userId }).select("service googleEmail updatedAt").lean();
  const byService = Object.fromEntries(docs.map((d) => [d.service, d]));
  return SERVICE_KEYS.map((service) => ({
    service,
    connected: Boolean(byService[service]),
    email: byService[service]?.googleEmail ?? null,
    connectedAt: byService[service]?.updatedAt ?? null,
  }));
}

/** disconnect. Aakhri connector hatne par Google ka grant bhi revoke karte hain */
export async function disconnect(userId, service) {
  const doc = await connectorAccountModel.findOneAndDelete({ userId, service }).select("+refreshTokenEnc");
  if (!doc) return false;

  const remaining = await connectorAccountModel.countDocuments({ userId });
  if (remaining === 0) {
    try {
      await newClient().revokeToken(decrypt(doc.refreshTokenEnc));
    } catch (err) {
      logger.warn({ error: err?.message }, "connector token revoke failed");
    }
  }
  return true;
}

/**
 * PHASE 2 ke liye (abhi koi use nahi karta): Gmail/Calendar/Drive API call karne ke liye
 * ready OAuth2Client. Chat agent ke tools baad mein isse use karenge.
 */
export async function getAuthorizedClient(userId, service) {
  const doc = await connectorAccountModel.findOne({ userId, service }).select("+refreshTokenEnc");
  if (!doc) throw new ConnectorError("not_connected");
  const client = newClient();
  client.setCredentials({ refresh_token: decrypt(doc.refreshTokenEnc) });
  return client;
}