import { logger } from "../lib/logger.js";
import { ToolError } from "./toolError.util.js";
import { getConnectorContext } from "../context/context.js";

/** Tool kabhi throw nahi karta: error text model ko jata hai, agent crash nahi hota. Har call log hoti hai (args nahi) */
export const safe = (name, fn) => async (args) => {
  const start = Date.now();
  const userId = getConnectorContext()?.userId;
  logger.info({ tool: name, userId: userId && String(userId) }, "connector tool called");
  try {
    const result = await fn(args);
    logger.info({ tool: name, ms: Date.now() - start }, "connector tool done");
    return result;
  } catch (err) {
    if (err instanceof ToolError) {
      logger.warn({ tool: name, ms: Date.now() - start, status: err.statusCode, error: err.message }, "connector tool rejected");
      return `Error: ${err.message}`;
    }
    logger.error({ tool: name, ms: Date.now() - start, error: err?.message }, "connector tool failed");
    return "Error: something went wrong while talking to Google. Tell the user to try again.";
  }
};

export const requireUserId = () => {
  const ctx = getConnectorContext();
  if (!ctx?.userId) throw new ToolError("No user context.", 400);
  return ctx.userId;
};

export const clip = (s, n = 6000) => (s.length > n ? `${s.slice(0, n)}\n…[truncated]` : s);

/** Email/file/event ka content data hai, instruction nahi. Closing tag escape karte hain */
export const untrusted = (label, text) =>
  `<untrusted_${label}>\n${String(text).replaceAll("</untrusted_", "<\\/untrusted_")}\n</untrusted_${label}>`;

export const WRITE_RESULT = (duplicate) =>
  duplicate
    ? "A confirmation card for this exact action is already shown to the user. Do not create another."
    : "NOT DONE YET. A confirmation card was shown to the user. Tell them briefly to review it and press Confirm. Never say it was already sent/created/changed.";