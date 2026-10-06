import {Queue} from "bullmq";
import {redis} from "../config/cache.js";
import {config} from "../config/config.js"

export const emailQueue = new Queue("email",{
 connection: {
  host:config.REDIS_HOST,
  port:config.REDIS_PORT,
  password:config.REDIS_PASSWORD,
 }
})