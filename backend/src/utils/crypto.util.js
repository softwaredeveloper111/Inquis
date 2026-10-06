import crypto from "crypto";
import {config} from "../config/config.js"


// AES-256-GCM. Key: CONNECTOR_ENCRYPTION_KEY (64 hex chars = 32 bytes)
const getKey = () => {
  const hex = config.CONNECTOR_ENCRYPTION_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("CONNECTOR_ENCRYPTION_KEY must be 64 hex characters");
  }
  return Buffer.from(hex, "hex");
};

export const encrypt = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64")).join(".");
};

export const decrypt = (payload) => {
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
};