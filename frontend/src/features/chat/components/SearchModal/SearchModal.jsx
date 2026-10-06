import { useEffect, useState } from "react";
import Icons from "../Icons";
import styles from "./SearchModal.module.scss";

export default function SearchModal({ chats, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const results = chats.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputRow}>
          <Icons.Search size={18} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a command or search" />
        </div>
        <div className={styles.results}>
          <div className={styles.label}>Results</div>
          {results.map((c) => (
            <button key={c.id} className={styles.row} onClick={() => onSelect(c.id)}>
              <span className={styles.title}>{c.title}</span>
              <span className={styles.tag}>Search</span>
            </button>
          ))}
          {results.length === 0 && <div className={styles.empty}>No results</div>}
        </div>
      </div>
    </div>
  );
}
