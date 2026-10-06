import { Queue } from "bullmq";
import { config } from "../config/config.js";

export const fileQueue = new Queue("file-ingest", {
  connection: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
  },
  defaultJobOptions: { removeOnComplete: true, removeOnFail: 100 },
});