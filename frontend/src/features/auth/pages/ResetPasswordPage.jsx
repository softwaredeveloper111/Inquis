import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle, ArrowLeft } from "lucide-react";

import styles from "./ResetPasswordPage.module.scss";
import useAuth from "../hooks/useAuth";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { resetPasswordLoading,  resetPasswordHandler } = useAuth();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [tokenError, setTokenError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setPasswordError("");
    setConfirmPasswordError("");
    setTokenError("");

    if (!token) {
      setTokenError("This password reset link is invalid or expired.");
      return;
    }

    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    if (!passwordRegex.test(password)) {
      setPasswordError(
        "Password must be 8–72 characters with uppercase, lowercase, number and special character"
      );
      return;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    try {

     
      await resetPasswordHandler(
        token,
        password,
      );

      navigate("/login");
    } catch (error) {
      setTokenError(
        error?.message || "This password reset link is invalid or expired."
      );
    }
  };

  if (!token) {
    return (
      <div className={styles.page} data-theme="dark">
        <section className={styles.card}>
          <div className={styles.icon}>!</div>

          <div className={styles.header}>
            <h1>Invalid reset link</h1>
            <p>
              This password reset link is missing or invalid. Please request a
              new password reset link.
            </p>
          </div>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => navigate("/login")}
          >
            Back to login
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/login")}
        >
          <ArrowLeft size={17} />
          Back to login
        </button>

        <div className={styles.header}>
          <div className={styles.logo}>I</div>

          <h1>Reset your password</h1>

          <p>
            Create a new password for your Inquis account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="password">New password</label>

            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPasswordError("");
                  setTokenError("");
                }}
                placeholder="Enter your new password"
                autoComplete="new-password"
                autoFocus
                aria-invalid={Boolean(passwordError)}
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {passwordError && (
              <p className={styles.error}>{passwordError}</p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirm-password">Confirm password</label>

            <div className={styles.passwordWrapper}>
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setConfirmPasswordError("");
                  setTokenError("");
                }}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                aria-invalid={Boolean(confirmPasswordError)}
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() =>
                  setShowConfirmPassword((value) => !value)
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {confirmPasswordError && (
              <p className={styles.error}>{confirmPasswordError}</p>
            )}
          </div>

          {tokenError && (
            <p className={styles.tokenError}>{tokenError}</p>
          )}

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={resetPasswordLoading}
          >
            {resetPasswordLoading ? (
              <LoaderCircle
                size={18}
                strokeWidth={2.5}
                className={styles.loader}
                aria-label="Resetting password"
              />
            ) : (
              "Reset password"
            )}
          </button>
        </form>
      </section>
    </div>
  );
};

export default ResetPasswordPage;