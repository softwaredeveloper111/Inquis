import { useState } from "react";
import styles from "./ResendVerificationModal.module.scss";
import { LoaderCircle } from "lucide-react";

import useAuth from "../hooks/useAuth";

const emailRegex =
  /^[a-z0-9]+(?:[._%+-][a-z0-9]+)*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

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

const ResendVerificationModal = ({ onClose }) => {
  const { resendVerificationLoading, resendVerificationHandler } = useAuth();

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
    await resendVerificationHandler(email);
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
        aria-labelledby="resend-title"
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
          <h2 id="resend-title">Resend verification email</h2>

          <p>Enter the email address you used to create your account.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="verification-email">Email</label>

            <input
              id="verification-email"
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

            {emailError && <p className={styles.error}>{emailError}</p>}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={resendVerificationLoading}
          >
            {resendVerificationLoading ? (
              <LoaderCircle
                size={18}
                strokeWidth={2.5}
                aria-label="Sending verification link"
                className={styles.loader}
              />
            ) : (
              "Send verification link"
            )}
          </button>
        </form>
      </section>
    </div>
  );
};

export default ResendVerificationModal;
