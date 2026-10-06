import mongoose from "mongoose";
import { config } from "../config/config.js";
import {logger} from "../lib/logger.js"

export const connectToDB = async()=>{
  try {
    await mongoose.connect(config.MONGO_URI);
    logger.info(`database connected successfully✅`);
  } catch (error) {
    logger.error({error:error.message},`connection problem with database❌`);
    process.exit(1)
  }

} 