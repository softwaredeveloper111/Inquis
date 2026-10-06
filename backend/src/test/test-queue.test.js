import { emailQueue } from "../queues/email.queue.js";

await emailQueue.add("test-email", {
  email: "test@example.com",
  message: "Hello from BullMQ",
});

console.log("Job added");
process.exit(0);