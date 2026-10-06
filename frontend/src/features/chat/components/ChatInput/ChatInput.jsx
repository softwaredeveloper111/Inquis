import { useState, useRef } from "react";
import Icons from "../Icons";
import styles from "./ChatInput.module.scss";
import { useFileAttachment } from "../../hooks/useFileAttachment";

const ACCEPT = "image/png,image/jpeg,image/webp,application/pdf,text/plain";

const STATUS_LABEL = {
  uploading: "Uploading…",
  processing: "Processing…",
  ready: "",
};

export default function ChatInput({ onSend, placeholder, autoFocus }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  const { files, attach, remove, clear, fileIds,  attachments, blocked, full } = useFileAttachment();

 const canSend = (value.trim().length > 0 || fileIds.length > 0) && !blocked;

  const resize = (el) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const submit = (el) => {
    if (!canSend) return;
    onSend(value.trim(), fileIds, attachments); // fileIds ko Step 2 mein backend se jodenge
    setValue("");
    clear()
    if (el) el.style.height = "auto";
  };

  const onPick = (e) => {
  const list = Array.from(e.target.files || []);
  e.target.value = "";
  if (list.length) attach(list);
};


  return (
    <div className={styles.box}>
      {files.length > 0 && (
  <div className={styles.chips}>
    {files.map((file) => (
      <div
        key={file.key}
        className={`${styles.chip} ${file.status === "failed" ? styles.chipFailed : ""}`}
      >
        <span className={styles.chipName}>{file.name}</span>
        <span className={styles.chipStatus}>
          {file.status === "failed" ? file.failReason || "Failed" : STATUS_LABEL[file.status]}
        </span>
        <button type="button" className={styles.chipRemove} aria-label="Remove file" onClick={() => remove(file.key)}>
          ×
        </button>
      </div>
    ))}
  </div>
)}
      <textarea
        rows={1}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => { setValue(e.target.value); resize(e.target); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit(e.target);
          }
        }}
      />
      <div className={styles.toolbar}>
       <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={onPick} />
        <button type="button" className={styles.plus} aria-label="Attach" disabled={full} onClick={() => inputRef.current?.click()}>
          <Icons.Plus size={20} />
        </button>
        <div className={styles.grow} />
        <button className={styles.send} disabled={!canSend} aria-label="Send" onClick={() => submit()}>
          <Icons.Send size={18} />
        </button>
      </div>
    </div>
  );
}