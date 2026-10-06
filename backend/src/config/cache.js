import Redis from "ioredis";
import {config} from "../config/config.js";
import {logger} from "../lib/logger.js"

const redis = new Redis({
  port:config.REDIS_PORT,
  host:config.REDIS_HOST,
  password:config.REDIS_PASSWORD,
})

redis.on("connect" ,()=>{
  logger.info("redis connected successfully✅")
})

redis.on("error" , (err)=>{
  logger.error({error:err.message},`connection failure with redis❌`)
})


export {redis}