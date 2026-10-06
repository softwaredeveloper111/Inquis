import {validationResult} from "express-validator"

export const validationErrorHandler = function (req,res,next) {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
     const error = new Error("validation failed");
     error.statusCode = 400;
     error.details = errors.array()
     return next(error)
  }
  next()
}