import { config } from "../config/config.js";
import { userModel } from "../models/auth.model.js";

import { AppError } from "../utils/appError.util.js";
import { asyncWrapper } from "../utils/asyncWrapper.util.js";
import { sendResponse } from "../utils/appResponse.util.js";

import jwt from "jsonwebtoken";

import { sendEmail } from "../services/email.service.js";

import verificationEmailTemplate from "../templates/verification-email.template.js"
import alreadyEmailVerifiedTemplate from "../templates/alreadyVerified-email.template.js"
import afterEmailVerfiedTemplate from "../templates/afterVerified-email.template.js"
import forgotPasswordEmailTemplate from "../templates/forgotPasswordEmailTemplate.js"

import {expiredVerificationTemplate} from "../templates/expiredVerificationTemplate.js";
import {invalidVerificationTemplate} from "../templates/invalidVerificationTemplate.js";

import crypto from "crypto"

import {redis} from "../config/cache.js"
import bcrypt from "bcryptjs";


import {emailQueue} from "../queues/email.queue.js"




const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: config.NODE_ENV === "development" ? "strict" : "none",
  maxAge: 24 * 60 * 60 * 1000, // for 1 day
  path: "/",
};



export const registerUserController = asyncWrapper(async (req, res) => {
  const { username, email, password } = req.body;

  const userAlreadyRegistered = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (userAlreadyRegistered) {
    throw new AppError("user already registered", 409);
  }

  const user = await userModel.create({
    username,
    email,
    password,
  });

  const emailVerificationToken = jwt.sign(
    {
      id: user._id,
    },
    config.EMAIL_VERIFICATION_JWT_SECRET_KEY,
    { expiresIn: "5m" },
  );

  const emailVerificationTokenHash = crypto
  .createHash("sha256")
  .update(emailVerificationToken)
  .digest("hex");


  await redis.set(
  `email-verification:${user._id}`,
  emailVerificationTokenHash,
 "EX", 300 
);

  await emailQueue.add("verification-email", {
  email: user.email,
  username: user.username,
  verificationToken: emailVerificationToken,
},{
  attempts:3,
   backoff: {
    type: "exponential",
    delay: 5000,
  },
});

  const newUserObj = user.toObject();
  delete newUserObj.password;
  delete newUserObj.__v;

  sendResponse(
    res,
    201,
    "user registered successfully and send verification link",
    newUserObj,
  );
});




export const verifyLinkController = asyncWrapper(async (req, res) => {
  const token = req.query?.token;

  if (!token || typeof token !== "string") {
    return res.status(400).send(invalidVerificationTemplate());
  }

  let decoded;
  try {

    decoded = jwt.verify(
      token,
      config.EMAIL_VERIFICATION_JWT_SECRET_KEY
    );
    
  } catch (error) {
     if (error.name === "TokenExpiredError") {
      return res.status(410).send(expiredVerificationTemplate());
    }

    return res.status(401).send(invalidVerificationTemplate());
  }

 
  if (typeof decoded === "string" || !decoded.id) {
    return res.status(401).send(invalidVerificationTemplate());
  }

  const user = await userModel.findById( decoded.id);

  if (!user) {
    return res.status(404).send(invalidVerificationTemplate());
  }


  if (user.verified) {
    return res.status(200).send(alreadyEmailVerifiedTemplate());
  }

  const tokenHash = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");

   const storedTokenHash = await redis.get(
  `email-verification:${decoded.id}`
);

if (!storedTokenHash || storedTokenHash !== tokenHash) {
  return res.status(401).send(
    invalidVerificationTemplate()
  );
}

  user.verified = true;
  await user.save();

  await redis.del(`email-verification:${decoded.id}`);

  return res.status(200).send(afterEmailVerfiedTemplate());
});





export const resendVerificationLinkController = asyncWrapper(async(req,res)=>{
   const {email} = req.body;
  
   const isEmailRegistered = await userModel.findOne({email});
   if(!isEmailRegistered){
    throw new AppError("user not found",401)
   }

   const isEmailAlreadyVerified = isEmailRegistered?.verified ;
   if(isEmailAlreadyVerified){
    throw new AppError("user already verified",400)
   }
   

     const emailVerificationToken = jwt.sign(
    {
      id:isEmailRegistered._id
    },
    config.EMAIL_VERIFICATION_JWT_SECRET_KEY,
    { expiresIn: "5m" },
  );

  const emailVerificationTokenHash = crypto
  .createHash("sha256")
  .update(emailVerificationToken)
  .digest("hex");


    await redis.set(
  `email-verification:${isEmailRegistered._id}`,
  emailVerificationTokenHash,
   "EX", 300 
);


  await emailQueue.add("verification-email",{
    email:isEmailRegistered.email,
    username:isEmailRegistered.username,
    verificationToken:emailVerificationToken

  },

  {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
  },

})

  sendResponse(res,200,"email link sent successfully",null)


})




export const forgotPasswordController = asyncWrapper(async(req,res)=>{
  
  const {email} = req.body;

  const user = await userModel.findOne({email});
  if(!user){
   return sendResponse(res,200, "If an account exists, a password reset link has been sent",null)
  }

  const resetPasswordToken = jwt.sign(
    {
      id: user._id,
    },
    config.RESET_PASSWORD_JWT_SECRET_KEY,
    { expiresIn: "5m" },
  );
  
   const tokenHash = crypto
    .createHash("sha256")
    .update(resetPasswordToken)
    .digest("hex");


   await redis.set(
  `password-reset:user:${user._id}`,
  tokenHash,
  "EX",
  300
);
    const resetUrl =
    `${config.FRONTEND_URL}/reset-password?token=${resetPasswordToken}`;
  
  await emailQueue.add("password-reset-email",{
  email: user.email,
  username: user.username,
  resetUrl:resetUrl
  },
  {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
})

  sendResponse(res,200,"If an account exists, a password reset link has been sent.",null)

})





export const resetPasswordController =  asyncWrapper(async(req,res)=>{
 
  
  const {token,password} = req.body;

    // 1. Verify JWT
  let decoded;

  try {
    decoded = jwt.verify(
      token,
      config.RESET_PASSWORD_JWT_SECRET_KEY
    );
  } catch {
    throw new AppError("Invalid or expired reset token", 400);
  }

   // 2. Hash token → find Redis record
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const storedTokenHash = await redis.get(
  `password-reset:user:${decoded.id}`
);

   if (!storedTokenHash || storedTokenHash !== tokenHash) {
  throw new AppError("Invalid or expired reset token", 400);
}


  // 3. Find user
  const user = await userModel.findById(decoded.id);

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }


  // 5. Update password
  user.password = password;
  await user.save();

  // 6. Delete reset token → single-use
  await redis.del(`password-reset:user:${decoded.id}`);

  sendResponse(res,200,"Password reset successfully",null)

})






export const loginuserController = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel
    .findOne({
      email,
    }).select("+password");

  if (!user) {
    throw new AppError("user not found", 401);
  }

 
  const passwordCheck = await user.comparePassword(password);
  
  if (!passwordCheck) {
    throw new AppError("wrong password input", 401);
  }

  const isVerified = user.verified;
  if (!isVerified) {
    throw new AppError("user is not verified yet", 401);
  }


  const token = jwt.sign({ id: user._id }, config.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });

  res.cookie("token", token, cookieOptions);

  const newUserObj = user.toObject();
  delete newUserObj.password;
  delete newUserObj.__v;

  sendResponse(res, 200, "user loggedin successfully", newUserObj);
});




export const getMeController = asyncWrapper(async(req,res)=>{
  const user = req.user;
  sendResponse(res,200,"user get successfully",user);
})




export const logoutController =  asyncWrapper(async(req,res)=>{
  
  const token = req.cookies?.token;
  const userId = req.user._id

  const tokenHash = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");
   

  const decoded = jwt.verify(token, config.JWT_SECRET_KEY);
  const remainingTTL = decoded.exp - Math.floor(Date.now() / 1000);

  await redis.set( `blacklist:token:${tokenHash}`, "1" , "EX" ,  remainingTTL)
  
  /** delete user cache -  cache invalidation */
  await redis.del(`user:${userId}`)

  res.clearCookie("token", cookieOptions);
  sendResponse(res,200,"user logout successfully",null)
  
})

