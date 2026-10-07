import { Worker } from "bullmq";
import { config } from "../config/config.js";
import { logger } from "../lib/logger.js";
import { sendEmail } from "../services/email.service.js";

import forgotPasswordEmailTemplate from "../templates/forgotPasswordEmailTemplate.js";
import verificationEmailTemplate from "../templates/verification-email.template.js";

const emailWorker = new Worker(
  "email",
  async (job) => {
    logger.info(`Processing job: ${job.name}`);

    if (job.name === "verification-email") {
      const { email, username, verificationToken } = job.data;
      const html = verificationEmailTemplate({
        username,
        emailVerificationToken: verificationToken,
      });

      await sendEmail(
        email,
        "[Inquis] Verify your email address",
        "Please verify your email address to complete your registration.",
        html
      );
    }

    if (job.name === "password-reset-email") {
      const { email, username, resetUrl } = job.data;
      const html = forgotPasswordEmailTemplate({
        username,
        resetUrl,
      });

      await sendEmail(
        email,
        "[Inquis] Reset your password",
        "Reset your password using the provided link.",
        html
      );
    }

  },
  {
    connection: {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
    },
  }
);


emailWorker.on("completed", (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

emailWorker.on("failed", (job, error) => {
  logger.error({
    jobId: job?.id,
    error: error.message,
  }, "Job failed");
});

export default emailWorker;