import { logger } from "../lib/logger.js";
import { ToolError } from "../utils/toolError.util.js";
import { getAuthorizedClient, ConnectorError } from "../services/connectors.service.js";

const RECONNECT = "Ask the user to reconnect it on the Connectors page.";

/** Google REST call, user ke token se. Token refresh google-auth-library khud karta hai. */
export async function gapi(userId, service, { url, method = "GET", data, headers, responseType }) {
  let client;
  try {
    client = await getAuthorizedClient(userId, service);
  } catch (err) {
    if (err instanceof ConnectorError) throw new ToolError(`The ${service} connector is not connected. ${RECONNECT}`, 409);
    throw err;
  }

  try {
    const res = await client.request({ url, method, data, headers, responseType, timeout: 15_000 });
    return res.data;
  } catch (err) {
    const status = err?.response?.status ?? err?.status;
    const blob = `${err?.message ?? ""} ${JSON.stringify(err?.response?.data ?? {})}`;

    if (/invalid_grant/.test(blob) || status === 401)
      throw new ToolError(`The Google connection expired or was revoked. ${RECONNECT}`, 401);
    if (status === 403) throw new ToolError(`Google denied access (missing permission, or the API isn't enabled). ${RECONNECT}`, 403);
    if (status === 404) throw new ToolError("Not found. The id may be wrong; search again to get a valid id.", 404);
    if (status === 400) throw new ToolError("Google rejected the request (invalid input).", 400);
    if (status === 429) throw new ToolError("Google rate limit reached. Try again in a minute.", 429);

    logger.error({ service, status, error: err?.message }, "google api call failed");
    throw new ToolError("Couldn't reach Google right now. Try again.", 502);
  }
}