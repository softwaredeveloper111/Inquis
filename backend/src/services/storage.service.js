import { cloudinary } from "../config/cloudinary.js";

export function uploadBuffer(buffer, { resourceType, folder = "perplexity/files" }) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: resourceType }, (err, result) =>
        err ? reject(err) : resolve(result)
      )
      .end(buffer);
  });
}


export const deleteFromStorage = (publicId, resourceType) =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType });