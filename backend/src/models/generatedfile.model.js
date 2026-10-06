import mongoose from "mongoose";

// Generated txt/pdf files. Alag collection, existing file.model ko touch nahi karta
const generatedFileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  token: { type: String, required: true, unique: true }, // unguessable download id
  name: { type: String, required: true },
  mime: { type: String, required: true },
  size: { type: Number, required: true },
  data: { type: Buffer, required: true, select: false },
  createdAt: { type: Date, default: Date.now }, // 30 din baad auto-delete (TTL)
});

export const generatedFileModel =
  mongoose.models.GeneratedFile || mongoose.model("GeneratedFile", generatedFileSchema);