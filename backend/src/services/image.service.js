import {cloudinary} from "../config/cloudinary.js";
import {config} from "../config/config.js";
import {logger} from "../lib/logger.js";




const CF_URL = `https://api.cloudflare.com/client/v4/accounts/${config.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`;


export async function generateImage({ prompt }) {
  try {
    const res = await fetch(CF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Cloudflare status ${res.status}`);

    const { result } = await res.json(); // result.image = base64 jpeg
    const upload = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${result.image}`,
      { folder: "perplexity/images" }
    );

    return `Image created. Show it to the user using exactly this markdown: ![generated image](${upload.secure_url})`;
  } catch (error) {
    logger.error({ error: error.message }, "image generation failed");
    return `Image generation failed (${error.message}). Tell the user to try again later.`;
  }
}