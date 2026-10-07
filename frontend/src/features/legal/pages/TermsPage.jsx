import LegalPage from "./Legalpage";
import { APP_NAME, CONTACT_EMAIL, UPDATED } from "../config/legal.config";

const sections = [
  { h: "1. Acceptance", p: [`By using ${APP_NAME} you agree to these terms. If you do not agree, please do not use the service.`] },
  { h: "2. The service", p: ["The service provides AI-generated answers, file generation and optional Google integrations (Gmail, Calendar, Drive). Features may change or be unavailable at times."] },
  { h: "3. Your account", p: ["You are responsible for your account and for keeping your login details safe. Provide accurate information and do not share your account."] },
  { h: "4. AI output", p: ["AI answers can be wrong or incomplete. Check important information before relying on it. Do not use the service as a substitute for professional advice."] },
  {
    h: "5. Google integrations and your actions",
    list: [
      "You choose which Google apps to connect and can disconnect them at any time.",
      "Actions that change your data (sending an email, changing events, creating, moving or trashing files) run only after you press Confirm. You are responsible for what you confirm.",
      "Your use of Google services is also subject to Google's own terms.",
    ],
  },
  {
    h: "6. Acceptable use",
    list: [
      "Do not use the service for anything illegal, harmful, abusive or fraudulent.",
      "Do not send spam or unsolicited bulk messages using the Gmail connector.",
      "Do not attempt to disrupt, reverse engineer or gain unauthorised access to the service.",
    ],
  },
  { h: "7. Your content", p: ["You keep ownership of the content you provide. You allow us to process it only as needed to run the service for you."] },
  { h: "8. Disclaimer", p: ["The service is provided as is, without warranties of any kind. We do not guarantee that it will be uninterrupted or error-free."] },
  { h: "9. Limitation of liability", p: ["To the extent permitted by law, we are not liable for indirect or consequential losses arising from your use of the service."] },
  { h: "10. Termination", p: ["You can stop using the service at any time. We may suspend accounts that break these terms."] },
  { h: "11. Changes", p: ["We may update these terms and will change the date above when we do. Continued use means you accept the changes."] },
  { h: "12. Contact", p: [`Questions: ${CONTACT_EMAIL}`] },
];

export default function TermsPage() {
  return <LegalPage title="Terms of Service" updated={UPDATED} sections={sections} />;
}