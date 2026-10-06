import { memo, useState } from "react";
import Icons from "../Icons";
import SkeletonLoader from "../../../../components/SkeletonLoader";
import styles from "./ChatMessage.module.scss";
import Markdown from "../../../../components/Markdown"

import { ImageSkeleton } from "../MediaImage/MediaImage";

function ChatMessage({
  message,
  streaming = false,
  streamingText = "",
  streamingError = null,
  onRetry,
  streamingStatus = null,
  imageHint = false,
}) {


  const [copied, setCopied] = useState(false);

    if (message.role === "user") {
    const attachments = message.attachments || [];
    return (
      <div className={styles.userRow}>
        <div className={styles.userCol}>
          {attachments.length > 0 && (
            <div className={styles.attachments}>
              {attachments.map((a) =>
                a.mime?.startsWith("image/") ? (
                  <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
                    <img className={styles.attachImg} src={a.url} alt={a.name} loading="lazy" />
                  </a>
                ) : (
                  <div key={a.id} className={styles.attachFile}>
                    <span className={styles.attachName}>{a.name}</span>
                  </div>
                )
              )}
            </div>
          )}
          {message.text && <div className={styles.bubble}>{message.text}</div>}
        </div>
      </div>
    );
  }

  // AI generate kar raha hai
if (streaming) {
  const isImage = streamingStatus === "image" || (imageHint && !streamingText);
  const imageDone = /!\[[^\]]*\]\([^)]+\)/.test(streamingText);
  const imagePending = isImage && !imageDone;

  return (
    <div className={styles.answer}>
      <span className={styles.label}>
  {imagePending ? "Creating image" : isImage ? "Created image" : "Thinking"}
</span>
      <div className={styles.body}>
        {streamingText && <Markdown>{streamingText}</Markdown>}
        {imagePending ? <ImageSkeleton /> : !streamingText && <SkeletonLoader />}
      </div>
    </div>
  );
}

  // Generation fail
  if (streamingError) {
    return (
      <div className={styles.answer}>
        <div className={styles.error}>
          <p>Sorry, something went wrong while generating the response.</p>
          <button onClick={onRetry}>Retry</button>
        </div>
      </div>
    );
  }

  // Completed assistant message
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  
  const hasImage = /!\[[^\]]*\]\([^)]+\)/.test(message.text);

  return (
    <div className={styles.answer}>
      <span className={styles.label}>{hasImage ? "Created image" : "Answer"}</span>

      <div className={styles.body}>
        <Markdown>{message.text}</Markdown>
      </div>

      <div className={styles.actions}>
        <button onClick={copy} aria-label="Copy" title="Copy">
          {copied ? <Icons.Check size={16} /> : <Icons.Copy size={16} />}
        </button>
      </div>
    </div>
  );
}


export default memo(ChatMessage)