import { fileModel } from "../models/file.model.js";
import { AppError } from "../utils/appError.util.js";

const MAX_DOCS = 4;
const MAX_IMAGES = 4; // is message ki + chat ki pichli images, total

async function toDataUrl(file) {
  const res = await fetch(file.url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`image download failed: ${res.status}`);
  const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
  return `data:${file.mime};base64,${base64}`;
}

/**
 * attached = is message ke saath aayi files (validated)
 * docs     = prompt mein jane wale inline documents
 * images   = Gemini ko jane wali images (base64 data URLs)
 * Sirf READ karta hai, kuch write nahi.
 */
export async function loadFileContext({ userId, chat, fileIds = [] }) {
  let attached = [];

  if (fileIds.length) {
    attached = await fileModel
      .find({ _id: { $in: fileIds }, user: userId })
      .select("+extractedText");

    if (attached.length !== new Set(fileIds).size) throw new AppError("file not found", 404);

    for (const f of attached) {
      if (f.status !== "ready") throw new AppError("file is not ready yet", 400);
      if (f.chat && (!chat || !f.chat.equals(chat._id))) {
        throw new AppError("file already belongs to another chat", 400);
      }
    }
  }

  const attachedIds = attached.map((f) => f._id);
  const attachedImages = attached.filter((f) => f.mode === "image");
  const slots = MAX_IMAGES - attachedImages.length; // limit(0) = unlimited hota hai, isliye guard

  let previousDocs = [];
  let previousImages = [];

  if (chat) {
    const base = { chat: chat._id, status: "ready", _id: { $nin: attachedIds } };

    previousDocs = await fileModel
      .find({ ...base, mode: "inline" })
      .sort({ createdAt: -1 })
      .limit(MAX_DOCS)
      .select("+extractedText");

    if (slots > 0) {
      previousImages = await fileModel
        .find({ ...base, mode: "image" })
        .sort({ createdAt: -1 })
        .limit(slots);
    }
  }

  const docs = [...attached.filter((f) => f.mode === "inline"), ...previousDocs].slice(0, MAX_DOCS);

  // purani pehle, nayi baad mein
  const imageFiles = [...previousImages.reverse(), ...attachedImages].slice(-MAX_IMAGES);

  let images = [];
  try {
    images = await Promise.all(imageFiles.map(toDataUrl));
  } catch {
    throw new AppError("Could not load the image, please try again", 502);
  }

  return { attached, docs, images };
}