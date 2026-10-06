import { useEffect, useState } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import styles from "./connectorCard.module.scss";

export default function ConnectorCard({ name, description, Icon, connected, email, busy, disabled, onConnect, onDisconnect }) {
  const [confirming, setConfirming] = useState(false);

  // pehla click "Confirm?" dikhata hai, 3 sec mein wapas normal
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  const handleDisconnect = () => {
    if (!confirming) return setConfirming(true);
    setConfirming(false);
    onDisconnect();
  };

  return (
    <div className={styles.card}>
      <div className={styles.iconTile}>
        <Icon size={24} />
      </div>

      <div className={styles.body}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{name}</span>
          {connected && (
            <span className={styles.badge}>
              <Check size={12} /> Connected
            </span>
          )}
        </div>
        <p className={styles.desc}>{connected && email ? email : description}</p>
      </div>

      {connected ? (
        <button
          className={`${styles.ghost} ${confirming ? styles.danger : ""}`}
          onClick={handleDisconnect}
          disabled={busy || disabled}
        >
          {busy ? <Loader2 size={14} className={styles.spin} /> : confirming ? "Confirm?" : "Disconnect"}
        </button>
      ) : (
        <button className={styles.plus} onClick={onConnect} disabled={busy || disabled} aria-label={`Connect ${name}`}>
          {busy ? <Loader2 size={16} className={styles.spin} /> : <Plus size={18} />}
        </button>
      )}
    </div>
  );
}