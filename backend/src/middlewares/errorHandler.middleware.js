import {config} from "../config/config.js"

export const errorHandler = (err, req, res, next) => {

  const statusCode = err.statusCode || 500;
  const response  ={
    success:false,
    statusCode,
    message : err.message || "internal server error",
  };

   


  if (config.NODE_ENV === "development") {
    response.stack = err.stack;
    
    if(err?.details){
    response.details = err.details
   }

    if (err?.error) {
      response.error = err.error?.message || String(err.error);
    }
  }

  res.status(statusCode).json(response);

};