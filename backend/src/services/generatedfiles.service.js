import crypto from "crypto";
import { config } from "../config/config.js";
import { generatedFileModel } from "../models/generatedFile.model.js";

export class FileGenError extends Error {}

const MAX_BYTES = 5 * 1024 * 1024;
const trim = (u) => u.replace(/\/+$/, "");

/** unsafe chars hatao, extension force karo */
export function cleanName(raw, ext) {
  const base =
    String(raw ?? "")
      .replace(/\.[a-z0-9]{1,5}$/i, "")
      .replace(/[^\p{L}\p{N}._ -]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "file";
  return `${base}.${ext}`;
}

/** model kabhi literal "\n" likh deta hai */
export const fixNewlines = (s) => String(s ?? "").replace(/\\r\\n|\\n/g, "\n").replace(/\\t/g, "\t");

export async function saveGeneratedFile({ userId, name, mime, data }) {
  if (data.length > MAX_BYTES) throw new FileGenError("The file is too large (max 5 MB). Make the content shorter.");
  const token = crypto.randomBytes(16).toString("hex");
  await generatedFileModel.create({ user: userId, token, name, mime, size: data.length, data });
  return { name, url: `${trim(config.BACKEND_URL)}/api/generated-files/${token}` };
}