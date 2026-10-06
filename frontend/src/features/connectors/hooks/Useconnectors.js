import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchConnectors, startGoogleConnect, removeConnector } from "../services/Connectorsapi";

// Redux use nahi kiya: ye feature poora local state par chalta hai
export default function useConnectors() {
  const [items, setItems] = useState({}); // { gmail: {connected, email}, ... }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // service jispe action chal raha hai

  const load = useCallback(async () => {
    try {
      const list = await fetchConnectors();
      setItems(Object.fromEntries(list.map((i) => [i.service, i])));
    } catch (err) {
      toast.error(err?.message || "Couldn't load connectors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const connect = useCallback(async (service) => {
    setBusy(service);
    try {
      const url = await startGoogleConnect(service);
      window.location.assign(url); // Google consent page; wapas aane par page reload hota hai
    } catch (err) {
      toast.error(err?.message || "Couldn't start the connection");
      setBusy(null);
    }
  }, []);

  const disconnect = useCallback(async (service) => {
    setBusy(service);
    try {
      await removeConnector(service);
      setItems((prev) => ({ ...prev, [service]: { service, connected: false, email: null } }));
      toast.success("Disconnected");
    } catch (err) {
      toast.error(err?.message || "Couldn't disconnect");
    } finally {
      setBusy(null);
    }
  }, []);

  return { items, loading, busy, connect, disconnect, reload: load };
}