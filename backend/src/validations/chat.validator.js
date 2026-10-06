import {validationErrorHandler} from "../middlewares/validation.middleware.js"
import {body , param, query} from "express-validator";



export const sendMessageValidation = [
    body("message")
    .trim()
     .isLength({ max: 8000 }).withMessage("Message is too long (max 8000 characters)")
    .custom((value, { req }) => {
    const hasFiles = Array.isArray(req.body.fileIds) && req.body.fileIds.length > 0;
    if (!value && !hasFiles) throw new Error("message is required");
    return true;
  }),
    
    body("chatId")
    .optional()
    .isMongoId().withMessage("invalid chat id")
    .trim(),
    
    body("fileIds").optional().isArray({ max: 3 }).withMessage("only 3 file allowed per message"),
    body("fileIds.*").isMongoId().withMessage("invalid file id"),

    validationErrorHandler,
]



export const getMessagesValidation = [
  param("chatId")
    .trim()
    .notEmpty().withMessage("chat id is required")
    .isMongoId().withMessage("invalid chat id")
    .trim(),
    
      query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("invalid limit"),
  query("cursor").optional().isMongoId().withMessage("invalid cursor"),

    validationErrorHandler
]


export const getChatsValidation = [
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("invalid limit"),
  query("cursor").optional().isISO8601().withMessage("invalid cursor"),
  validationErrorHandler,
];


export const deleteChatValidation = [
  param("chatId")
    .trim()
    .notEmpty().withMessage("chat id is required")
    .isMongoId().withMessage("invalid chat id")
    .trim(),


    validationErrorHandler
]



export const pinnedChatValidation = [
   param("chatId")
    .trim()
    .notEmpty().withMessage("chat id is required")
    .isMongoId().withMessage("invalid chat id")
    .trim(),


    validationErrorHandler
]


export const renamechatValidation = [
   param("chatId")
    .trim()
    .notEmpty().withMessage("chat id is required")
    .isMongoId().withMessage("invalid chat id")
    .trim(),

    
  body("newTitle")
  .trim()
  .notEmpty()
  .withMessage("New title is required")
  .custom((value) => {
    const wordCount = value.split(/\s+/).length;

    if (wordCount < 2 || wordCount > 4) {
      throw new Error("New title must contain between 2 and 4 words");
    }

    return true;
  }),

    validationErrorHandler
]
