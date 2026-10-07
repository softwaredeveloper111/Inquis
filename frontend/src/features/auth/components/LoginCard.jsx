import { useState, useEffect } from "react";

import ResendVerificationModal from "./ResendVerificationModal";
import ResetPasswordModal from "./ResetPasswordModal";

import styles from "./LoginCard.module.scss";

import inquisLogo from "../../../assets/Inquis.png";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../schemas/auth.schema";

import { toast } from "sonner";

import SpinnerLoader from "../../../components/SpinnerLoader";
import useAuth from "../hooks/useAuth";

import authService from "../services/auth.api";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M21.35 12.23c0-.7-.06-1.37-.18-2.02H12v3.83h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.2Z"
    />
    <path
      fill="#34A853"
      d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z"
    />
    <path
      fill="#FBBC05"
      d="M6.54 13.83A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.83V7.64H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.36l3.24-2.53Z"
    />
    <path
      fill="#EA4335"
      d="M12 6.14c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.16 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.39l3.24 2.53C7.31 7.86 9.46 6.14 12 6.14Z"
    />
  </svg>
);

const EyeIcon = ({ hidden }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {hidden ? (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
        <path d="M9.88 4.24A9.76 9.76 0 0 1 12 4c5 0 8.73 4.11 9.8 7.1a1.9 1.9 0 0 1 0 .8 12.2 12.2 0 0 1-2.18 3.48" />
        <path d="M6.61 6.61C4.6 8.05 3.25 10.05 2.2 11.1a1.9 1.9 0 0 0 0 .8C3.27 14.89 7 19 12 19c1.61 0 3.08-.42 4.39-1.11" />
      </>
    ) : (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

const GOOGLE_ERRORS = {
  google_denied: "Google sign-in was cancelled",
  google_unverified: "Your Google email is not verified",
  google_unavailable: "Google sign-in is not available right now",
  google_failed: "Google sign-in failed. Please try again",
};

const LoginCard = () => {
  const { isLoading, loginUserHandler } = useAuth();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const err = searchParams.get("error");
    if (!err) return;
    toast.error(GOOGLE_ERRORS[err] || GOOGLE_ERRORS.google_failed, {
      id: "google-error",
    });
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);

  const [showResetPasswordModal, setshowResetPasswordModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    const { email, password } = data;

    if (email && password) {
      const res = await loginUserHandler(email, password);

      if (res) {
        reset();
        navigate("/", { replace: true });
      }
    }
  };

  const onError = (errors) => {
    const firstError = Object.values(errors)[0];

    if (firstError?.message) {
      toast.error(firstError.message);
    }
  };

  return (
    <>
      <section className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <img src={inquisLogo} alt="Inquis" />
          </div>

          <h1>Welcome back</h1>

          <p>Sign in to continue to Inquis</p>
        </div>

        <button
          type="button"
          className={styles.googleButton}
          onClick={() => (window.location.href = authService.googleLoginUrl)}
        >
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className={styles.form}
        >
          <div className={styles.field}>
            <label htmlFor="login-email">Email</label>

            <input
              {...register("email")}
              id="login-email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
            />

            {errors.email && (
              <span className={styles.errors}>{errors.email.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password">Password</label>

            <div className={styles.passwordWrapper}>
              <input
                {...register("password")}
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
            {errors.password && (
              <span className={styles.errors}>{errors.password.message}</span>
            )}
          </div>

          <div className={styles.forgotPassword}>
            <button
              type="button"
              onClick={() => setshowResetPasswordModal(true)}
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className={styles.submitButton}>
            Sign in
          </button>
        </form>

        <div className={styles.verification}>
          <span>Didn't receive verification email?</span>

          <button type="button" onClick={() => setShowResendModal(true)}>
            Resend verification email
          </button>
        </div>

        <div className={styles.signupPrompt}>
          <span>Don't have an account?</span>
          <Link to="/signup">Sign up</Link>
        </div>

        <div className={styles.legalLinks}>
          <Link to="/privacy">Privacy Policy</Link>
          <span className={styles.legalDot}>•</span>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </section>

      {showResendModal && (
        <ResendVerificationModal onClose={() => setShowResendModal(false)} />
      )}

      {showResetPasswordModal && (
        <ResetPasswordModal onClose={() => setshowResetPasswordModal(false)} />
      )}

      {isLoading && <SpinnerLoader fullscreen overlay />}
    </>
  );
};

export default LoginCard;
