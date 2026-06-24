import { setAuthTokenGetter, setBaseUrl } from "@hrms/api-client";

setBaseUrl(import.meta.env.VITE_API_URL ?? "");

// Register auth token getter for all API calls
setAuthTokenGetter(() => localStorage.getItem("hrms_token"));

// Global 401 handler — redirect to login on auth failure
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await originalFetch(input, init);

  let url = "";
  if (typeof input === "string") url = input;
  else if (input instanceof URL) url = input.toString();
  else if (input instanceof Request) url = input.url;

  if (response.status === 401 && !url.includes("/api/auth/login")) {
    localStorage.removeItem("hrms_token");
    window.location.href = "/login";
  }

  return response;
};

export {};
