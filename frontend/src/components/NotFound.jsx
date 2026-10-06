import styles from "./NotFound.module.scss";

export default function NotFound({ onReturnHome }) {
  const handleReturnHome = () => {
    if (onReturnHome) {
      onReturnHome();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className={styles.page} data-theme="dark">
      <div className={styles.content}>
        <div
          className={styles.logoWrap}
          style={{
            maskImage: "radial-gradient(black, transparent)",
          }}
        >
          <svg
            className={styles.logo}
            width="100%"
            height="auto"
            viewBox="0 0 57 73"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M28.6848 24.4603L47.3092 40.4828V64.1065L28.6848 48.0293M28.6848 24.4603L9.53595 39.7925L9.58917 63.669L28.6316 48.0293M28.6848 24.4603L2.4071 23.8588V47.5542L9.09109 47.6959M28.6848 24.4603L54.9884 24.7611V48.5761L47.6649 48.4467M28.6848 24.4603L10.3722 8.03792L10.2884 23.5988M28.6848 24.4603L47.7956 8.74877V24.4474M28.6848 24.4603L28.63 1.75943M28.6848 24.4603V48.1113M28.63 0.6481L28.6848 48.0839"
              stroke="currentColor"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.logoPath}
            />
          </svg>
        </div>

        <h1 className={styles.title}>Page not found</h1>

        <p className={styles.subtitle}>
          Error 404. Check the address and try again.
        </p>

        <button
          type="button"
          className={styles.button}
          onClick={handleReturnHome}
        >
          Return home
        </button>
      </div>
    </div>
  );
}