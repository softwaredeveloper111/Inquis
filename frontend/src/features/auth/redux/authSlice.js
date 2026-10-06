import { createSlice } from "@reduxjs/toolkit";
import {
  login,
  signup,
  getMe,
  logout,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from "./auth.thunk";

const initialState = {
  // Authentication/session
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  status: "loading",

  // Resend verification
  resendVerificationLoading: false,
  resendVerificationError: null,

  // Forgot password
  forgotPasswordLoading: false,
  forgotPasswordError: null,

  // Reset password
  resetPasswordLoading: false,
  resetPasswordError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    // LOGIN
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.status = "unauthenticated";
        state.error = action.payload;
      })

      // REGISTER
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // GET ME
      .addCase(getMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.status = "unauthenticated";
        state.error = action.payload;
      })

      // LOGOUT
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.status = "unauthenticated";
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // RESEND VERIFICATION
      .addCase(resendVerificationEmail.pending, (state) => {
        state.resendVerificationLoading = true;
        state.resendVerificationError = null;
      })
      .addCase(resendVerificationEmail.fulfilled, (state) => {
        state.resendVerificationLoading = false;
      })
      .addCase(resendVerificationEmail.rejected, (state, action) => {
        state.resendVerificationLoading = false;
        state.resendVerificationError = action.payload;
      })

      // FORGOT PASSWORD
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPasswordLoading = true;
        state.forgotPasswordError = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.forgotPasswordLoading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordError = action.payload;
      })

      // RESET PASSWORD
      .addCase(resetPassword.pending, (state) => {
        state.resetPasswordLoading = true;
        state.resetPasswordError = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.resetPasswordLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordError = action.payload;
      });
  },
});

export default authSlice.reducer;