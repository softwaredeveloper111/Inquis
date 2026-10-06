import { createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../services/auth.api";


// LOGIN
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await authService.loginApi(email, password);

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.message || "Login failed"
      );
    }
  }
);


// REGISTER
export const signup = createAsyncThunk(
  "auth/signup",
  async ({ username, email, password }, { rejectWithValue }) => {
    try {
      const data = await authService.registerApi(
        username,
        email,
        password
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.message || "Registration failed"
      );
    }
  }
);


// GET ME
export const getMe = createAsyncThunk(
  "auth/getMe",
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.getMeApi();

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.message || "Authentication check failed"
      );
    }
  }
);


// LOGOUT
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.logoutApi();

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.message || "Logout failed"
      );
    }
  }
);


// RESEND VERIFICATION EMAIL
export const resendVerificationEmail = createAsyncThunk(
  "auth/resendVerificationEmail",
  async (email, { rejectWithValue }) => {
    try {
      const data = await authService.resendVerificationEmailApi(email);

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Failed to resend verification email"
      );
    }
  }
);


// FORGOT PASSWORD
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const data = await authService.forgotPasswordApi(email);

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Failed to send password reset email"
      );
    }
  }
);


// RESET PASSWORD
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const data = await authService.resetPasswordApi(
        token,
        password
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Failed to reset password"
      );
    }
  }
);