import crypto from "crypto";
import { gapi } from "../api/google.api.js";
import { ToolError } from "../utils/toolError.util.js";

/**
 * In functions ko SIRF user ke Confirm click par (REST route se) chalaya jata hai, model se kabhi nahi.
 * Har executor ek chhota summary string return karta hai.
 */

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";
const CAL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const DRIVE = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

const oneLine = (s) => String(s ?? "").replace(/[\r\n]+/g, " ").trim(); // header injection se bachav

/* ---------------- Gmail ---------------- */
function buildMime({ to, cc, subject, body }) {
  const b64Body = Buffer.from(body, "utf8").toString("base64").replace(/.{1,76}/g, "$&\r\n").trimEnd();
  const lines = [
    `To: ${oneLine(to)}`,
    cc ? `Cc: ${oneLine(cc)}` : null,
    `Subject: =?UTF-8?B?${Buffer.from(oneLine(subject), "utf8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64Body,
  ].filter((l) => l !== null);
  return Buffer.from(lines.join("\r\n")).toString("base64url");
}

/* ---------------- Calendar helpers ---------------- */
const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

export function toGTime(value, timeZone) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { date: value }; // all-day
  if (!HAS_OFFSET.test(value) && !timeZone) {
    throw new ToolError("timeZone (IANA, e.g. Asia/Kolkata) or a UTC offset in the time is required. Ask the user for their timezone.", 400);
  }
  return { dateTime: value, ...(timeZone && !HAS_OFFSET.test(value) ? { timeZone } : {}) };
}

const eventBody = (p) => ({
  ...(p.summary && { summary: p.summary }),
  ...(p.description && { description: p.description }),
  ...(p.location && { location: p.location }),
  ...(p.start && { start: toGTime(p.start, p.timeZone) }),
  ...(p.end && { end: toGTime(p.end, p.timeZone) }),
  ...(p.attendees?.length && { attendees: p.attendees.map((email) => ({ email })) }),
});

/* ---------------- Drive helpers ---------------- */
function multipart(meta, content, contentType = "text/plain; charset=UTF-8") {
  const boundary = "b" + crypto.randomBytes(12).toString("hex");
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n${content}\r\n--${boundary}--`;
  return { body, headers: { "Content-Type": `multipart/related; boundary=${boundary}` } };
}

export const EXECUTORS = {
  async "gmail.send"(userId, p) {
    await gapi(userId, "gmail", { url: `${GMAIL}/messages/send`, method: "POST", data: { raw: buildMime(p) } });
    return `Email sent to ${p.to}.`;
  },

  async "calendar.create"(userId, p) {
    const q = p.attendees?.length ? "?sendUpdates=all" : "";
    const ev = await gapi(userId, "calendar", { url: CAL + q, method: "POST", data: eventBody(p) });
    return `Event "${ev.summary}" created.${ev.htmlLink ? ` ${ev.htmlLink}` : ""}`;
  },

  async "calendar.update"(userId, p) {
    const q = p.attendees?.length ? "?sendUpdates=all" : "";
    const ev = await gapi(userId, "calendar", {
      url: `${CAL}/${encodeURIComponent(p.eventId)}${q}`,
      method: "PATCH",
      data: eventBody(p),
    });
    return `Event "${ev.summary}" updated.`;
  },

  async "calendar.delete"(userId, p) {
    await gapi(userId, "calendar", { url: `${CAL}/${encodeURIComponent(p.eventId)}`, method: "DELETE" });
    return "Event deleted.";
  },

  async "drive.create_folder"(userId, p) {
    const f = await gapi(userId, "drive", {
      url: `${DRIVE}?fields=id,name,webViewLink`,
      method: "POST",
      data: { name: p.name, mimeType: "application/vnd.google-apps.folder", ...(p.parentId && { parents: [p.parentId] }) },
    });
    return `Folder "${f.name}" created.${f.webViewLink ? ` ${f.webViewLink}` : ""}`;
  },

  async "drive.create_doc"(userId, p) {
    const meta = {
      name: p.name,
      ...(p.asGoogleDoc && { mimeType: "application/vnd.google-apps.document" }),
      ...(p.parentId && { parents: [p.parentId] }),
    };
    const { body, headers } = multipart(meta, p.content ?? "");
    const f = await gapi(userId, "drive", {
      url: `${DRIVE_UPLOAD}?uploadType=multipart&fields=id,name,webViewLink`,
      method: "POST",
      data: body,
      headers,
    });
    return `File "${f.name}" created.${f.webViewLink ? ` ${f.webViewLink}` : ""}`;
  },

  async "drive.rename"(userId, p) {
    const f = await gapi(userId, "drive", {
      url: `${DRIVE}/${encodeURIComponent(p.fileId)}?fields=id,name`,
      method: "PATCH",
      data: { name: p.name },
    });
    return `Renamed to "${f.name}".`;
  },

  async "drive.move"(userId, p) {
    const cur = await gapi(userId, "drive", { url: `${DRIVE}/${encodeURIComponent(p.fileId)}?fields=id,name,parents` });
    const remove = (cur.parents ?? []).join(",");
    const qs = new URLSearchParams({ addParents: p.parentId, fields: "id,name" });
    if (remove) qs.set("removeParents", remove);
    const f = await gapi(userId, "drive", {
      url: `${DRIVE}/${encodeURIComponent(p.fileId)}?${qs}`,
      method: "PATCH",
      data: {},
    });
    return `Moved "${f.name}".`;
  },

  async "drive.trash"(userId, p) {
    const f = await gapi(userId, "drive", {
      url: `${DRIVE}/${encodeURIComponent(p.fileId)}?fields=id,name`,
      method: "PATCH",
      data: { trashed: true },
    });
    return `"${f.name}" moved to trash (recoverable from Drive's Trash).`;
  },
};