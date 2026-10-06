import crypto from "crypto";
import { redis } from "../config/cache.js";
import { ToolError } from "../utils/toolError.util.js";
import { getConnectorContext } from "../context/context.js";
import { EXECUTORS } from "../executors/actions.executors.js";

const ACTION_TTL_SEC = 900; // 15 min mein confirm nahi kiya to expire
const DEDUPE_TTL_SEC = 120;
const actionKey = (id) => `connector:action:${id}`;

/**
 * Write tool yahan aata hai. Kuch execute NAHI hota: action Redis mein pending rakha jata hai
 * aur client ko confirmation card bheja jata hai.
 * Dedupe: provider fallback par agent dobara chale to wahi card dubara na bane.
 */
export async function prepareAction({ service, type, params, preview }) {
  const ctx = getConnectorContext();
  if (!ctx?.userId || typeof ctx.emit !== "function") {
    throw new ToolError("Write actions aren't available in this context.", 400);
  }
  const userId = String(ctx.userId);

  const hash = crypto.createHash("sha256").update(JSON.stringify([userId, type, params])).digest("hex").slice(0, 24);
  const dedupeKey = `connector:action:dedupe:${hash}`;
  const id = crypto.randomBytes(16).toString("hex");

  const first = await redis.set(dedupeKey, id, "EX", DEDUPE_TTL_SEC, "NX");
  if (first !== "OK") return { id: await redis.get(dedupeKey), duplicate: true };

  await redis.set(actionKey(id), JSON.stringify({ userId, service, type, params, dedupeKey }), "EX", ACTION_TTL_SEC);
  ctx.emit({ type: "connector_action", action: { id, service, type, ...preview } });
  return { id, duplicate: false };
}

async function takeAction(userId, id) {
  const raw = await redis.get(actionKey(id));
  if (!raw) throw new ToolError("This action expired or was already handled.", 410);
  const action = JSON.parse(raw);
  if (action.userId !== String(userId)) throw new ToolError("This action expired or was already handled.", 410);

  // del ka count 1 ho tabhi aage badho: double-click par do baar execute nahi hoga
  if ((await redis.del(actionKey(id))) !== 1) throw new ToolError("This action was already handled.", 410);
  await redis.del(action.dedupeKey);
  return action;
}

/** User ne Confirm dabaya */
export async function confirmAction(userId, id) {
  const action = await takeAction(userId, id);
  const run = EXECUTORS[action.type];
  if (!run) throw new ToolError("Unknown action.", 400);
  return run(userId, action.params);
}

/** User ne Cancel dabaya */
export async function cancelAction(userId, id) {
  await takeAction(userId, id);
}