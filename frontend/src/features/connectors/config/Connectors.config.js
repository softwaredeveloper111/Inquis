import { GmailIcon, CalendarIcon, DriveIcon } from "../components/Connectoricons";

// `service` backend ke SERVICES keys se match hona chahiye
export const CONNECTOR_LIST = [
  { service: "gmail", name: "Gmail", description: "Search and read your emails, summarize threads", Icon: GmailIcon },
  { service: "calendar", name: "Google Calendar", description: "View your schedule and upcoming events", Icon: CalendarIcon },
  { service: "drive", name: "Google Drive", description: "Search and read your files and documents", Icon: DriveIcon },
];

export const CONNECTOR_NAMES = Object.fromEntries(CONNECTOR_LIST.map((c) => [c.service, c.name]));

export const ERROR_MESSAGES = {
  denied: "Permission was denied, so nothing was connected.",
  scope_missing: "Please allow all requested permissions to connect this account.",
  no_refresh_token: "Google didn't return offline access. Please try connecting again.",
  state_invalid: "The connection request expired. Please try again.",
  google_failed: "Couldn't connect to Google. Please try again.",
};