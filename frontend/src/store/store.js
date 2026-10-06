import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/redux/authSlice";
import chatReducer from "../features/chat/store/chatSlice"

const store = configureStore({
  reducer: {
    auth: authReducer,
    chat : chatReducer,
  },
});

export default store;