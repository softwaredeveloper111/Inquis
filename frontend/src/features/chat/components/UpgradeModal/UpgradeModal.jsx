import { useEffect } from "react";
import styles from "./UpgradeModal.module.scss";

export default function UpgradeModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Upcoming feature</h2>
        <p className={styles.text}>Plans and upgrades are coming soon. Stay tuned!</p>
        <button className={styles.ok} onClick={onClose} autoFocus>OK</button>
      </div>
    </div>
  );
}
