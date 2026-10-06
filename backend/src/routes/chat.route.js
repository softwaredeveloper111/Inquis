import { Router } from "express";

import { identifyUser } from "../middlewares/identifyUser.middleware.js";

const chatRouter = Router();

import {
  sendMessage,
  getChats,
  getMessages,
  deleteChatController,
  pinnedChatController,
  renameChatController,
} from "../controllers/chat.controller.js";

import {
  sendMessageValidation,
  getMessagesValidation,
  getChatsValidation,
  deleteChatValidation,
  pinnedChatValidation,
  renamechatValidation,
} from "../validations/chat.validator.js";

import {
  globalRateLimit,
  messageBurstLimit,
  messageDailyLimit,
} from "../middlewares/rateLimiter.middleware.js";

/**
 * @description   send user input to llm and get the response back
 * @routes        /api/chats/message
 * @method        POST
 * @access        Private
 *
 * @param          {string}  req.body.message  - user input message
 * @param          {string} req.body.chatId  - user ki chat ki id
 *
 * @returns        {object} 200 - successfully generate the answer
 * @returns        {object} 400 - bad request
 * @returns         {object} 500 - something went wrong
 */

chatRouter.post(
  "/message",
  globalRateLimit,
  identifyUser,
  sendMessageValidation,
  messageBurstLimit,
  messageDailyLimit,
  sendMessage,
);

/**
 * @description    get all the user's chat
 * @routes         /api/chats/
 * @method        GET
 * @access         Private
 *
 * @returns        {object} 200 - successsfully get all the chat list
 */

chatRouter.get("/", globalRateLimit, identifyUser, getChatsValidation , getChats);

/**
 * @description    get all the messages of a specific chat
 * @routes         /api/chats/messages/:chatId
 * @method         GET
 * @access         Private
 *
 * @param          {string} req.params.chatId - user ki chat ki id
 *
 * @returns        {object} 200 - successsfully get all the messages
 * @returns        {object} 404 - chat not found
 * @returns        {object} 500 - something went wrong
 */
chatRouter.get(
  "/messages/:chatId",
  globalRateLimit,
  identifyUser,
  getMessagesValidation,
  getMessages,
);

/**
 * @description   delete a specific chat
 * @routes        /api/chats/delete/:chatId
 * @method        DELETE
 * @access        Private
 *
 * @param          {string} req.params.chatId - user ki chat ki id
 *
 * @returns        {object} 200 - successsfully deleted the chat
 * @returns        {object} 404 - chat not found
 * @returns        {object} 500 - something went wrong
 */
chatRouter.delete(
  "/delete/:chatId",
  globalRateLimit,
  identifyUser,
  deleteChatValidation,
  deleteChatController,
);

chatRouter.patch(
  "/pinned/:chatId",
  globalRateLimit,
  identifyUser,
  pinnedChatValidation,
  pinnedChatController,
);

chatRouter.patch(
  "/rename/:chatId",
  globalRateLimit,
  identifyUser,
  renamechatValidation,
  renameChatController,
);

export { chatRouter };
