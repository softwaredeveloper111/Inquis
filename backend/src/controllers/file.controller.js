import { fileModel } from "../models/file.model.js";
import { uploadBuffer } from "../services/storage.service.js";
import { AppError } from "../utils/appError.util.js";
import { asyncWrapper } from "../utils/asyncWrapper.util.js";
import { sendResponse } from "../utils/appResponse.util.js";
import { logger } from "../lib/logger.js";

import { fileQueue } from "../queues/file.queue.js";

const toFileDto = (f) => ({
  id: f._id,
  name: f.name,
  mime: f.mime,
  size: f.size,
  url: f.url,
  status: f.status,
  mode: f.mode,
  failReason: f.failReason,
});

export const uploadFile = asyncWrapper(async (req, res) => {
  const { buffer, originalname, size } = req.file;
  const { mime, resourceType } = req.fileInfo;

  let upload;
  try {
    upload = await uploadBuffer(buffer, { resourceType });
  } catch (error) {
    logger.error({ error: error.message }, "file upload to storage failed");
    throw new AppError("File upload failed, please try again", 502);
  }

  // multer filename latin1 mein deta hai, utf8 mein convert (Hindi/emoji naam ke liye)
  const name = Buffer.from(originalname, "latin1").toString("utf8").slice(0, 200);

  // image ko processing ki zarurat nahi, seedha ready. PDF/TXT ko Step 2 mein worker ready karega
  const isImage = resourceType === "image";

  const file = await fileModel.create({
    user: req.user._id,
    name,
    mime,
    size,
    url: upload.secure_url,
    publicId: upload.public_id,
    resourceType,
    status: isImage ? "ready" : "processing",
    mode: isImage ? "image" : null,
  });

    if (!isImage) {
    try {
      await fileQueue.add("ingest", { fileId: file._id.toString() });
    } catch (error) {
      logger.error({ error: error.message }, "enqueue file job failed");
      file.status = "failed";
      file.failReason = "Could not start processing";
      await file.save();
    }
    }

  sendResponse(res, 201, "file uploaded", toFileDto(file));
});

export const getFileStatus = asyncWrapper(async (req, res) => {
  const file = await fileModel.findOne({ _id: req.params.fileId, user: req.user._id });
  if (!file) throw new AppError("file not found", 404);

  sendResponse(res, 200, "file fetched", toFileDto(file));
});