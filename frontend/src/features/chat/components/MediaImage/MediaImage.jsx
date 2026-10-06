import { useState } from "react";
import styles from "./MediaImage.module.scss";

export function ImageSkeleton() {
  return (
    <span className={styles.box}>
      <span className={styles.shimmer} />
    </span>
  );
}

// Cloudinary URL mein fl_attachment lagao to browser seedha download karta hai
const downloadUrl = (src) => src.replace("/upload/", "/upload/fl_attachment/");

export function MediaImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

   if (failed) {
    return (
      <span className={styles.box}>
        <span className={styles.failed}>Image unavailable</span>
      </span>
    );
  }

  return (
    <span className={styles.box}>
      {!loaded && <span className={styles.shimmer} />}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
         onError={() => setFailed(true)}
        className={`${styles.img} ${loaded ? styles.loaded : ""}`}
      />
      {loaded && (
        <a className={styles.download} href={downloadUrl(src)} download title="Download">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
          </svg>
        </a>
      )}
    </span>
  );
}