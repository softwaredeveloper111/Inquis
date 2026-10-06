import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import { AppError } from "../utils/appError.util.js";
import { asyncWrapper } from "../utils/asyncWrapper.util.js";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; 

// mime -> Cloudinary resource_type
export const ALLOWED_TYPES = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "application/pdf": "raw",
  "text/plain": "raw",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
      return cb(new AppError("Only PNG, JPG, WEBP, PDF and TXT files are allowed", 400));
    }
    cb(null, true);
  },
}).single("file"); // form-data key = "file"

// multer ke errors ko AppError mein badalta hai (errorHandler ko chhedna nahi padega)
export const uploadSingleFile = (req, res, next) => {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const msg =
  err.code === "LIMIT_FILE_SIZE"
    ? `File is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`
    : err.code === "LIMIT_UNEXPECTED_FILE"
    ? "Only one file can be uploaded at a time"
    : "Invalid upload";
      return next(new AppError(msg, 400));
    }
    next(err);
  });
};


// declared mime sach hai ya nahi, asli bytes se check
export const validateFileContent = asyncWrapper(async (req, res, next) => {
  const file = req.file;
  if (!file) throw new AppError("file is required", 400);
  if (file.size === 0) throw new AppError("file is empty", 400);

  const declared = file.mimetype;
  const detected = await fileTypeFromBuffer(file.buffer);

  const ok =
    declared === "text/plain"
      ? !detected && !file.buffer.subarray(0, 8000).includes(0) // text mein null byte nahi hota
      : detected?.mime === declared;

  if (!ok) throw new AppError("File content does not match its type", 400);

  req.fileInfo = { mime: declared, resourceType: ALLOWED_TYPES[declared] };
  next();
});