import { useEffect, useState } from "react";
import styles from "./RenameModal.module.scss";

// 2-4 words, sirf letters (emoji / number / special char nahi)
const validate = (text) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return "Title must be 2 to 4 words.";
  if (!words.every((w) => /^[\p{L}\p{M}]+$/u.test(w)))
    return "Only letters allowed. No numbers, emoji or special characters.";
  return "";
};

export default function RenameModal({ title, onSave, onClose }) {
  const [value, setValue] = useState(title);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const err = validate(value);
    if (err) return setError(err);

    const clean = value.trim().split(/\s+/).join(" ");
    if (clean === title) return onClose();

    setSaving(true);
    await onSave(clean); // success par parent modal band karega
    setSaving(false);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">×</button>
        <h3>Rename chat</h3>
        <p>Keep it short and recognizable</p>

        <input
          autoFocus
          value={value}
          onFocus={(e) => e.target.select()}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
        />
        {error && <span className={styles.error}>{error}</span>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.save} disabled={saving}>Save</button>
        </div>
      </form>
    </div>
  );
}