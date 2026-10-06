import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import {errorHandler} from "./middlewares/errorHandler.middleware.js";

import {pinoHttp} from "pino-http";
import {logger} from "./lib/logger.js";

import { config } from "./config/config.js";

import cors from "cors";

import helmet from "helmet";
import mongoSanitize from "@exortek/express-mongo-sanitize";

import {chatRouter} from "./routes/chat.route.js";
import { fileRouter } from "./routes/file.route.js";
import { authRouter } from "./routes/auth.route.js";
import { googleAuthRouter } from "./routes/googleAuth.route.js";
import { connectorsRouter } from "./routes/connectors.routes.js";

import { generatedFilesRouter } from "./routes/generatedfiles.route.js";



const app = express();
app.set("trust proxy", 1);

/** application middleware */
app.use(express.static("public"))
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(helmet());
app.use(mongoSanitize());

/** http logger middleware */
app.use(morgan("dev"))
// app.use(pinoHttp({logger}))


/** application cors setup */
const allowedOrigins = [
  "http://localhost:5173",
  config.FRONTEND_URL,
]
app.use(cors({
  origin:function(origin,callback){

    if(!origin){
      return callback(null,true);
    }
    if(allowedOrigins.includes(origin)){
      return callback(null,true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  credentials:true,
  methods:["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders:["Content-Type","Authorization"]
}));



/** application routes */
app.use("/api/auth", authRouter)
app.use("/api/auth/google", googleAuthRouter);
app.use("/api/chats",chatRouter)
app.use("/api/files", fileRouter);
app.use("/api/connectors", connectorsRouter);
app.use("/api/generated-files", generatedFilesRouter); 



/** health check route */
app.get("/api/health",(req,res)=>{
  res.status(200).json({
    status:"ok",
    uptime:process.uptime(),
    timestamp:Date.now()
  })
})


/** express global error handler */
app.use(errorHandler)
export {app};