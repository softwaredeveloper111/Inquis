import dns from 'dns';
import {config} from "./src/config/config.js"
if (config.NODE_ENV === "development") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

import "./src/workers/index.js";

import { app } from "./src/app.js";
import { connectToDB } from "./src/config/db.js";
import {logger} from "./src/lib/logger.js";

import {initSocket} from "./src/sockets/server.socket.js";
import {createServer} from "http"

import "./src/config/cache.js"

process.on("unhandledRejection", (reason) => {
  const msg = reason?.message ?? String(reason);
  const isAbort = /Error reading from the stream/.test(msg);
  logger[isAbort ? "warn" : "error"]({ error: msg }, "unhandled rejection");
});


const httpServer = createServer(app);
const PORT = config.PORT
connectToDB()

initSocket(httpServer);
  

httpServer.listen(PORT,()=>{
  if(config.NODE_ENV==="development"){
    logger.info(`server is running at http://localhost:${PORT}✅`);
  }
  else{
    logger.info(`server is running at PORT ${PORT}✅`);
  }
})