import { initializeSocketConnection } from "../../../services/sockets/client.socket";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";


import {
  fetchChats,
  fetchMessages,
  sendMessage,
  togglePin,
  removeChat,
  renameChatTitle,
  fetchMoreChats,
  fetchOlderMessages
} from "../store/chatThunk";

import { setActiveChat } from "../store/chatSlice";

  // ConditionError (double call) par toast nahi dikhana
const quiet = (p) =>
  p.unwrap().catch((e) => {
    if (e?.name !== "ConditionError") toast.error(typeof e === "string" ? e : "Something went wrong");
  });

const useChat = () => {
  const dispatch = useDispatch();

  const {
    chats,
    messagesByChatId,
    activeChatId,
    streaming,
    streamingText,
    streamingStatus,
    streamingError,
    failedMessage,
    pendingUserMessage,
    chatsLoading,
    messagesLoading,
    chatsHasMore, 
    chatsLoadingMore, 
    messagesMeta,
    olderLoading,

  } = useSelector((state) => state.chat);

  const loadChats = useCallback(() => {
    dispatch(fetchChats()).unwrap().catch((e) => toast.error(e));
  }, [dispatch]);



const loadMoreChats = useCallback(() => quiet(dispatch(fetchMoreChats())), [dispatch]);
const loadOlderMessages = useCallback(
  (chatId) => quiet(dispatch(fetchOlderMessages(chatId))),
  [dispatch]
);



  const safe = useCallback(async (action) => {
  try {
    await dispatch(action).unwrap();
    return true;
  } catch (e) {
    toast.error(typeof e === "string" ? e : "Something went wrong");
    return false;
  }
}, [dispatch]);

const pinChat = useCallback((id) => safe(togglePin(id)), [safe]);
const renameChat = useCallback((id, title) => safe(renameChatTitle({ chatId: id, title })), [safe]);
const deleteChat = useCallback((id) => safe(removeChat(id)), [safe]);


  const loadMessages = useCallback(
    async (chatId) => {
      if (!chatId) return;

      try {
        await dispatch(fetchMessages(chatId)).unwrap();
      } catch (error) {
        toast.error(error || "Failed to load messages");
      }
    },
    [dispatch]
  );

  const selectChat = useCallback(
    (chatId) => {
      dispatch(setActiveChat(chatId));
    },
    [dispatch]
  );

  const sendChatMessage = useCallback(
    async (message, chatId , fileIds , attachments) => {
     if ((!message?.trim() && !fileIds?.length) || streaming) return;

       // offline hai to request bhejo hi mat
    if (!navigator.onLine) {
      toast.error("You're offline. Please check your internet connection and try again.");
      return;
    }


      try {
        await dispatch(
          sendMessage({
            message: message.trim(),
            ...(chatId && { chatId }),
             ...(fileIds?.length && { fileIds }),
              ...(attachments?.length && { attachments }),
          })
        ).unwrap();
      } catch (error) {
         toast.error(
        !navigator.onLine
          ? "You went offline. Please reconnect and retry."
          : error || "Failed to generate response"
      );
      }
    },
    [dispatch, streaming]
  );

  const retryMessage = useCallback(() => {
    if (!failedMessage) return;

    sendChatMessage(
      failedMessage.message,
      failedMessage.chatId,
       failedMessage.fileIds,
       failedMessage.attachments
    );
  }, [failedMessage, sendChatMessage]);


  return {
    chats,
    messagesByChatId,

    activeChatId,

    streaming,
    streamingText,
    streamingStatus,
    streamingError,
    failedMessage,

    chatsLoading,
    messagesLoading,

    loadChats,
    loadMessages,
    selectChat,
    sendChatMessage,
    retryMessage,
    pendingUserMessage,

    pinChat,
    renameChat,
    deleteChat,

    chatsHasMore,
    chatsLoadingMore,
    messagesMeta,
     olderLoading,
    loadMoreChats, 
      loadOlderMessages,



    initializeSocketConnection,
  };
};

export default useChat;