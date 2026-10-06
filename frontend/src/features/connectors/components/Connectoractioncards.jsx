import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { confirmConnectorAction, cancelConnectorAction } from "../services/Connectorsapi";
import { subscribeActions, getActions, removeConnectorAction } from "../store/connectoractions.store";
import styles from "./ConnectorActionCards.module.scss";

function Card({ action }) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      toast.success(await confirmConnectorAction(action.id));
      removeConnectorAction(action.id);
    } catch (err) {
      toast.error(err?.message || "Couldn't complete the action");
      if (/expired|already handled/i.test(err?.message || "")) removeConnectorAction(action.id);
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    await cancelConnectorAction(action.id).catch(() => {});
    removeConnectorAction(action.id);
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>{action.title}</div>
      <dl className={styles.fields}>
        {action.fields?.map((f) => (
          <div key={f.label} className={styles.row}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
      {action.body && <pre className={styles.body}>{action.body}</pre>}
      <div className={styles.buttons}>
        <button className={styles.cancel} onClick={cancel} disabled={busy}>Cancel</button>
        <button className={`${styles.confirm} ${action.destructive ? styles.danger : ""}`} onClick={confirm} disabled={busy}>
          {busy ? "Working…" : action.confirmLabel || "Confirm"}
        </button>
      </div>
    </div>
  );
}

export default function ConnectorActionCards() {
  const actions = useSyncExternalStore(subscribeActions, getActions);
  if (!actions.length) return null;
  return (
    <div className={styles.dock}>
      {actions.map((a) => <Card key={a.id} action={a} />)}
    </div>
  );
}