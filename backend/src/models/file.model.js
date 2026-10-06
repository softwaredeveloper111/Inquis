import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
      index: true,
    },

    name: { type: String, required: true, trim: true },
    mime: { type: String, required: true },
    size: { type: Number, required: true },


    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "raw"], required: true },

    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },

    mode: { type: String, enum: ["image", "inline", "rag"], default: null },
    failReason: { type: String, default: null },


    extractedText: { type: String, select: false },
  },
  { timestamps: true }
);

export const fileModel = mongoose.model("File", fileSchema);