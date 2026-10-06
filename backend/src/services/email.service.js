import {Resend} from "resend"
import { config } from "../config/config.js";
import { logger } from "../lib/logger.js";

const resend = new Resend(config.RESEND_API_KEY);

const sendEmail = async (to, subject, text, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Perplexity <perplexity@perplexity.techy.fun>",
      to: [to],
      subject,
      text,
      html,
    });

    if (error) {
      logger.error({error}, "Error sending email❌:" );
      return null;
    }

    logger.info("Email sent successfully✅:", data.id);

    return data;
  } catch (error) {
    logger.error({error},"Error sending email❌:");
    return null;
  }
};

export   { sendEmail };


