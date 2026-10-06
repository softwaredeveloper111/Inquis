import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config/config.js";
import { logger } from "../lib/logger.js";
import { userModel } from "../models/auth.model.js";
import { asyncWrapper } from "../utils/asyncWrapper.util.js";

const trim = (u) => u.replace(/\/+$/, "");
const FRONTEND = trim(config.FRONTEND_URL);
const REDIRECT_URI = `${trim(config.BACKEND_URL)}/api/auth/google/callback`;
const STATE_COOKIE = "g_oauth_state";

// login cookie: auth.controller.js ke cookieOptions jaisa hi (logout ise clear kar sakta hai)
const authCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: config.NODE_ENV === "development" ? "strict" : "none",
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
};

// state cookie "lax" hona zaroori hai, kyunki Google se wapas aate waqt cross-site navigation hota hai
const stateCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 10 * 60 * 1000,
  path: "/api/auth/google",
};
const { maxAge: _ignored, ...clearStateOptions } = stateCookieOptions;

const getClient = () =>
  new OAuth2Client(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, REDIRECT_URI);

const failRedirect = (res, code = "google_failed") => {
  res.clearCookie(STATE_COOKIE, clearStateOptions);
  return res.redirect(`${FRONTEND}/login?error=${code}`);
};

const randomPassword = () => "Aa1@" + crypto.randomBytes(16).toString("hex"); // model ke regex se match

function baseUsername(profile) {
  const raw = (profile.name || profile.email.split("@")[0]).toLowerCase();
  let base = raw.replace(/[^a-z0-9_]/g, "").slice(0, 24);
  if (base.length < 3) base = (base + "user").slice(0, 24);
  return base;
}

async function findOrCreateUser(profile , allowCreate) {
  const email = profile.email.toLowerCase();

  const existing = await userModel.findOne({ email });
  if (existing) {
    if (!existing.verified) {
      // Google ne email verify kiya hai. Pehle kisi ne is email se password set karke
      // register kiya ho sakta hai, isliye password reset karte hain (account hijack se bachav)
      existing.password = randomPassword();
      existing.verified = true;
      await existing.save();
    }

    return existing;

  }
  
  if (!allowCreate) return null;

  const base = baseUsername(profile);
  for (let i = 0; i < 5; i++) {
    const username = i === 0 ? base : `${base}_${crypto.randomBytes(2).toString("hex")}`;
    try {
      return await userModel.create({
        username,
        email,
        password: randomPassword(),
        verified: true,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      // email race (dusri request ne bana diya) ya username taken
      const again = await userModel.findOne({ email });
      if (again) return again;
    }
  }
  throw new Error("could not create user");
}

/** GET /api/auth/google  -> Google consent page par bhejta hai */
export const startGoogleAuth = asyncWrapper(async (req, res) => {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
    logger.error("Google login hit but GOOGLE_CLIENT_ID/SECRET not set");
    return res.redirect(`${FRONTEND}/login?error=google_unavailable`);
  }
  

  const mode = req.query.mode === "signup" ? "signup" : "login";
    const state = `${mode}:${crypto.randomBytes(24).toString("hex")}`;

  res.cookie(STATE_COOKIE, state, stateCookieOptions);

  const url = getClient().generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });
  res.redirect(url);
});

/** GET /api/auth/google/callback  -> code exchange, user find/create, cookie set, frontend par redirect */
export const googleCallback = asyncWrapper(async (req, res) => {
  const { code, state, error } = req.query;
  const savedState = req.cookies?.[STATE_COOKIE];

  if (error) return failRedirect(res, "google_denied");
  if (typeof code !== "string" || typeof state !== "string" || !savedState || state !== savedState) {
    return failRedirect(res);
  }

  try {
    
    const mode = savedState.split(":")[0];
    const client = getClient();
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.GOOGLE_CLIENT_ID,
    });
    const profile = ticket.getPayload();

    if (!profile?.email || !profile.email_verified) return failRedirect(res, "google_unverified");

     const user = await findOrCreateUser(profile, mode === "signup");
    if (!user) {
      res.clearCookie(STATE_COOKIE, clearStateOptions);
      return res.redirect(`${FRONTEND}/signup?error=google_no_account`);
    }

    const token = jwt.sign({ id: user._id }, config.JWT_SECRET_KEY, { expiresIn: "1d" });
    res.clearCookie(STATE_COOKIE, clearStateOptions);
    res.cookie("token", token, authCookieOptions);
    return res.redirect(`${FRONTEND}/`);
  } catch (err) {
    logger.error({ error: err?.message }, "google auth failed");
    return failRedirect(res);
  }
});