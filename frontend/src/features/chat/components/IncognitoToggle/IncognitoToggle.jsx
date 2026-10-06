import Icons from "../Icons";
import styles from "./IncognitoToggle.module.scss";

export default function IncognitoToggle({ active, onToggle }) {
  return (
    <button className={`${styles.btn} ${active ? styles.active : ""}`} onClick={onToggle}
      aria-pressed={active} title={active ? "Incognito on" : "Incognito"}>
      <Icons.Incognito size={20} />
    </button>
  );
}
