import { Worker } from "bullmq";
import { config } from "../config/config.js";
import { logger } from "../lib/logger.js";
import { connectToDB } from "../config/db.js";
import { fileModel } from "../models/file.model.js";
import { extractFileText } from "../services/parse.service.js";

const INLINE_MAX_CHARS = 60_000; // ~15000 tokens

// sirf ye errors user ko dikhte hain, baaki generic message
await connectToDB();


class UserFacingError extends Error {}

const fail = (id, reason) =>
  fileModel.updateOne({ _id: id }, { status: "failed", failReason: reason });

const fileWorker = new Worker(
  "file-ingest",
  async (job) => {
    const { fileId } = job.data;
    const file = await fileModel.findById(fileId);
    if (!file || file.status !== "processing") return; // delete ho gayi ya already done

    try {
      const res = await fetch(file.url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`download failed: ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());

      const raw = await extractFileText(buffer, file.mime);
      const text = raw.replace(/\u0000/g, "").trim();

      if (!text) {
        throw new UserFacingError("No readable text found (scanned files are not supported)");
      }
      if (text.length > INLINE_MAX_CHARS) {
       
        throw new UserFacingError("File is too long for now. Please upload a shorter file");
      }

      await fileModel.updateOne(
        { _id: file._id },
        { status: "ready", mode: "inline", extractedText: text }
      );
    } catch (error) {
      logger.error({ fileId, error: error.message }, "file ingest failed");
      await fail(
        file._id,
        error instanceof UserFacingError ? error.message : "Could not read this file"
      );
    }
    // throw nahi karte, isliye BullMQ retry nahi karega. User dobara upload kar sakta hai
  },
  {
    concurrency: 2,
    connection: {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
    },
  }
);

fileWorker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, error: error.message }, "file job crashed");
});

export default fileWorker;