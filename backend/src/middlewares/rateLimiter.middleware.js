/**
 * Multi-dimensional rate-limit
 * rate limit with ip based + email based
 */


import {rateLimit} from "express-rate-limit";
import { RedisStore } from 'rate-limit-redis'
import {redis} from "../config/cache.js";


const createRedisStore = (prefix)=>
  new RedisStore({
  prefix,
  sendCommand: (...args) => redis.call( ...args)
})


/**
 * GLOBAL rate limit
 * used : All API routes
 */
export const globalRateLimit = rateLimit({
  windowMs:15*60*1000,
  limit:300,
  store:createRedisStore("global-rate-limit:"),
   message:{
    success:false,
    statusCode:429,
    message:"too many request , please try again later"
  }
})


/**
 * AUTH rate limit
 * used: Login, Signup, Google auth
 */
export const authLimiter = rateLimit({
  windowMs:15*60*1000,
  limit:10,
  store:createRedisStore("auth-rate-limit:"),
   message:{
    success:false,
    statusCode:429,
    message:"too many request , please try again later"
  }
})



/**
 * FORGOT-PASSWORD rate-limit (IP)
 * used: Forgot password api routes
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs:15*60*1000,
  limit:3,
  store:createRedisStore("forgotPassword-rate-limit:"),
   message:{
    success:false,
    statusCode:429,
    message:"too many request , please try again later"
  }
})



/**
 * RESEND-EMAIL rate limit (IP)
 * used : Resend verification email
 */
export const emailLimiter = rateLimit({
  windowMs:15*60*1000,
  limit:3,
  store:createRedisStore("sendEmail-rate-limit"),
   message:{
    success:false,
    statusCode:429,
    message:"too many request , please try again later"
  }
})



/**
 * EMAIL_BASED rate-limit
 * used: 
 */

export const emailBasedRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,

  keyGenerator: (req) => {
    return req.body.email?.toLowerCase().trim() || "unknown";
  },

  store: createRedisStore("email-rate-limit:"),

  message: {
    success: false,
    statusCode: 429,
    message: "too many requests, please try again later",
  },
});




/**
 * AI message rate-limit (per USER, identifyUser ke baad lagta hai)
 * skipFailedRequests: providers fail hue (503) to user ka quota nahi jalta
 */

const userKey = (req) => req.user._id.toString();



export const messageBurstLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: userKey,
  skipFailedRequests: true,
  passOnStoreError: true, // Redis down ho to request block na ho
  store: createRedisStore("rl:msg:min:"),
  message: {
    success: false,
    statusCode: 429,
    message: "You're sending messages too fast. Please wait a moment.",
  },
});




export const messageDailyLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 50,
  keyGenerator: userKey,
  skipFailedRequests: true,
  passOnStoreError: true,
  store: createRedisStore("rl:msg:day:"),
  message: {
    success: false,
    statusCode: 429,
    message: "You've reached today's message limit. Please come back tomorrow.",
  },
});





export const fileUploadLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: userKey,
  skipFailedRequests: true,
  passOnStoreError: true,
  store: createRedisStore("rl:file:hour:"),
  message: {
    success: false,
    statusCode: 429,
    message: "Too many uploads. Please try again later.",
  },
});