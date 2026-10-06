import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import chatServices from "../services/chat.api";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "application/pdf", "text/plain"];
const MAX_SIZE = 5 * 1024 * 1024;
export const MAX_FILES = 3;

export function useFileAttachment() {
  // [{ key, id, name, status: "uploading"|"processing"|"ready"|"failed", failReason }]
  const [files, setFiles] = useState([]);
  const alive = useRef(new Set()); // jin uploads ka result abhi chahiye

  const controllers = useRef(new Map());

  const patch = (key, data) =>
    setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, ...data } : f)));

  const attach = (list) => {

    if (!navigator.onLine) {
  toast.error("You're offline. Please check your internet connection.");
  return;

}
    const room = MAX_FILES - files.length;
    if (list.length > room) toast.error(`Maximum ${MAX_FILES} files per message`);

    for (const f of list.slice(0, Math.max(room, 0))) {
      if (!ALLOWED.includes(f.type)) {
        toast.error(`${f.name}: only PNG, JPG, WEBP, PDF and TXT are allowed`);
        continue;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name}: too large (max ${MAX_SIZE / 1024 / 1024}MB)`);
        continue;
      }

      const key = crypto.randomUUID();
      alive.current.add(key);
      const ctrl = new AbortController();
controllers.current.set(key, ctrl);
      setFiles((prev) => [...prev, { key, name: f.name, status: "uploading" }]);

      chatServices
  .uploadFile(f, ctrl.signal)
  .then((res) => alive.current.has(key) && patch(key, res.data))
  .catch((error) => {
    if (!alive.current.has(key)) return; // user ne khud hata di
    alive.current.delete(key);
    setFiles((prev) => prev.filter((x) => x.key !== key));
    toast.error(
      error.code === "ERR_CANCELED"
        ? `${f.name}: upload cancelled (you're offline)`
        : error.response?.data?.message || `${f.name}: upload failed`
    );
  })
  .finally(() => controllers.current.delete(key));
    }
  };

  const remove = (key) => {
  alive.current.delete(key);
  controllers.current.get(key)?.abort();
  setFiles((prev) => prev.filter((f) => f.key !== key));
};

const clear = () => {
  alive.current.clear();
  controllers.current.forEach((c) => c.abort());
  setFiles([]);
};

useEffect(() => {
  const onOffline = () => controllers.current.forEach((c) => c.abort());
  window.addEventListener("offline", onOffline);
  return () => window.removeEventListener("offline", onOffline);
}, []);

  // processing wali sari files ek hi interval mein poll hoti hain
  const processingIds = files.filter((f) => f.status === "processing").map((f) => f.id).join(",");

  
  useEffect(() => {
    if (!processingIds) return;
    const ids = processingIds.split(",");
    const startedAt = Date.now();

    const timer = setInterval(async () => {
      // 60s se zyada ho gaya: worker band hoga, polling rok do
      if (Date.now() - startedAt > 60_000) {
        clearInterval(timer);
        setFiles((prev) =>
          prev.map((f) =>
            ids.includes(f.id) && f.status === "processing"
              ? { ...f, status: "failed", failReason: "Processing timed out. Remove and try again" }
              : f
          )
        );
        return;
      }

      for (const id of ids) {
        try {
          const res = await chatServices.getFile(id);
          if (res.data.status !== "processing") {
            setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...res.data } : f)));
          }
        } catch {
          // network blip, agli poll pe retry
        }
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [processingIds]);

  return {
    files,
    attach,
    remove,
    clear,
    fileIds: files.filter((f) => f.status === "ready").map((f) => f.id),
    blocked: files.some((f) => f.status !== "ready"),
    full: files.length >= MAX_FILES,
     attachments: files
      .filter((f) => f.status === "ready")
      .map((f) => ({ id: f.id, name: f.name, mime: f.mime, url: f.url })),
  };
}