import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// ── Password login ────────────────────────────────────────────────────────────
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async ({ admId, password }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/admin/login', { admId: admId.toUpperCase(), password });
      return res.data; // { success, token, data: { admId, name, email } }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed. Please try again.');
    }
  }
);

// ── OTP Step 1: Request OTP ───────────────────────────────────────────────────
export const requestOtp = createAsyncThunk(
  'auth/requestOtp',
  async ({ admId }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/admin/request-otp', { admId: admId.toUpperCase() });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send OTP.');
    }
  }
);

// ── OTP Step 2: Login with OTP ────────────────────────────────────────────────
export const loginWithOtp = createAsyncThunk(
  'auth/loginWithOtp',
  async ({ admId, otp }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/admin/login-otp', { admId: admId.toUpperCase(), otp });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Invalid or expired OTP.');
    }
  }
);

// ── Logout ────────────────────────────────────────────────────────────────────
export const logoutAdmin = createAsyncThunk(
  'auth/logoutAdmin',
  async (_, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      axios.post('/api/admin/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,        // Session-only — never in localStorage
    admin: null,        // { admId, name, email }
    isLoading: false,
    otpSent: false,     // True after OTP request succeeds
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.admin = null;
      state.error = null;
      state.otpSent = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetOtpState: (state) => {
      state.otpSent = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Shared loading/error handler
    const pending  = (state) => { state.isLoading = true;  state.error = null; };
    const rejected = (state, action) => { state.isLoading = false; state.error = action.payload; };
    const fulfilled = (state, action) => {
      state.isLoading = false;
      state.token = action.payload.token;
      state.admin = action.payload.data;
    };

    builder
      // Password login
      .addCase(loginAdmin.pending,   pending)
      .addCase(loginAdmin.fulfilled, fulfilled)
      .addCase(loginAdmin.rejected,  rejected)

      // OTP request
      .addCase(requestOtp.pending,   pending)
      .addCase(requestOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.otpSent = true;
        state.error = null;
      })
      .addCase(requestOtp.rejected,  rejected)

      // OTP login
      .addCase(loginWithOtp.pending,   pending)
      .addCase(loginWithOtp.fulfilled, fulfilled)
      .addCase(loginWithOtp.rejected,  rejected)

      // Logout
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.token = null;
        state.admin = null;
        state.otpSent = false;
      });
  },
});

export const { logout, clearError, resetOtpState } = authSlice.actions;

// Selectors
export const selectIsAuthenticated = (state) => !!state.auth.token;
export const selectAdmin           = (state) => state.auth.admin;
export const selectAuthLoading     = (state) => state.auth.isLoading;
export const selectAuthError       = (state) => state.auth.error;
export const selectOtpSent         = (state) => state.auth.otpSent;

export default authSlice.reducer;
