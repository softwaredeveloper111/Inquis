import { createAsyncThunk } from "@reduxjs/toolkit";
import chatServices from "../services/chat.api";
import { addConnectorAction } from "../../connectors/store/connectoractions.store";
import {
  startStreaming,
  appendToken,
  finishStreaming,
  streamError,
  setStreamingStatus,
} from "./chatSlice";

const PAGE = 20;
// ⚠️ Backend ke response ke hisaab se sirf yahan mapping badalna
const toChat = (c) => ({
  id: c._id,
  title: c.title,
  pinned: c.isPinned,
  updatedAt: c.updatedAt,
});

const DEFAULT_FILE_TEXT =
  "Please look at the attached file(s) and describe what is in them.";

const toMessage = (m) => {
  const attachments = (m.attachments || []).map((a) => ({
    id: a._id,
    name: a.name,
    mime: a.mime,
    url: a.url,
  }));
  return {
    id: m._id,
    role: m.role === "user" ? "user" : "ai",
    // file-only message ka default sentence UI mein nahi dikhana
    text:
      attachments.length && m.content === DEFAULT_FILE_TEXT ? "" : m.content,
    attachments,
  };
};

const errMsg = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export const fetchChats = createAsyncThunk(
  "chat/fetchChats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await chatServices.getChats({ limit: PAGE });
      const { chats, hasMore, nextCursor } = res.data;
      return { chats: chats.map(toChat), hasMore, nextCursor };
    } catch (error) {
      return rejectWithValue(errMsg(error, "Failed to load chats"));
    }
  },
);

export const fetchMoreChats = createAsyncThunk(
  "chat/fetchMoreChats",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { chatsCursor } = getState().chat;
      const res = await chatServices.getChats({
        limit: PAGE,
        cursor: chatsCursor,
      });
      const { chats, hasMore, nextCursor } = res.data;
      return { chats: chats.map(toChat), hasMore, nextCursor };
    } catch (error) {
      return rejectWithValue(errMsg(error, "Failed to load more chats"));
    }
  },
  {
    // double call rokne ke liye
    condition: (_, { getState }) => {
      const { chat } = getState();
      return chat.chatsHasMore && !chat.chatsLoadingMore;
    },
  },
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (chatId, { rejectWithValue }) => {
    try {
      const res = await chatServices.getChatMessages(chatId, { limit: PAGE });
      const { messages, hasMore, nextCursor } = res.data;
      return { chatId, messages: messages.map(toMessage), hasMore, nextCursor };
    } catch (error) {
      return rejectWithValue(errMsg(error, "Failed to load messages"));
    }
  },
);

export const fetchOlderMessages = createAsyncThunk(
  "chat/fetchOlderMessages",
  async (chatId, { getState, rejectWithValue }) => {
    try {
      const { cursor } = getState().chat.messagesMeta[chatId];
      const res = await chatServices.getChatMessages(chatId, {
        limit: PAGE,
        cursor,
      });
      const { messages, hasMore, nextCursor } = res.data;
      return { chatId, messages: messages.map(toMessage), hasMore, nextCursor };
    } catch (error) {
      return rejectWithValue(errMsg(error, "Failed to load older messages"));
    }
  },
  {
    condition: (chatId, { getState }) => {
      const { chat } = getState();
      return !!chat.messagesMeta[chatId]?.hasMore && !chat.olderLoading;
    },
  },
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (
    { message, chatId, fileIds, attachments },
    { dispatch, rejectWithValue },
  ) => {
    let buffer = "";
    let raf = null;

    const flush = () => {
      raf = null;
      if (buffer) {
        dispatch(appendToken(buffer));
        buffer = "";
      }
    };
    const stopBatching = () => {
      if (raf) cancelAnimationFrame(raf);
      flush();
    };

    try {
      dispatch(startStreaming({ message, chatId, fileIds, attachments }));

      await chatServices.streamChatMessage({ message, chatId, fileIds }, (event) => {
  if (event.type === "token") {
    buffer += event.text;
    if (!raf) raf = requestAnimationFrame(flush);
  } else if (event.type === "status") {
    dispatch(setStreamingStatus(event.status));
  } else if (event.type === "connector_action") {
    addConnectorAction(event.action);
  } else if (event.type === "error") {
    throw new Error(event.message);
  } else if (event.type === "done") {
    stopBatching();
    dispatch(finishStreaming(event.chat));
    dispatch(fetchChats());
  }
});
      return true;
    } catch (error) {
      stopBatching();
      const msg = errMsg(
        error,
        "Something went wrong while generating the response.",
      );
      dispatch(streamError(msg));
      return rejectWithValue(msg);
    }
  },
);

export const togglePin = createAsyncThunk(
  "chat/togglePin",
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await chatServices.pinnedChat(chatId);
      return toChat(response.data);
    } catch (error) {
      return rejectWithValue(errMsg(error, "Failed to pin chat"));
    }
  },
);

export const renameChatTitle = createAsyncThunk(
  "chat/renameChatTitle",
  async ({ chatId, title }, { rejectWithValue }) => {
    try {
      await chatServices.renameChat(chatId, title);
      return { id: chatId, title };
    } catch (error) {
      return rejectWithValue(errMsg(error, "Failed to rename the chat"));
    }
  },
);

export const removeChat = createAsyncThunk(
  "chat/removeChat",
  async (chatId, { rejectWithValue }) => {
    try {
      await chatServices.deleteChat(chatId);
      return chatId;
    } catch (error) {
      return rejectWithValue(errMsg(error, "failed to delete the chat"));
    }
  },
);
