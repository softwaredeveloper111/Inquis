import { asyncWrapper } from "../utils/asyncWrapper.util.js";
import { confirmAction, cancelAction } from "../services/actions.service.js";

const ID = /^[0-9a-f]{32}$/;
const okId = (id) => (ID.test(id) ? id : "invalid");

/** POST /api/connectors/actions/:id/confirm */
export const confirm = asyncWrapper(async (req, res) => {
  const summary = await confirmAction(req.user._id, okId(req.params.id));
  res.status(200).json({ success: true, data: { summary } });
});

/** POST /api/connectors/actions/:id/cancel */
export const cancel = asyncWrapper(async (req, res) => {
  await cancelAction(req.user._id, okId(req.params.id));
  res.status(200).json({ success: true });
});