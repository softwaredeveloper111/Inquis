import mongoose from "mongoose";
import { SERVICE_KEYS } from "../constants/connectors.constants.js";

// Alag collection: User model ko bilkul touch nahi kiya
const connectorAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    service: { type: String, enum: SERVICE_KEYS, required: true },
    googleEmail: { type: String, lowercase: true, trim: true },
    scopes: [String],
    // encrypted, by default query mein nahi aata
    refreshTokenEnc: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

connectorAccountSchema.index({ userId: 1, service: 1 }, { unique: true });

export const connectorAccountModel =
  mongoose.models.ConnectorAccount || mongoose.model("ConnectorAccount", connectorAccountSchema);