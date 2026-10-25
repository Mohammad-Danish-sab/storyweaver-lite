import { API_BASE_URL } from "./api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.detail || "The request could not be completed.");
    error.status = response.status;
    throw error;
  }
  return result;
}

const jsonBody = (value) => ({ method: "POST", body: JSON.stringify(value) });

export const registerAccount = (details) => request("/auth/register", jsonBody(details));
export const loginAccount = (details) => request("/auth/login", jsonBody(details));
export const getCurrentAccount = () => request("/auth/me");
export const logoutAccount = () => request("/auth/logout", { method: "POST" });
export const requestPasswordReset = (email) => request("/auth/forgot-password", jsonBody({ email }));
export const resetPassword = (token, password) => request("/auth/reset-password", jsonBody({ token, password }));
export const getChildProfiles = () => request("/children");
export const createChildProfile = (profile) => request("/children", jsonBody(profile));
export const toggleChildLike = (profileId, storyId) =>
  request(`/children/${encodeURIComponent(profileId)}/likes`, jsonBody({ story_id: storyId }));
