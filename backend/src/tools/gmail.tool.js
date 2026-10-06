import { tool } from "langchain";
import { z } from "zod";
import { gapi } from "../api/google.api.js";
import { ToolError } from "../utils/toolError.util.js";
import { prepareAction } from "../services/actions.service.js";
import { safe, requireUserId, clip, untrusted, WRITE_RESULT } from "../utils/tool.util.js";

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";
const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

const headerMap = (headers = []) => Object.fromEntries(headers.map((h) => [h.name.toLowerCase(), h.value]));

const decode = (data) => Buffer.from(data ?? "", "base64url").toString("utf8");

/** payload se text nikalo: text/plain pehle, warna html se tags hatao */
function extractBody(payload) {
  let plain = "";
  let html = "";
  const walk = (part) => {
    if (!part) return;
    if (part.mimeType === "text/plain" && part.body?.data) plain += decode(part.body.data);
    else if (part.mimeType === "text/html" && part.body?.data) html += decode(part.body.data);
    (part.parts ?? []).forEach(walk);
  };
  walk(payload);
  if (plain.trim()) return plain;
  return html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

const parseAddrs = (value, label) => {
  const list = String(value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length === 0 || list.length > 10 || !list.every((a) => EMAIL.test(a))) {
    throw new ToolError(`Invalid ${label} address. Use plain email addresses (max 10). Ask the user for the exact address.`, 400);
  }
  return list;
};

export function buildGmailTools() {
  const gmailSearch = tool(
    safe("gmailSearch", async ({ query, maxResults = 5 }) => {
      const userId = requireUserId();
      const n = Math.min(Math.max(maxResults, 1), 10);
      const list = await gapi(userId, "gmail", { url: `${GMAIL}/messages?${new URLSearchParams({ q: query, maxResults: String(n) })}` });
      const ids = (list.messages ?? []).map((m) => m.id);
      if (!ids.length) return "No emails found.";

      const meta = "format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date";
      const rows = await Promise.all(
        ids.map(async (id) => {
          const m = await gapi(userId, "gmail", { url: `${GMAIL}/messages/${id}?${meta}` });
          const h = headerMap(m.payload?.headers);
          return `id: ${id}\nfrom: ${h.from}\nto: ${h.to}\ndate: ${h.date}\nsubject: ${h.subject}\nsnippet: ${m.snippet}`;
        }),
      );
      return untrusted("emails", rows.join("\n---\n"));
    }),
    {
      name: "gmailSearch",
      description:
        "Search the user's Gmail. Query uses Gmail search syntax (e.g. 'from:amit newer_than:7d', 'subject:invoice is:unread'). Returns id, sender, date, subject, snippet.",
      schema: z.object({
        query: z.string().describe("Gmail search query"),
        maxResults: z.number().optional().describe("1-10, default 5"),
      }),
    },
  );

  const gmailRead = tool(
    safe("gmailRead", async ({ messageId }) => {
      const userId = requireUserId();
      const m = await gapi(userId, "gmail", { url: `${GMAIL}/messages/${encodeURIComponent(messageId)}?format=full` });
      const h = headerMap(m.payload?.headers);
      const text = clip(extractBody(m.payload).trim(), 6000);
      return untrusted("email", `from: ${h.from}\nto: ${h.to}\ndate: ${h.date}\nsubject: ${h.subject}\n\n${text}`);
    }),
    {
      name: "gmailRead",
      description: "Read the full text of one Gmail message by id (get ids from gmailSearch).",
      schema: z.object({ messageId: z.string().describe("Message id from gmailSearch") }),
    },
  );

  const gmailSend = tool(
    safe("gmailSend", async ({ to, subject, body: rawBody, cc }) => {
      requireUserId();
      // model kabhi literal "\n" likh deta hai, use asli line break bana do
      const body = String(rawBody ?? "").replace(/\\r\\n|\\n/g, "\n").replace(/\\t/g, "\t");
      const toList = parseAddrs(to, "recipient");
      const ccList = cc ? parseAddrs(cc, "cc") : [];
      if (!subject?.trim() || !body?.trim()) throw new ToolError("subject and body are required.", 400);

      const params = { to: toList.join(", "), cc: ccList.join(", "), subject: subject.trim(), body };
      const { duplicate } = await prepareAction({
        service: "gmail",
        type: "gmail.send",
        params,
        preview: {
          title: "Send email",
          fields: [
            { label: "To", value: params.to },
            ...(params.cc ? [{ label: "Cc", value: params.cc }] : []),
            { label: "Subject", value: params.subject },
          ],
          body,
          confirmLabel: "Send",
        },
      });
      return WRITE_RESULT(duplicate);
    }),
    {
      name: "gmailSend",
      description:
        "Prepare an email to send from the user's Gmail. It is NOT sent until the user presses Confirm on a card. Only use real addresses given by the user or found in their mail; never guess addresses.",
      schema: z.object({
        to: z.string().describe("Recipient email address(es), comma separated"),
        subject: z.string(),
        body: z.string().describe("Plain-text email body. Use real line breaks, not the characters backslash-n"),
        cc: z.string().optional().describe("Optional cc address(es), comma separated"),
      }),
    },
  );

  return [gmailSearch, gmailRead, gmailSend];
}

export const GMAIL_LABEL = "Gmail (search/read/send emails)";