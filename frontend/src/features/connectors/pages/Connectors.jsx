import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import ConnectorCard from "../components/ConnectorCard";
import useConnectors from "../hooks/Useconnectors";
import { CONNECTOR_LIST, CONNECTOR_NAMES, ERROR_MESSAGES } from "../config/Connectors.config";
import styles from "./Connectors.module.scss";



export default function Connectors() {
  const { items, loading, busy, connect, disconnect, reload } = useConnectors();
  const [params, setParams] = useSearchParams();
  const handled = useRef(false);

  // Google se wapas aane ke baad ?connected=gmail ya ?connector_error=... aata hai
  useEffect(() => {
    if (handled.current) return; // StrictMode double-run guard
    const connected = params.get("connected");
    const error = params.get("connector_error");
    if (!connected && !error) return;
    handled.current = true;

    if (connected && CONNECTOR_NAMES[connected]) {
      toast.success(`${CONNECTOR_NAMES[connected]} connected`);
      reload();
    } else if (error) {
      toast.error(ERROR_MESSAGES[error] || ERROR_MESSAGES.google_failed);
    }
    setParams({}, { replace: true });
  }, [params, setParams, reload]);

  return (
    <div className={styles.page}>
      <h3 className={styles.title}>Connectors</h3>
      <p className={styles.subtitle}>
        Connect your Google apps so the assistant can work with your own emails, events and files. You can disconnect anytime.
      </p>

      <div className={styles.list}>
        {CONNECTOR_LIST.map(({ service, name, description, Icon }) => (
          <ConnectorCard
            key={service}
            name={name}
            description={description}
            Icon={Icon}
            connected={Boolean(items[service]?.connected)}
            email={items[service]?.email}
            busy={busy === service}
            disabled={loading || (busy !== null && busy !== service)}
            onConnect={() => connect(service)}
            onDisconnect={() => disconnect(service)}
          />
        ))}
      </div>
    </div>
  );
}