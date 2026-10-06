import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  chats: [],
  messagesByChatId: {},
  activeChatId: null,

  streaming: false,
  streamingText: "",
  streamingError: null,
  streamingStatus: null,
  failedMessage: null,
  pendingUserMessage: null,

  chatsLoading: false,
  messagesLoading: false,

  chatsHasMore: false,
  chatsCursor: null,
  chatsLoadingMore: false,
  messagesMeta: {}, // { [chatId]: { hasMore, cursor } }
  olderLoading: false,
};

const replaceChat = (state, action) => {
  const i = state.chats.findIndex((c) => c.id === action.payload.id);
  if (i !== -1) state.chats[i] = action.payload;
};

const chatSlice = createSlice({
  name: "chat",
  initialState,

  reducers: {
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload;

      // purane error / pending UI ko saaf karo (streaming chal rahi ho to chhodo)
      if (!state.streaming) {
        state.streamingError = null;
        state.failedMessage = null;
        state.pendingUserMessage = null;
      }
    },

    setStreamingStatus: (state, action) => {
   state.streamingStatus = action.payload;
    },


    startStreaming: (state, action) => {
      const { message, chatId , fileIds ,  attachments } = action.payload;

      state.streaming = true;
      state.streamingText = "";
      state.streamingError = null;
     state.failedMessage = { message, chatId: chatId || null, fileIds: fileIds || [] , attachments: attachments || [] };
      state.pendingUserMessage = { role: "user", text: message , attachments: attachments || [] };
      state.streamingStatus = null;
    },

    appendToken: (state, action) => {
      state.streamingText += action.payload;
    },

    finishStreaming: (state, action) => {
      const chatId = action.payload;

      if (chatId) {
        const list = state.messagesByChatId[chatId] || [];
        list.push(state.pendingUserMessage, {
          role: "assistant",
          text: state.streamingText,
        });
        state.messagesByChatId[chatId] = list;
        state.activeChatId = chatId;
      }

      state.streaming = false;
      state.streamingText = "";
      state.streamingError = null;
      state.failedMessage = null;
      state.pendingUserMessage = null;
      state.streamingStatus = null;
    },

    streamError: (state, action) => {
      state.streaming = false;
      state.streamingError = action.payload;
      state.streamingStatus = null;
    },

    clearStreamError: (state) => {
      state.streamingError = null;
      state.failedMessage = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Chats
      .addCase("chat/fetchChats/pending", (state) => {
        if (!state.chats.length) state.chatsLoading = true;
      })
      .addCase("chat/fetchChats/fulfilled", (state, action) => {
        const { chats, hasMore, nextCursor } = action.payload;
        state.chatsLoading = false;

        if (!state.chats.length) {
          state.chats = chats;
          state.chatsHasMore = hasMore;
          state.chatsCursor = nextCursor;
        } else {
          // refresh (naya message aane ke baad): pehla batch update, load kiye hue baaki chats waise hi rahein
          const ids = new Set(chats.map((c) => c.id));
          state.chats = [
            ...chats,
            ...state.chats.filter((c) => !ids.has(c.id)),
          ];
        }
      })
      .addCase("chat/fetchChats/rejected", (state) => {
        state.chatsLoading = false;
      })

      // Messages
      .addCase("chat/fetchMessages/pending", (state) => {
        state.messagesLoading = true;
      })
      .addCase("chat/fetchMessages/fulfilled", (state, action) => {
        const { chatId, messages, hasMore, nextCursor } = action.payload;
        state.messagesLoading = false;
        state.messagesByChatId[chatId] = messages;
        state.messagesMeta[chatId] = { hasMore, cursor: nextCursor };
      })
      .addCase("chat/fetchMessages/rejected", (state) => {
        state.messagesLoading = false;
      })

      // More chats
      .addCase("chat/fetchMoreChats/pending", (state) => {
        state.chatsLoadingMore = true;
      })
      .addCase("chat/fetchMoreChats/fulfilled", (state, action) => {
        const { chats, hasMore, nextCursor } = action.payload;
        const ids = new Set(state.chats.map((c) => c.id));
        state.chats.push(...chats.filter((c) => !ids.has(c.id)));
        state.chatsHasMore = hasMore;
        state.chatsCursor = nextCursor;
        state.chatsLoadingMore = false;
      })
      .addCase("chat/fetchMoreChats/rejected", (state) => {
        state.chatsLoadingMore = false;
      })

      // Older messages
      .addCase("chat/fetchOlderMessages/pending", (state) => {
        state.olderLoading = true;
      })
      .addCase("chat/fetchOlderMessages/fulfilled", (state, action) => {
        const { chatId, messages, hasMore, nextCursor } = action.payload;
        const current = state.messagesByChatId[chatId] || [];
        const have = new Set(current.map((m) => m.id));
        state.messagesByChatId[chatId] = [
          ...messages.filter((m) => !have.has(m.id)),
          ...current,
        ];
        state.messagesMeta[chatId] = { hasMore, cursor: nextCursor };
        state.olderLoading = false;
      })
      .addCase("chat/fetchOlderMessages/rejected", (state) => {
        state.olderLoading = false;
      })

      // Pin / Rename / Delete
      .addCase("chat/togglePin/fulfilled", replaceChat)
      .addCase("chat/renameChatTitle/fulfilled", (state, action) => {
        const chat = state.chats.find((c) => c.id === action.payload.id);
        if (chat) chat.title = action.payload.title;
      })
      .addCase("chat/removeChat/fulfilled", (state, action) => {
        const id = action.payload;
        state.chats = state.chats.filter((c) => c.id !== id);
        delete state.messagesByChatId[id];
        delete state.messagesMeta[id];
        if (state.activeChatId === id) state.activeChatId = null; // home screen par
      });
  },
});

export const {
  setActiveChat,
  startStreaming,
  appendToken,
  finishStreaming,
  streamError,
  clearStreamError,
  setStreamingStatus
} = chatSlice.actions;

export default chatSlice.reducer;
