// Renders the shared header (logo) + bottom nav + floating SOS button.
// Just call renderLayout(activePage) on each protected page.

function renderLayout(activePage) {
  // Header
  const header = `
    <header class="app-header">
      <a href="/home.html" class="logo-link">
        <span class="brand">SehatSaathi</span>
        <span class="logo-circle">S</span>
      </a>
    </header>`;

  // Bottom nav
  const navItems = [
    { id: "home",      href: "/home.html",      key: "nav.home",      icon: iconHome() },
    { id: "scan",      href: "/scan.html",      key: "nav.scan",      icon: iconScan() },
    { id: "reminders", href: "/reminders.html", key: "nav.reminders", icon: iconClock() },
    { id: "profile",   href: "/profile.html",   key: "nav.profile",   icon: iconUser() },
  ];
  const nav = `
    <nav class="bottom-nav">
      ${navItems.map(it => `
        <a href="${it.href}" class="${it.id === activePage ? 'active' : ''}">
          ${it.icon}
          <span>${t(it.key)}</span>
        </a>`).join("")}
    </nav>`;

  // SOS floating button
  const sos = `
    <a href="/sos.html" class="sos-fab" title="Emergency SOS">
      ${iconPhone()}
    </a>`;

  // Inject
  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", sos);
  document.body.insertAdjacentHTML("beforeend", nav);

  // Re-render nav labels when language changes
  window.addEventListener("sehat_lang_change", () => {
    document.querySelectorAll(".bottom-nav a span").forEach((span, i) => {
      span.textContent = t(navItems[i].key);
    });
  });
}

// ---------- Inline SVG icons (so we don't need an icon library) ----------
function svg(path, extra = "") {
  return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${path}</svg>`;
}
function iconHome()  { return svg(`<path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/>`); }
function iconScan()  { return svg(`<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>`); }
function iconClock() { return svg(`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`); }
function iconUser()  { return svg(`<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>`); }
function iconPhone() { return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`; }

// ---------- Toast helper ----------
function showToast(message, type = "info", durationMs = 3000) {
  document.querySelectorAll(".toast").forEach(t => t.remove());
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), durationMs);
}
