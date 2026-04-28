// Simple wrapper around fetch that auto-adds the auth token
// and handles JSON for you.

const API_BASE = "/api";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("sehat_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const err = new Error(data?.error || data || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const api = {
  get:  (path)        => apiFetch(path),
  post: (path, body)  => apiFetch(path, { method: "POST", body }),
  put:  (path, body)  => apiFetch(path, { method: "PUT", body }),
  del:  (path)        => apiFetch(path, { method: "DELETE" }),
};
