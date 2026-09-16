import axios from "axios";

const ACCESS_TOKEN_KEY = "parishram_access_token";
const REFRESH_TOKEN_KEY = "parishram_refresh_token";

function getStoredToken(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storeAuthTokens(data) {
  try {
    // Google auth returns a session token; email auth returns JWT access/refresh tokens.
    const accessToken = data?.access_token || data?.session_token;
    if (accessToken) window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (data?.refresh_token) window.localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  } catch {}
}

export function clearStoredAuthTokens() {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {}
}

export const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  withCredentials: true,
});

// A bearer token keeps authentication working when the frontend and API are on
// different production domains and the browser blocks third-party cookies.
api.interceptors.request.use((config) => {
  const token = getStoredToken(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Silent token refresh: on 401, refresh the access token once (single in-flight
// refresh shared across concurrent requests), then retry the original request.
const AUTH_CALLS = [
  "/auth/login",
  "/auth/register",
  "/auth/register-otp",
  "/auth/verify-otp",
  "/auth/forgot-password",
  "/auth/me",
  "/auth/refresh",
  "/auth/google",
];
let refreshPromise = null;

api.interceptors.response.use(
  (res) => {
    storeAuthTokens(res.data);
    return res;
  },
  async (error) => {
    const original = error.config;
    const url = original?.url || "";
    const isAuthCall = AUTH_CALLS.some((p) => url.includes(p));
    const hasRefreshToken = Boolean(getStoredToken(REFRESH_TOKEN_KEY));
    if (error.response?.status === 401 && hasRefreshToken && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);
          refreshPromise = api.post("/auth/refresh", refreshToken ? { refresh_token: refreshToken } : undefined).finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        return api(original);
      } catch {
        // Refresh failed — session is over, let the 401 propagate.
        clearStoredAuthTokens();
      }
    }
    return Promise.reject(error);
  }
);

export function formatApiError(err) {
  const detail = err?.response?.data?.detail;
  if (detail == null) return err?.message || "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
