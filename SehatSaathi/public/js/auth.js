// Auth helpers: token + user storage, route guard

function getToken() { return localStorage.getItem("sehat_token"); }
function setToken(t) { localStorage.setItem("sehat_token", t); }
function clearAuth() {
  localStorage.removeItem("sehat_token");
  localStorage.removeItem("sehat_user");
}

function getUser() {
  try { return JSON.parse(localStorage.getItem("sehat_user") || "null"); }
  catch { return null; }
}
function setUser(u) { localStorage.setItem("sehat_user", JSON.stringify(u)); }

// Redirect to login if no token (call this on protected pages)
function requireAuth() {
  if (!getToken()) {
    window.location.href = "/index.html";
    return false;
  }
  return true;
}

function logout() {
  clearAuth();
  window.location.href = "/index.html";
}
