import LegalPage from "./Legalpage";
import { APP_NAME, CONTACT_EMAIL, UPDATED } from "../config/legal.config";
import {Link} from "react-router-dom"

const GOOGLE_POLICY_URL = "https://developers.google.com/terms/api-services-user-data-policy";

const sections = [
  {
    h: "1. Overview",
    p: [`${APP_NAME} is an AI assistant that answers questions, creates files and, if you choose, works with your Google account. This policy explains what data we handle and why.`],
  },
  {
    h: "2. Information we collect",
    list: [
      "Account details: your email address and username (or the name and email from Google if you sign in with Google).",
      "Content you provide: chat messages, files you upload, and files the assistant generates for you.",
      "Technical data: basic server logs (for example errors and request timing) used to keep the service running.",
    ],
  },
  {
    h: "3. Google user data (connectors)",
    p: ["If you connect Gmail, Google Calendar or Google Drive, we request only the permissions needed for these features:"],
    list: [
      "Gmail (gmail.modify): search and read your emails, and send an email only after you confirm it.",
      "Google Calendar (calendar.events): view your events, and create, change or delete events only after you confirm.",
      "Google Drive (drive): search and read your files, and create folders/files, rename, move or trash items only after you confirm.",
    ],
  },
  {
    h: "4. How we use Google user data",
    list: [
      "Google data is accessed only when you ask the assistant to do something with it, and only to fulfil that request.",
      "We do not store the contents of your emails, events or files. We store only your connected Google email address and an encrypted refresh token so the connection keeps working.",
      "To produce an answer, the relevant content is sent to our AI model providers solely to generate your response. It is not used to train or improve AI models.",
      "We do not sell Google data, use it for advertising, or allow humans to read it, except with your consent, for security purposes, or to comply with law.",
      <>
        {APP_NAME}'s use and transfer of information received from Google APIs adheres to the{" "}
        <Link to={GOOGLE_POLICY_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
          Google API Services User Data Policy
        </Link>
        , including the Limited Use requirements.
      </>,
    ],
  },
  {
    h: "5. Sharing",
    p: ["We share data only with the services needed to run the app:"],
    list: [
      "Hosting and databases (Render, Vercel, MongoDB Atlas, Redis).",
      "Email delivery (Resend) for verification and password-reset emails.",
      "AI model providers (Google Gemini,OpenRouter,Groq,cohere,mistral) to generate answers to your messages.",
      "Image and file storage (Cloudinary) for images and uploads.",
    ],
  },
  {
    h: "6. Security",
    p: ["Connections use HTTPS. Google refresh tokens are encrypted before they are stored. No system is perfectly secure, but we take reasonable steps to protect your data."],
  },
  {
    h: "7. Your choices and deletion",
    list: [
      "Disconnect any Google app at any time on the Connectors page. This deletes our stored token and revokes access when your last Google app is disconnected.",
      "You can also remove access from your Google Account settings under Security > Third-party access.",
      "You can delete your chats inside the app. To delete your account and data, email us.",
    ],
  },
  { h: "8. Cookies", p: ["We use a secure, HTTP-only cookie to keep you signed in. We do not use advertising cookies."] },
  { h: "9. Children", p: [`${APP_NAME} is not intended for children under 13.`] },
  { h: "10. Changes", p: ["We may update this policy and will change the date above when we do."] },
  { h: "11. Contact", p: [`Questions or deletion requests: ${CONTACT_EMAIL}`] },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" updated={UPDATED} sections={sections} />;
}