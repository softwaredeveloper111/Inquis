import { useEffect, useRef, useLayoutEffect } from "react";
import useChat from "../hooks/useChat";
import ChatInput from "../components/ChatInput/ChatInput";
import ChatMessage from "../components/ChatMessage/ChatMessage";
import SkeletonLoader from "../../../components/SkeletonLoader";
import styles from "./Dashboard.module.scss";
import {toast} from "sonner"

const IMAGE_VERB = /\b(generate|create|make|draw|design|paint|sketch|render|bana\w*)\b/i;
const IMAGE_NOUN = /\b(images?|pictures?|photos?|pics?|logos?|wallpapers?|paintings?|illustrations?|posters?)\b/i;
const wantsImage = (text = "") => IMAGE_VERB.test(text) && IMAGE_NOUN.test(text);

export default function Dashboard() {
  const {
    activeChatId,
    messagesByChatId,
    messagesMeta,
    messagesLoading,
    olderLoading,
    streaming,
    streamingText,
    streamingError,
    pendingUserMessage,
    loadMessages,
    loadOlderMessages,
    sendChatMessage,
    retryMessage,
    streamingStatus,
  } = useChat();

  const scrollRef = useRef(null);
  const threadRef = useRef(null);
const lastTopRef = useRef(0);
const showChat = !!(activeChatId || pendingUserMessage);

const stickRef = useRef(true); // user bottom ke paas hai?
  const lastChatRef = useRef(null);
  const prevRef = useRef(null); // purane messages judne se pehle ki scroll position

  const cached = activeChatId ? messagesByChatId[activeChatId] : null;
  const messages = cached || [];
  const hasMoreOlder = !!(activeChatId && messagesMeta[activeChatId]?.hasMore);

  useEffect(() => {
  const off = () => toast.error("You're offline");
  const on = () => toast.success("Back online");
  window.addEventListener("offline", off);
  window.addEventListener("online", on);
  return () => {
    window.removeEventListener("offline", off);
    window.removeEventListener("online", on);
  };
}, []);

  // Sirf tab fetch karo jab messages store mein na ho
  useEffect(() => {
    if (!activeChatId || cached) return;
    loadMessages(activeChatId);
  }, [activeChatId, cached, loadMessages]);

  const tryLoadOlder = () => {
    const el = scrollRef.current;
    if (!el || !hasMoreOlder || olderLoading) return;
    prevRef.current = { height: el.scrollHeight };
    loadOlderMessages(activeChatId);
  };

  const onScroll = () => {
  const el = scrollRef.current;
  const goingUp = el.scrollTop < lastTopRef.current;
  lastTopRef.current = el.scrollTop;
  stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  if (goingUp && el.scrollTop < 300) tryLoadOlder();
};

  // messages chhote hon aur scroll hi na ho, tab bhi purane load ho jayein
  useEffect(() => {
  const el = scrollRef.current;
  if (el && hasMoreOlder && el.scrollHeight <= el.clientHeight) tryLoadOlder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [messages.length, hasMoreOlder]);

useEffect(() => {
  const t = threadRef.current;
  if (!t) return;
  const ro = new ResizeObserver(() => {
    const el = scrollRef.current;
    if (el && stickRef.current && !prevRef.current) el.scrollTop = el.scrollHeight;
  });
  ro.observe(t);
  return () => ro.disconnect();
}, [showChat]);

  // paint se pehle scroll, isliye jitter nahi hota
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // purane messages upar judne par user ki position same rakho
    if (prevRef.current && !olderLoading) {
  el.scrollTop += el.scrollHeight - prevRef.current.height;
  prevRef.current = null;
  return;
}

    // chat badla to neeche se shuru
    if (lastChatRef.current !== activeChatId) {
      lastChatRef.current = activeChatId;
      stickRef.current = true;
    }
    if (stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, streamingText, streamingError, pendingUserMessage, activeChatId, olderLoading]);

  const send = (text ,fileIds , attachments) => {
    stickRef.current = true;
    sendChatMessage(text, activeChatId , fileIds , attachments);
  };

  // New chat / home screen
  if (!activeChatId && !pendingUserMessage) {
    return (
      <div className={styles.home}>
        <div className={styles.homeInner}>
          <span className={styles.kicker}>Search</span>
          <h1 className={styles.title}>What do you want to know?</h1>
          <ChatInput onSend={send} placeholder="Ask anything…" autoFocus />
        </div>
      </div>
    );
  }

  const imageHint = wantsImage(pendingUserMessage?.text);

  // Existing chat
  return (
    <div className={styles.chat}>
      <div className={styles.scroll} ref={scrollRef} onScroll={onScroll} style={{ overflowAnchor: "none" }}>
        <div className={styles.thread} ref={threadRef}>
          {messagesLoading && !cached ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* fixed height, taaki skeleton aane-jaane se content na hile */}
              {hasMoreOlder && (
  <div className={styles.olderSlot}>
    {olderLoading && <SkeletonLoader />}
  </div>
)}

              {messages.map((message, index) => (
                <ChatMessage key={message.id || index} message={message} />
              ))}

              {pendingUserMessage && <ChatMessage message={pendingUserMessage} />}

              {(streaming || streamingError) && (
                <ChatMessage
                  message={{ role: "assistant" }}
                  streaming={streaming}
                  streamingText={streamingText}
                  streamingError={streamingError}
                  onRetry={retryMessage}
                  streamingStatus={streamingStatus}
                  imageHint={imageHint}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.dock}>
        <ChatInput onSend={send} placeholder="Ask a follow-up" autoFocus />
      </div>
    </div>
  );
}