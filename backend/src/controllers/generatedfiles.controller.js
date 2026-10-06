import { asyncWrapper } from "../utils/asyncWrapper.util.js";
import { AppError } from "../utils/appError.util.js";
import { generatedFileModel } from "../models/generatedfile.model.js";

/** GET /api/generated-files/:token  (unguessable link, login cookie ki zarurat nahi) */
export const downloadGeneratedFile = asyncWrapper(async (req, res) => {
  const { token } = req.params;
  if (!/^[0-9a-f]{32}$/.test(token)) throw new AppError("file not found", 404);

  const file = await generatedFileModel.findOne({ token }).select("+data");
  if (!file) throw new AppError("file not found or expired", 404);

  res.attachment(file.name); // Content-Disposition: attachment => download
  res.type(file.mime);
  res.set("Cache-Control", "private, max-age=3600");
  res.send(file.data);
});