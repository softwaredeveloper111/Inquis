import { useEffect, useState } from "react";
import { ShieldAlert, X, ZoomIn } from "lucide-react";
import step1Img from "../../../assets/step1-advanced.PNG";
import step2Img from "../../../assets/step2-go-to-inquis.PNG";
import step3Img from "../../../assets/step3-permissions.PNG";
import styles from "./GoogleWarningCard.module.scss";

const STEPS = [
  {
    step: 1,
    title: "Click Advanced",
    text: 'On the "Google hasn\'t verified this app" screen, click Advanced at the bottom left.',
    image: step1Img,
    alt: 'Step 1: Click Advanced link at the bottom left on the Google verification screen',
  },
  {
    step: 2,
    title: "Go to Inquis",
    text: 'Click "Go to Inquis (unsafe)". This is our app; the warning appears only because verification is pending.',
    image: step2Img,
    alt: 'Step 2: Click Go to Inquis (unsafe) link to proceed',
  },
  {
    step: 3,
    title: "Allow access",
    text: "Tick the permission checkbox, then click Continue.",
    image: step3Img,
    alt: 'Step 3: Tick the permission checkbox and click Continue',
  },
];

export default function GoogleWarningCard() {
  const [activeStep, setActiveStep] = useState(null);

  useEffect(() => {
    if (!activeStep) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveStep(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStep]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setActiveStep(null);
    }
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerIconTile} aria-hidden="true">
            <ShieldAlert size={20} />
          </div>
          <div className={styles.headerText}>
            <h4 className={styles.title}>Seeing a Google warning? That's expected.</h4>
            <p className={styles.desc}>
              Inquis is currently going through Google's verification process, so Google shows an &ldquo;unverified app&rdquo; screen when you connect Gmail, Calendar or Drive. Your data is accessed only when you ask the assistant to do something, and you can disconnect anytime.
            </p>
          </div>
        </div>

        <div className={styles.stepsGrid}>
          {STEPS.map((s) => (
            <div key={s.step} className={styles.stepItem}>
              <div className={styles.stepHeader}>
                <span className={styles.stepBadge}>{s.step}</span>
                <h5 className={styles.stepTitle}>{s.title}</h5>
              </div>
              <p className={styles.stepText}>{s.text}</p>
              <button
                type="button"
                className={styles.imageTrigger}
                onClick={() => setActiveStep(s)}
                aria-label={`View full-size image for Step ${s.step}: ${s.title}`}
              >
                <div className={styles.imageWrapper}>
                  <img
                    src={s.image}
                    alt={s.alt}
                    width={400}
                    height={300}
                    loading="lazy"
                    className={styles.image}
                  />
                  <div className={styles.imageOverlay} aria-hidden="true">
                    <ZoomIn size={18} />
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        <p className={styles.footerNote}>
          You can remove access anytime from the Connectors page or Google Account &gt; Security &gt; Third-party access.
        </p>
      </div>

      {activeStep && (
        <div
          className={styles.lightboxBackdrop}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label={`Full-size preview: Step ${activeStep.step} - ${activeStep.title}`}
        >
          <div className={styles.lightboxContent}>
            <div className={styles.lightboxHeader}>
              <span className={styles.lightboxTitle}>
                Step {activeStep.step}: {activeStep.title}
              </span>
              <button
                type="button"
                className={styles.lightboxClose}
                onClick={() => setActiveStep(null)}
                aria-label="Close image preview"
                autoFocus
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.lightboxImageContainer}>
              <img
                src={activeStep.image}
                alt={activeStep.alt}
                className={styles.lightboxImage}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
