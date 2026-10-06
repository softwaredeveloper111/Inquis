import { Router } from "express";

import {
  registerUserController,
  verifyLinkController,
  resendVerificationLinkController,
  loginuserController,
  getMeController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
} from "../controllers/auth.controller.js";

import {
  registerValidation,
  loginValidation,
  resendEmailVerificationValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../validations/auth.validator.js";

import { identifyUser } from "../middlewares/identifyUser.middleware.js";

import {
  globalRateLimit,
  authLimiter,
  forgotPasswordLimiter,
  emailLimiter,
  emailBasedRateLimit,
} from "../middlewares/rateLimiter.middleware.js";

import { csrfProtection } from "../middlewares/csrf.middleware.js";

const authRouter = Router();




/**
 * @description   registered a new user and send verification link to the registered email
 * @route         /api/auth/register
 * @access        Public
 * @method        POST
 *
 * @param        {string}   username  (req.body)
 * @param        {string}   email     (req.body)
 * @param        {password} password   (req.body)
 *
 * @return       {object} 200 - successfully register
 * @return       {Object} 400 - bad request
 */

authRouter.post(
  "/register",
  csrfProtection,
  authLimiter,
  registerValidation,
  registerUserController,
);

/**
 * @description   verification link
 * @route         /api/auth/verify-email?token=token
 * @access        Public
 * @method        GET
 *
 * @Param        {string} token (req.query)
 *
 * @return       {Object} 200 - successfully verify the link
 * @return       {Object} 400 -  bad request
 * @return       {Object} 401 - invalid token
 */

authRouter.get("/verify-email", verifyLinkController);

/**
 * @description   resend verification link to the given email
 * @route         /api/auth/resend-verify-email
 * @access        Public
 * @method        POST
 *
 * @Param        {string} req.body.email  registered email jismein user want link
 *
 * @return       {Object} 200 - successfully verify the link
 * @return       {Object} 401 - email is not registered
 * @returns      {Object} 400 -  email already verified
 */

authRouter.post(
  "/resend-verify-email",
  csrfProtection,
  emailLimiter,
  emailBasedRateLimit,
  resendEmailVerificationValidation,
  resendVerificationLinkController,
);

/**
 * @description   login a user and get jwt token
 * @route         /api/auth/login
 * @access        Public
 * @method        POST
 *
 * @param         {string}   req.body.email  - user's email
 * @param         {string}   req.body.password - user's password
 *
 * @returns       {Object} 200 - successfully loggedin and get jwt token
 * @returns       {Object} 401 - invalid credentials
 */

authRouter.post(
  "/login",
  csrfProtection,
  authLimiter,
  loginValidation,
  loginuserController,
);

/**
 * @description   get the current loggedin user
 * @route         /api/auth/me
 * @access        Protected
 * @method        GET
 *
 * @returns {Object} 200 - successfully fetch current loggedin user details
 * @returns {Object} 401 - unthorized access
 *
 */

authRouter.get("/me", globalRateLimit, identifyUser, getMeController);

/**
 * @description     logout the current user
 * @route           /api/auth/logout
 * @access          Protected
 * @method          POST
 *
 * @returns         {Object} 200 - User logout successfully + clear jwt token
 * @returns         {Object} 401 - unthorized access
 */

authRouter.post(
  "/logout",
  csrfProtection,
  globalRateLimit,
  identifyUser,
  logoutController,
);

/**
 * @description forgot user password
 * @route     /api/auth/forgot-password
 * @method    POST
 * @access    Public
 *
 * @param     {string} req.body.email   registered email
 *
 * @returns   {Object} 200 - successfully send reset password verification email link
 *
 */
authRouter.post(
  "/forgot-password",
  csrfProtection,
  emailLimiter,
  emailBasedRateLimit,
  forgotPasswordValidation,
  forgotPasswordController,
);

/**
 * @description   reset user password
 * @route         /api/auth/reset-password
 * @method       POST
 * @access        Public
 *
 * @param        {string} req.body.token
 * @param        {string} req.body.password
 *
 * @return       {Object} 200 - successfully change the password
 */

authRouter.post(
  "/reset-password",
  csrfProtection,
  forgotPasswordLimiter,
  resetPasswordValidation,
  resetPasswordController,
);

export { authRouter };
