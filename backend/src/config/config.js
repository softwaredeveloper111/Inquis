import 'dotenv/config';


if(!process.env.NODE_ENV){
  throw new Error("NODE_ENV is not defined in enviroment variables");
  
}


if(!process.env.BACKEND_URL){
  throw new Error("BACKEND_URL is not defined in enviroment variables")
}


if(!process.env.FRONTEND_URL){
  throw new Error("FRONTEND_URL is not defined in enviroment variables")
}



if(!process.env.PORT){
  throw new Error("PORT is not defined in enviroment variables");
}


if(!process.env.LOG_LEVEL){
  throw new Error("LOG_LEVEL is not defined in enviroment variables")
}


if(!process.env.MONGO_URI){
  throw new Error("MONGO_URI is not defined in enviroment variables");
  
}


if(!process.env.BCRYPT_GEN_SALT){
  throw new Error("BCRYPT_GEN_SALT is not defined in enviroment variables");
}



if(!process.env.JWT_SECRET_KEY){
  throw new Error('JWT_SECRET_KEY is not defined in enviroment variables');
}



if(!process.env.EMAIL_VERIFICATION_JWT_SECRET_KEY){
  throw new Error("EMAIL_VERIFICATION_JWT_SECRET_KEY is not defined in enviroment variables")
}


if(!process.env.RESET_PASSWORD_JWT_SECRET_KEY){
  throw new Error("RESET_PASSWORD_JWT_SECRET_KEY is not defined in enviroment variables")
}



if(!process.env.REDIS_PORT){
  throw new Error("REDIS_PORT is not defined in enviroment variables")
}

if(!process.env.REDIS_HOST){
  throw new Error("REDIS_HOST is not defined in enviroment variables")
}


if(!process.env.REDIS_PASSWORD){
  throw new Error('REDIS_PASSWORD is not defined in enviroment variables')
}




if(!process.env.RESEND_API_KEY){
  throw new Error("RESEND_API_KEY is not defined in enviroment variables")
}




if(!process.env.GEMINI_API_KEY){
  throw new Error("GEMINI_API_KEY is not defined in enviroment variables")
}




if(!process.env.MISTRAL_API_KEY){
  throw new Error("MISTRAL_API_KEY is not defined in enviroment varialbles");
  
}


if(!process.env.GROQ_API_KEY){
  throw new Error("GROQ_API_KEY is not defined in enviroment variables");
  
}


if(!process.env.OPENROUTER_API_KEY){
  throw new Error("OPENROUTER_API_KEY is not defined in enviroment variables")
}


if(!process.env.COHERE_API_KEY){
  throw new Error("COHERE_API_KEY is not defined in enviroment variables")
}


if(!process.env.TVLY_API_KEY){
  throw new Error('TVLY_API_KEY is not defined in enviroment variables')
}


if(!process.env.CLOUDINARY_API_KEY){
   throw new Error('CLOUDINARY_API_KEY is not defined in enviroment variables')
}


if(!process.env.CLOUDINARY_CLOUD_NAME){
  throw new Error('CLOUDINARY_CLOUD_NAME is not defined in enviroment variables')
}

if(!process.env.CLOUDINARY_API_SECRET){
  throw new Error('CLOUDINARY_API_SECRET is not defined in enviroment variables')
}


if(!process.env.CLOUDFLARE_ACCOUNT_ID){
  throw new Error('CLOUDFLARE_ACCOUNT_ID is not defined in enviroment variables')
}


if(!process.env.CLOUDFLARE_API_TOKEN){
  throw new Error('CLOUDFLARE_API_TOKEN is not defined in enviroment variables')
}


if(!process.env.GOOGLE_CLIENT_ID){
  throw new Error("GOOGLE_CLIENT_ID is not defined in enviroment variables")
}


if(!process.env.GOOGLE_CLIENT_SECRET){
  throw new Error("GOOGLE_CLIENT_SECRET is not defined in enviroment variables")
}


if(!process.env.CONNECTOR_ENCRYPTION_KEY){
  throw new Error("CONNECTOR_ENCRYPTION_KEY is not defined in enviroment variables")
}



export const config = {
   NODE_ENV:process.env.NODE_ENV,
   BACKEND_URL:process.env.BACKEND_URL,
   FRONTEND_URL:process.env.FRONTEND_URL,

   PORT:Number(process.env.PORT),

   LOG_LEVEL:process.env.LOG_LEVEL,

   MONGO_URI:process.env.MONGO_URI,

   BCRYPT_GEN_SALT:Number(process.env.BCRYPT_GEN_SALT),
   

   JWT_SECRET_KEY:process.env.JWT_SECRET_KEY,
   EMAIL_VERIFICATION_JWT_SECRET_KEY:process.env.EMAIL_VERIFICATION_JWT_SECRET_KEY,
   RESET_PASSWORD_JWT_SECRET_KEY:process.env.RESET_PASSWORD_JWT_SECRET_KEY,

   REDIS_PORT:process.env.REDIS_PORT,
   REDIS_HOST:process.env.REDIS_HOST,
   REDIS_PASSWORD:process.env.REDIS_PASSWORD,
   
   RESEND_API_KEY:process.env.RESEND_API_KEY,

   GEMINI_API_KEY:process.env.GEMINI_API_KEY,

   MISTRAL_API_KEY:process.env.MISTRAL_API_KEY,

   GROQ_API_KEY:process.env.GROQ_API_KEY,

   OPENROUTER_API_KEY:process.env.OPENROUTER_API_KEY ,
   
   COHERE_API_KEY:process.env.COHERE_API_KEY,

   TVLY_API_KEY:process.env.TVLY_API_KEY,

   CLOUDINARY_API_KEY:process.env.CLOUDINARY_API_KEY,
   CLOUDINARY_CLOUD_NAME:process.env.CLOUDINARY_CLOUD_NAME,
   CLOUDINARY_API_SECRET:process.env.CLOUDINARY_API_SECRET,


   CLOUDFLARE_ACCOUNT_ID:process.env.CLOUDFLARE_ACCOUNT_ID,
   CLOUDFLARE_API_TOKEN:process.env.CLOUDFLARE_API_TOKEN,

   GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID,
   GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET,


   CONNECTOR_ENCRYPTION_KEY:process.env.CONNECTOR_ENCRYPTION_KEY,

}