import { useState } from "react";
import styles from "./ResetPasswordModal.module.scss";
import { LoaderCircle } from "lucide-react";
import useAuth from "../hooks/useAuth";

const emailRegex =
  /^[a-z0-9]+(?:[._%+-][a-z0-9]+)*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/;

const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const ResetPasswordModal = ({ onClose }) => {
  const { forgotPasswordLoading, forgotPasswordHandler } = useAuth();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Email is required");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Enter a valid lowercase email address");
      return;
    }

    setEmailError("");
    console.log(email)
    await forgotPasswordHandler(trimmedEmail);

    setEmail("");
    onClose();
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <section
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-title"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        <div className={styles.header}>
          <h2 id="reset-password-title">Reset your password</h2>

          <p>
            Enter the email address associated with your account and we'll send
            you a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="reset-password-email">Email</label>

            <input
              id="reset-password-email"
              required
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError("");
              }}
              placeholder="Enter your registered email"
              autoComplete="email"
              autoFocus
              aria-invalid={Boolean(emailError)}
            />

            {emailError && (
              <p className={styles.error}>{emailError}</p>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={forgotPasswordLoading}
          >
            {forgotPasswordLoading ? (
              <LoaderCircle
                size={18}
                strokeWidth={2.5}
                aria-label="Sending password reset link"
                className={styles.loader}
              />
            ) : (
              "Send reset link"
            )}
          </button>

        
        </form>
      </section>
    </div>
  );
};

export default ResetPasswordModal;