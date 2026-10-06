import {v2 as cloudinary} from "cloudinary";
import {config} from "./config.js"

cloudinary.config({
  secure: true,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
});


export { cloudinary };