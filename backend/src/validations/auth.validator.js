import {body} from "express-validator";
import {validationErrorHandler} from "../middlewares/validation.middleware.js"


export const registerValidation = [

  body("username")
  .trim()
  .notEmpty().withMessage("username must be required")
  .isLength({min:3}).withMessage("username must be at least 3 characters")
  .isLength({max:30}).withMessage("username cannot exceed 30 characters")
  .matches(/^[a-z0-9_]{3,30}$/).withMessage("please provide a valid username"),
  

  body("email")
  .trim()
  .notEmpty().withMessage("email must be required")
  .matches(/^\S+@\S+\.\S+$/).withMessage("Please provide a valid email address")
  .normalizeEmail(),

  
  body("password")
  .notEmpty().withMessage("password must be required")
  .isLength({min:8}).withMessage("password must be at least 8 characters")
  .isLength({max:72}).withMessage("password  cannot exceed 72 characters")
  .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$/)
  .withMessage("please provide a valid password"),

  validationErrorHandler

]


export const loginValidation = [
  body("email")
  .trim()
  .notEmpty().withMessage("email must be required"),

  body("password")
  .notEmpty().withMessage("password must be required"),
 

  validationErrorHandler

]


export const resendEmailVerificationValidation = [
   body("email")
  .trim()
  .notEmpty().withMessage("email must be required"),

  validationErrorHandler
]


export const forgotPasswordValidation = [
   body("email")
  .trim()
  .notEmpty().withMessage("email must be required"),

  validationErrorHandler
]



export const resetPasswordValidation = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("reset token is required"),

  body("password")
  .notEmpty().withMessage("password must be required")
  .isLength({min:8}).withMessage("password must be at least 8 characters")
  .isLength({max:72}).withMessage("password  cannot exceed 72 characters")
  .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$/)
  .withMessage("please provide a valid password"),

  validationErrorHandler

];