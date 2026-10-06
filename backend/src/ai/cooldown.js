import { redis } from "../config/cache.js"; // <- apne redis file ka path
import { logger } from "../lib/logger.js";

const REDIS_TIMEOUT_MS = 300;
const FAIL_WINDOW_SEC = 30;

const cooldownKey = (name) => `ai:cooldown:${name}`;
const failKey = (name) => `ai:fail:${name}`;

/**
 * Fail-open wrapper.
 * ioredis Redis down hone par commands queue kar leta hai (hang ho sakta hai),
 * isliye timeout lagaya hai. Redis kharab ho to AI band nahi hona chahiye.
 */
async function safe(fn, fallback) {
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("redis timeout")), REDIS_TIMEOUT_MS)
      ),
    ]);
  } catch (err) {
    logger.warn({ error: err.message }, "cooldown redis op failed (fail-open)");
    return fallback;
  }
}


/**
 * 
 *  isCoolingDown("gemini") : gemini kya cooldown mein hai? ai:cooldown:gemini
 *      
 *   yes -> skip
 *   No  ->  try
 */
export const isCoolingDown = (name) =>
  safe(async () => (await redis.exists(cooldownKey(name))) === 1, false);



/**
 * setCooldown("gemini",60 seconds)  
 * ai:cooldown:gemini = "1"
 * TTL = 60 seconds
 */
export const setCooldown = (name, seconds) =>
  safe(() => redis.set(cooldownKey(name), "1", "EX", Math.ceil(seconds)), null);



/** 30 sec window mein failures count karta hai, count return karta hai */
export const recordFailure = (name) =>
  safe(async () => {
    const count = await redis.incr(failKey(name));
    if (count === 1) await redis.expire(failKey(name), FAIL_WINDOW_SEC);
    return count;
  }, 0);