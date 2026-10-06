import { tool } from "langchain";
import { z } from "zod";
import { gapi } from "../api/google.api.js";
import { ToolError } from "../utils/toolError.util.js";
import { prepareAction } from "../services/actions.service.js";
import { toGTime } from "../executors/actions.executors.js";
import { safe, requireUserId, untrusted, WRITE_RESULT } from "../utils/tool.util.js";

const CAL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

const when = (t) => t?.dateTime ?? t?.date ?? "?";
const asRfc3339 = (v, fallback) => (!v ? fallback : /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00Z` : v);

export function buildCalendarTools() {
  const calendarList = tool(
    safe("calendarList", async ({ timeMin, timeMax, query }) => {
      const userId = requireUserId();
      const now = new Date();
      const qs = new URLSearchParams({
        timeMin: asRfc3339(timeMin, now.toISOString()),
        timeMax: asRfc3339(timeMax, new Date(now.getTime() + 7 * 864e5).toISOString()),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "15",
      });
      if (query) qs.set("q", query);

      const data = await gapi(userId, "calendar", { url: `${CAL}?${qs}` });
      const items = data.items ?? [];
      if (!items.length) return "No events in that range.";
      const rows = items.map(
        (e) =>
          `id: ${e.id}\ntitle: ${e.summary ?? "(no title)"}\nstart: ${when(e.start)}\nend: ${when(e.end)}` +
          `${e.location ? `\nlocation: ${e.location}` : ""}${e.attendees?.length ? `\nattendees: ${e.attendees.map((a) => a.email).join(", ")}` : ""}`,
      );
      return untrusted("events", rows.join("\n---\n"));
    }),
    {
      name: "calendarList",
      description:
        "List the user's Google Calendar events in a time range (default: next 7 days). Times are RFC3339 like 2026-10-07T00:00:00+05:30, or a plain date YYYY-MM-DD.",
      schema: z.object({
        timeMin: z.string().optional().describe("Range start"),
        timeMax: z.string().optional().describe("Range end"),
        query: z.string().optional().describe("Optional text to match in events"),
      }),
    },
  );

  const calendarWrite = tool(
    safe("calendarWrite", async (a) => {
      const userId = requireUserId();
      const { action, eventId } = a;
      const attendees = (a.attendees ?? []).map((x) => x.trim()).filter(Boolean);
      if (attendees.length > 20 || !attendees.every((x) => EMAIL.test(x))) {
        throw new ToolError("Invalid attendee email address.", 400);
      }

      let type;
      let params;
      let fields;
      let title;

      if (action === "create") {
        if (!a.summary || !a.start || !a.end) throw new ToolError("summary, start and end are required to create an event.", 400);
        toGTime(a.start, a.timeZone); // timezone validation abhi, preview se pehle
        toGTime(a.end, a.timeZone);
        type = "calendar.create";
        title = "Create calendar event";
        params = { summary: a.summary, start: a.start, end: a.end, timeZone: a.timeZone, description: a.description, location: a.location, attendees };
        fields = [
          { label: "Title", value: a.summary },
          { label: "Start", value: `${a.start}${a.timeZone ? ` (${a.timeZone})` : ""}` },
          { label: "End", value: a.end },
          ...(a.location ? [{ label: "Location", value: a.location }] : []),
          ...(attendees.length ? [{ label: "Invites", value: attendees.join(", ") }] : []),
        ];
      } else {
        if (!eventId) throw new ToolError("eventId is required. Use calendarList to find it.", 400);
        const ev = await gapi(userId, "calendar", { url: `${CAL}/${encodeURIComponent(eventId)}` });
        const current = { label: "Event", value: `${ev.summary ?? "(no title)"} (${when(ev.start)})` };

        if (action === "delete") {
          type = "calendar.delete";
          title = "Delete calendar event";
          params = { eventId };
          fields = [current];
        } else {
          if ((a.start && !a.end) || (!a.start && a.end)) throw new ToolError("Provide both start and end to change the time.", 400);
          if (a.start) {
            toGTime(a.start, a.timeZone);
            toGTime(a.end, a.timeZone);
          }
          type = "calendar.update";
          title = "Update calendar event";
          params = { eventId, summary: a.summary, start: a.start, end: a.end, timeZone: a.timeZone, description: a.description, location: a.location, attendees };
          fields = [
            current,
            ...(a.summary ? [{ label: "New title", value: a.summary }] : []),
            ...(a.start ? [{ label: "New time", value: `${a.start} → ${a.end}` }] : []),
            ...(a.location ? [{ label: "New location", value: a.location }] : []),
            ...(attendees.length ? [{ label: "Invites", value: attendees.join(", ") }] : []),
          ];
        }
      }

      const { duplicate } = await prepareAction({
        service: "calendar",
        type,
        params,
        preview: { title, fields, confirmLabel: action === "delete" ? "Delete" : "Confirm", destructive: action === "delete" },
      });
      return WRITE_RESULT(duplicate);
    }),
    {
      name: "calendarWrite",
      description:
        "Create, update or delete a Google Calendar event. It is NOT applied until the user presses Confirm on a card. For update/delete get the eventId from calendarList first. start/end: RFC3339 with offset (2026-10-07T15:00:00+05:30) or with timeZone, or YYYY-MM-DD for all-day. If the user's timezone is unknown, ask.",
      schema: z.object({
        action: z.enum(["create", "update", "delete"]),
        eventId: z.string().optional().describe("Required for update/delete"),
        summary: z.string().optional().describe("Event title"),
        start: z.string().optional(),
        end: z.string().optional(),
        timeZone: z.string().optional().describe("IANA timezone, e.g. Asia/Kolkata"),
        description: z.string().optional(),
        location: z.string().optional(),
        attendees: z.array(z.string()).optional().describe("Attendee emails; they get an invite"),
      }),
    },
  );

  return [calendarList, calendarWrite];
}

export const CALENDAR_LABEL = "Google Calendar (list/create/update/delete events)";