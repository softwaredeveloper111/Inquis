import { useState , useEffect} from "react";
import styles from "./SignupCard.module.scss";
import perplexityLogo from "../../../assets/perplexity.webp";
import { Link, useNavigate , useSearchParams } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "../schemas/auth.schema";

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
        <path d="M9.88 4.24A9.76 9.76 0 0 1 12 4c5 0 8.73 4.11 9.8 7.1" />
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
  google_no_account: "No account found for this Google email. Please sign up first",
  google_denied: "Google sign-in was cancelled",
  google_unverified: "Your Google email is not verified",
  google_unavailable: "Google sign-in is not available right now",
  google_failed: "Google sign-in failed. Please try again",
};

const SignupCard = () => {
  const { isLoading, registerHandler } = useAuth();

  const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const err = searchParams.get("error");
    if (!err) return;
    toast.error(GOOGLE_ERRORS[err] || GOOGLE_ERRORS.google_failed, { id: "google-error" });
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data) => {
    const { username, email, password } = data;
    if (username && email && password) {
      const res = await registerHandler(username, email, password);
      if (res) {
        reset();
        setShowSuccessPopup(true);
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
            <img src={perplexityLogo} alt="Perplexity" />
          </div>

          <h1>Create your account</h1>

          <p>Start exploring Perplexity</p>
        </div>

        <button
          type="button"
          className={styles.googleButton}
         onClick={() => (window.location.href = authService.googleSignupUrl)}
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
            <label htmlFor="signup-username">Username</label>

            <input
              {...register("username")}
              id="signup-username"
              name="username"
              type="text"
              placeholder="Enter username"
              autoComplete="username"
            />

            {errors.username && (
              <span className={styles.error}>{errors.username.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-email">Email</label>

            <input
              {...register("email")}
              id="signup-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
            />
            {errors.email && (
              <span className={styles.error}>{errors.email.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-password">Password</label>

            <div className={styles.passwordWrapper}>
              <input
                {...register("password")}
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
                autoComplete="new-password"
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
              <span className={styles.error}>{errors.password.message}</span>
            )}
          </div>

          <p className={styles.verificationInfo}>
            A verification link will be sent to your email after signup.
          </p>

          <ul className={styles.passwordRules}>
            <li>At least 8 characters</li>
            <li>At least one uppercase letter</li>
            <li>At least 1 lowercase letter</li>
            <li>At least one digit</li>
            <li>At least one special character</li>
          </ul>

          <button type="submit" className={styles.submitButton}>
            Create account
          </button>
        </form>

        <div className={styles.loginPrompt}>
          <span>Already have an account?</span>

          <Link to="/login">Sign in</Link>
        </div>

        <div className={styles.legalLinks}>
          <Link to="/privacy">Privacy Policy</Link>
          <span className={styles.legalDot}>•</span>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </section>
      {isLoading && <SpinnerLoader fullscreen overlay />}
      {showSuccessPopup && (
        <div className={styles.popupOverlay}>
          <div
            className={styles.successPopup}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-success-title"
          >
            <p id="signup-success-title">
              Verification email sent to your email.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSuccessPopup(false);
                navigate("/login", { replace: true });
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SignupCard;
