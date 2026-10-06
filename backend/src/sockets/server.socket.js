import {Server} from "socket.io";
import { config } from "../config/config.js";
import {logger} from "../lib/logger.js"

let io;


export function initSocket(httpServer){
  io = new Server(httpServer , {
    cors:{
      origin:config.FRONTEND_URL,
      credentials:true
    }
  })

  logger.info("Socket.io server is running")

  io.on("connection" , (socket)=>{
    logger.info(`A user connected ${socket.id}`)
  })
}


export function getIO(){
  if(!io){
    throw new Error("Socket.io  not initialize")
  }

  return io
}