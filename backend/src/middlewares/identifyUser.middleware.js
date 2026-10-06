import jwt from "jsonwebtoken";
import crypto from "crypto";
import {userModel} from "../models/auth.model.js";
import {AppError} from "../utils/appError.util.js";
import {config} from "../config/config.js"
import {redis} from "../config/cache.js"
import {logger} from "../lib/logger.js";



export const identifyUser = async(req,res,next)=>{
  try {
    
    /** get the token */
    const token = req.cookies?.token;
  
    if(!token || typeof token !== "string"){
      throw new AppError("unthorized access !! token not found",401)
    }
 
  /** hash the token before check into blacklist redis store */
  const tokenHash = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");

const isBlacklisted = await redis.get(
  `blacklist:token:${tokenHash}`
);

if (isBlacklisted) {
  throw new AppError("unthorized access!! invalid token !! blacklisted token",401)
}

  
  /** verify jwt */
    const decoded = jwt.verify(token,config.JWT_SECRET_KEY);

    const userId = decoded.id;
    const cacheKey = `user:${userId}`;

    /** check for the data in redis cached storage */
    const cachedUser = await redis.get(cacheKey);


    /** cache hit */
    if(cachedUser){
      logger.info("Cache Hit ⚡");
      req.user = JSON.parse(cachedUser);
      return next();
    }


    /** cache miss */
     logger.info(`Cache Miss❌`);

    /** cache miss - fetch data from database */
     const user = await userModel.findById(userId).lean();
    if(!user){
      throw new AppError("user not found",404)
    }

    /** return  user  data from db,  save in redis with 5 min TTL */
    await redis.set(cacheKey,JSON.stringify(user),"EX",300) 

    req.user = user;
    next()

  } catch (error) {
     if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return next(
        new AppError("Invalid or expired token", 401)
      );
    }

    return next(error);
  }
  
}