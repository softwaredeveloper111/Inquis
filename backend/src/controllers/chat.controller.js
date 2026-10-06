import { asyncWrapper } from "../utils/asyncWrapper.util.js";
import { sendResponse } from "../utils/appResponse.util.js";
import { AppError } from "../utils/appError.util.js";

import { config } from "../config/config.js";

import { logger } from "../lib/logger.js"; 

import { generateChatTitle, generateResponse } from "../services/ai.service.js";

import { chatModel } from "../models/chat.model.js";
import { messageModel } from "../models/message.model.js";

import { fileModel } from "../models/file.model.js";
import { loadFileContext } from "../services/fileContext.service.js";

const HISTORY_LIMIT = 20;
const FRIENDLY_ERROR = "We couldn't generate a response right now. Please try again.";

import { deleteFromStorage } from "../services/storage.service.js";

import { runWithConnectorContext } from "../context/context.js";

export const sendMessage = asyncWrapper(async (req, res) => {
  const { message, chatId, fileIds } = req.body;
  const user = req.user;
  const IMAGE_BUSY_ERROR = "Image analysis is busy right now. Please try again later.";
 
  /* 1. Validate + history load (sirf READ) */
  let chat = null;
  let history = [];
 
  if (chatId) {
    chat = await chatModel.findOne({ _id: chatId, user: user._id });
    if (!chat) throw new AppError("chat not found", 404);
 
    const recent = await messageModel
      .find({ chat: chat._id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(HISTORY_LIMIT)
      .lean();
    history = recent.reverse();
  }

  const { attached, docs , images } = await loadFileContext({ userId: user._id, chat, fileIds });

  const text = message?.trim() || "Please look at the attached file(s) and describe what is in them.";
 
  history.push({ role: "user", content: text });
  const isNewChat = !chat;
 
  /* 2. Stream helpers */
 
  // user tab band kar de to AI ko rok do (tokens waste na ho)
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) controller.abort();
  });
 
  // NDJSON: har line ek JSON event  {"type":"token","text":"..."}
  const send = (event) => res.write(JSON.stringify(event) + "\n");


 
  // Headers PEHLE TOKEN par hi jate hain. Isse:
  //  - pehle token se pehle sab fail hue => normal 503 JSON bhej sakte hain
  //  - rate limiter ka skipFailedRequests bhi sahi chalta hai
  const startStream = () => {          
  if (res.headersSent) return;
  res.status(200);
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
};

const onToken = (text) => {           
  startStream();
  send({ type: "token", text });
};

const onStatus = (status) => {         
  startStream();
  send({ type: "status", status });
};

const onAction = (event) => {
  startStream();
  send(event); // {type:"connector_action", action:{...}}
};


  /* 3. Title parallel me start (kabhi reject nahi hota) */
  const titleSource = message?.trim() || attached[0]?.name || text;
const titlePromise = isNewChat ? generateChatTitle(titleSource) : Promise.resolve(null);
 
  /* 4. AI stream. DB abhi bhi untouched */
  let ai;
  try {
   ai = await runWithConnectorContext(
  { userId: user._id, emit: onAction },
  () => generateResponse(history, { onToken, onStatus, signal: controller.signal, docs, images }),

);


  } catch (error) {
    if (controller.signal.aborted) return; // user chala gaya, kuch bhejna nahi
 
    logger.error({ error: error?.message, userId: user._id }, "AI generation failed");
    const errorText = images.length ? IMAGE_BUSY_ERROR : FRIENDLY_ERROR;
 
    if (res.headersSent) {
      // stream beech mein toot gayi: error event bhejo, DB mein kuch nahi likhna
      send({ type: "error", message:  errorText });
      return res.end();
    }
    throw new AppError( errorText, 503); // pehle token se pehle fail
  }
 
  /* 5. AI poora success -> ab hi DB mein likho */
  const title = await titlePromise;
 
  try {
    if (isNewChat) {
      chat = await chatModel.create({ user: user._id, title });
    }
 
    const now = Date.now();
    await messageModel.insertMany([
      { chat: chat._id, role: "user", content: text, attachments: attached.map((f) => f._id), createdAt: new Date(now) },
      { chat: chat._id, role: "ai", content: ai.response, createdAt: new Date(now + 1) },
    ]);
  } catch (error) {
    logger.error({ error: error?.message }, "saving messages failed");
 
    if (isNewChat && chat) {
      await chatModel.findByIdAndDelete(chat._id).catch((e) =>
        logger.error({ error: e.message }, "orphan chat cleanup failed")
      );
    }
    // headers ja chuke hain, isliye throw nahi, event bhejo
    send({ type: "error", message: FRIENDLY_ERROR });
    return res.end();
  }

   if (attached.length) {
    await fileModel
      .updateMany({ _id: { $in: attached.map((f) => f._id) } }, { chat: chat._id })
      .catch((e) => logger.error({ error: e.message }, "linking files to chat failed"));
  }
 
  /* 6. Done event: frontend ko chat id aur title mil jata hai */
  send({ type: "done", chat: chat._id, title: isNewChat ? chat.title : undefined });
  res.end();
});
 



export const getChats = asyncWrapper(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const { cursor } = req.query; // last loaded unpinned chat ka updatedAt

  const filter = { user: req.user._id, isPinned: false };
  if (cursor) filter.updatedAt = { $lt: new Date(cursor) };

  const rows = await chatModel.find(filter).sort({ updatedAt: -1 }).limit(limit + 1);
  const hasMore = rows.length > limit;
  const chats = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? chats[chats.length - 1].updatedAt : null;

  // pinned chats sirf pehle batch mein, poore
  if (!cursor) {
    const pinned = await chatModel
      .find({ user: req.user._id, isPinned: true })
      .sort({ updatedAt: -1 });
    chats.unshift(...pinned);
  }

  sendResponse(res, 200, "all chat list get successfully", { chats, hasMore, nextCursor });
});


export const getMessages = asyncWrapper(async (req, res) => {
  const { chatId } = req.params;
  const user = req.user;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const { cursor } = req.query; // sabse purane loaded message ka _id

  const checkChat = await chatModel.findById(chatId);
  if (!checkChat) throw new AppError("chat not found", 404);
  if (checkChat.user.toString() !== user._id.toString()) {
    throw new AppError("forbidden access", 403);
  }

  const filter = { chat: chatId };
  if (cursor) filter._id = { $lt: cursor };

  // naye se purane order mein lao, phir ulta karke bhejo
  const rows = await messageModel.find(filter).sort({ _id: -1 }).limit(limit + 1).populate("attachments", "name mime url");
  const hasMore = rows.length > limit;
  const messages = (hasMore ? rows.slice(0, limit) : rows).reverse();
  const nextCursor = hasMore ? messages[0]._id : null;

  sendResponse(res, 200, "all messages get successfully", { messages, hasMore, nextCursor });
});



export const deleteChatController = asyncWrapper(async(req,res)=>{
  const {chatId} = req.params;
  const user = req.user;

  const checkChat = await chatModel.findById(chatId);
  if(!checkChat){
   throw new  AppError('chat not found',404)
  }
  
  if(!(checkChat.user.toString() === user._id.toString())){
   throw new AppError('forbidden access',403)
  }

    const files = await fileModel.find({ chat: chatId }).select("publicId resourceType");

  await chatModel.findByIdAndDelete(chatId);
  await messageModel.deleteMany({ chat: chatId });
  await fileModel.deleteMany({ chat: chatId });

  // storage cleanup best-effort, fail ho to chat delete nahi rukti
  const results = await Promise.allSettled(
    files.map((f) => deleteFromStorage(f.publicId, f.resourceType))
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed) logger.warn({ chatId, failed }, "some files were not deleted from storage");
    sendResponse(res, 200, "chat deleted successfully", {});
})





export const pinnedChatController =  asyncWrapper(async(req,res)=>{
    const chatId = req.params?.chatId;
    const user = req.user;
    
    const checkChat = await chatModel.findById(chatId);
  if(!checkChat){
   throw new  AppError('chat not found',404)
  }
  
  if(!(checkChat.user.toString() === user._id.toString())){
   throw new AppError('forbidden access',403)
  }
  

  checkChat.isPinned  = checkChat.isPinned ? false : true
  await checkChat.save()
  
  sendResponse(res,200, `chat ${checkChat.isPinned?"pinned":"unpinned"} successfully` , checkChat)

})





export const renameChatController =  asyncWrapper(async(req,res)=>{
  
  const chatId = req.params?.chatId;
  const {newTitle} = req.body;
  const user = req.user;
    
    const checkChat = await chatModel.findById(chatId);
  if(!checkChat){
   throw new  AppError('chat not found',404)
  }
  
  if(!(checkChat.user.toString() === user._id.toString())){
   throw new AppError('forbidden access',403)
  }
  
  checkChat.title = newTitle;
  await checkChat.save()

 sendResponse(res,200, `chat renamed successfully` , checkChat)

})