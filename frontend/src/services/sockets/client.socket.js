import { io } from "socket.io-client";

export const initializeSocketConnection = ()=>{
  const socket = io(import.meta.env.VITE_BACKEND_API, {
    withCredentials:true
  });
  
  socket.on("connect",()=>{
    console.log("Connected to Socket.IO server")
  })
}