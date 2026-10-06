import {config} from "../config/config.js"

export const csrfProtection = (req, res, next) => {
  const origin = req.headers.origin;

  if (origin && origin !== config.FRONTEND_URL) {
    return res.status(403).json({
      success: false,
      statusCode:403,
      message: "Forbidden origin",
    });
  }

  next();
};