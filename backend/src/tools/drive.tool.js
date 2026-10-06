import { tool } from "langchain";
import { z } from "zod";
import { gapi } from "../api/google.api.js";
import { ToolError } from "../utils/toolError.util.js";
import { prepareAction } from "../services/actions.service.js";
import { safe, requireUserId, clip, untrusted, WRITE_RESULT } from "../utils/tool.util.js";

const DRIVE = "https://www.googleapis.com/drive/v3/files";
const FOLDER = "application/vnd.google-apps.folder";
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const EXPORTS = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.presentation": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
};

const meta = (userId, fileId) =>
  gapi(userId, "drive", { url: `${DRIVE}/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,parents` });

export function buildDriveTools() {
  const driveSearch = tool(
    safe("driveSearch", async ({ query, onlyFolders, maxResults = 10 }) => {
      const userId = requireUserId();
      const parts = ["trashed = false"];
      if (query) parts.push(`(name contains '${esc(query)}' or fullText contains '${esc(query)}')`);
      if (onlyFolders) parts.push(`mimeType = '${FOLDER}'`);
      const qs = new URLSearchParams({
        q: parts.join(" and "),
        pageSize: String(Math.min(Math.max(maxResults, 1), 20)),
        orderBy: "modifiedTime desc",
        fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
      });
      const data = await gapi(userId, "drive", { url: `${DRIVE}?${qs}` });
      const files = data.files ?? [];
      if (!files.length) return "No files found.";
      return untrusted(
        "files",
        files.map((f) => `id: ${f.id}\nname: ${f.name}\ntype: ${f.mimeType === FOLDER ? "folder" : f.mimeType}\nmodified: ${f.modifiedTime}\nlink: ${f.webViewLink}`).join("\n---\n"),
      );
    }),
    {
      name: "driveSearch",
      description: "Search the user's Google Drive by file/folder name or content. Returns id, name, type, modified time, link.",
      schema: z.object({
        query: z.string().optional().describe("Text to find in name or content"),
        onlyFolders: z.boolean().optional(),
        maxResults: z.number().optional().describe("1-20, default 10"),
      }),
    },
  );

  const driveRead = tool(
    safe("driveRead", async ({ fileId }) => {
      const userId = requireUserId();
      const f = await meta(userId, fileId);
      const exportAs = EXPORTS[f.mimeType];
      const readable = exportAs || f.mimeType?.startsWith("text/") || f.mimeType === "application/json";
      if (!readable) throw new ToolError(`Can't read "${f.name}" (${f.mimeType}). Only Google Docs/Sheets/Slides and text files are readable.`, 415);
      if (!exportAs && Number(f.size) > 500_000) throw new ToolError("File is too large to read.", 413);

      const url = exportAs
        ? `${DRIVE}/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(exportAs)}`
        : `${DRIVE}/${encodeURIComponent(fileId)}?alt=media`;
      const text = await gapi(userId, "drive", { url, responseType: "text" });
      return untrusted("file", `name: ${f.name}\n\n${clip(String(text), 8000)}`);
    }),
    {
      name: "driveRead",
      description: "Read the text content of a Drive file by id (Google Docs, Sheets, Slides, or text files). Get ids from driveSearch.",
      schema: z.object({ fileId: z.string() }),
    },
  );

  const driveWrite = tool(
    safe("driveWrite", async (a) => {
      const userId = requireUserId();
      const { action } = a;
      let type;
      let params;
      let title;
      let fields;
      let destructive = false;

      if (action === "create_folder" || action === "create_doc") {
        if (!a.name?.trim()) throw new ToolError("name is required.", 400);
        let where = "My Drive (root)";
        if (a.parentId) where = (await meta(userId, a.parentId)).name;
        if (action === "create_folder") {
          type = "drive.create_folder";
          title = "Create Drive folder";
          params = { name: a.name.trim(), parentId: a.parentId };
          fields = [{ label: "Folder", value: a.name }, { label: "In", value: where }];
        } else {
          type = "drive.create_doc";
          title = "Create Drive file";
          params = { name: a.name.trim(), content: a.content ?? "", asGoogleDoc: a.asGoogleDoc !== false, parentId: a.parentId };
          fields = [
            { label: "File", value: `${a.name}${params.asGoogleDoc ? " (Google Doc)" : ""}` },
            { label: "In", value: where },
          ];
        }
      } else {
        if (!a.fileId) throw new ToolError("fileId is required. Use driveSearch to find it.", 400);
        const f = await meta(userId, a.fileId);
        const current = { label: f.mimeType === FOLDER ? "Folder" : "File", value: f.name };

        if (action === "rename") {
          if (!a.name?.trim()) throw new ToolError("name (the new name) is required.", 400);
          type = "drive.rename";
          title = "Rename in Drive";
          params = { fileId: a.fileId, name: a.name.trim() };
          fields = [current, { label: "New name", value: a.name }];
        } else if (action === "move") {
          if (!a.parentId) throw new ToolError("parentId (destination folder id) is required.", 400);
          const dest = await meta(userId, a.parentId);
          if (dest.mimeType !== FOLDER) throw new ToolError("The destination is not a folder.", 400);
          type = "drive.move";
          title = "Move in Drive";
          params = { fileId: a.fileId, parentId: a.parentId };
          fields = [current, { label: "Move to", value: dest.name }];
        } else {
          type = "drive.trash";
          title = "Move to Drive trash";
          params = { fileId: a.fileId };
          fields = [current, { label: "Note", value: "Recoverable from Drive's Trash" }];
          destructive = true;
        }
      }

      const { duplicate } = await prepareAction({
        service: "drive",
        type,
        params,
        preview: { title, fields, confirmLabel: destructive ? "Move to trash" : "Confirm", destructive },
      });
      return WRITE_RESULT(duplicate);
    }),
    {
      name: "driveWrite",
      description:
        "Create a folder, create a text/Google Doc file, rename, move, or trash a Drive file/folder. It is NOT applied until the user presses Confirm on a card. For rename/move/trash get fileId (and parentId for move) from driveSearch first. Permanent delete is not possible.",
      schema: z.object({
        action: z.enum(["create_folder", "create_doc", "rename", "move", "trash"]),
        name: z.string().optional().describe("Name for create_*, or the new name for rename"),
        content: z.string().optional().describe("Text content for create_doc"),
        asGoogleDoc: z.boolean().optional().describe("create_doc: true (default) makes a Google Doc, false a plain .txt file"),
        fileId: z.string().optional().describe("Target for rename/move/trash"),
        parentId: z.string().optional().describe("Parent folder id for create_*, or destination folder id for move"),
      }),
    },
  );

  return [driveSearch, driveRead, driveWrite];
}

export const DRIVE_LABEL = "Google Drive (search/read files, create folders/files, rename, move, trash)";