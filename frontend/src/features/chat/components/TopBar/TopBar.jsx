import { Link } from "react-router-dom";
import Icons from "../Icons";
import IncognitoToggle from "../IncognitoToggle/IncognitoToggle";
import styles from "./TopBar.module.scss";

export default function TopBar({ onMenu, onUpgrade, incognito, onIncognito }) {
  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenu} aria-label="Open menu"><Icons.Menu /></button>
        <button className={styles.pill} onClick={onUpgrade}>
          Free plan <span className={styles.dot}>·</span> <span className={styles.upgrade}>Upgrade</span>
        </button>
      </div>
      <div className={styles.right}>
        <div className={styles.legalLinks}>
          <Link to="/privacy">Privacy Policy</Link>
          <span className={styles.legalDot}>•</span>
          <Link to="/terms">Terms of Service</Link>
        </div>
        <IncognitoToggle active={incognito} onToggle={onIncognito} />
      </div>
    </header>
  );
}
