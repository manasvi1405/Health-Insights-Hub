// Home page - shows greeting, due meds, low stock, recent scans

if (!requireAuth()) throw new Error("not authenticated");
renderLayout("home");

async function loadHome() {
  try {
    const data = await api.get("/home/summary");
    renderHome(data);
  } catch (err) {
    if (err.status === 401) { logout(); return; }
    document.getElementById("content").innerHTML = `
      <div class="card card-danger">
        <h3>Could not load</h3>
        <p>${err.message}</p>
      </div>`;
  }
}

function renderHome(data) {
  const { greeting, dueMedications = [], lowStockAlerts = [], recentScans = [] } = data;

  const dueHtml = dueMedications.length === 0
    ? `<div class="card card-empty">${t("home.noMeds")}</div>`
    : dueMedications.map(m => `
        <div class="card">
          <div class="row-between">
            <div>
              <div class="med-name" style="font-size:18px; font-weight:700;">${escapeHtml(m.medName)}</div>
              <div class="muted text-sm">${escapeHtml(m.dosage)} • ${escapeHtml(m.frequency)}</div>
            </div>
            <a href="/reminders.html" class="btn" style="width:auto; padding:10px 18px;">${t("home.take")}</a>
          </div>
        </div>`).join("");

  const lowStockHtml = lowStockAlerts.length === 0 ? "" : `
    <h2 style="color: var(--danger); margin-top:18px;">⚠ ${t("home.lowStock")}</h2>
    ${lowStockAlerts.map(m => `
      <div class="card card-warn">
        <div class="row-between">
          <div>
            <div style="font-weight:700;">${escapeHtml(m.medName)}</div>
            <div class="muted text-sm">Only ${m.stockCount} left</div>
          </div>
        </div>
      </div>`).join("")}`;

  const scansHtml = recentScans.length === 0
    ? `<div class="card card-empty">
         ${t("home.noScans")}<br>
         <a href="/scan.html" style="color: var(--primary); font-weight:700; display:inline-block; margin-top:10px;">${t("scan.title")}</a>
       </div>`
    : recentScans.map(s => `
        <div class="card">
          <div style="font-weight:700; text-transform:capitalize;">${escapeHtml(s.type)}</div>
          <div class="muted text-sm" style="margin-top:4px;">${escapeHtml((s.summary || "").slice(0,100))}</div>
        </div>`).join("");

  document.getElementById("content").innerHTML = `
    <header style="padding-top:8px; padding-bottom:14px;">
      <h1>${escapeHtml(greeting)}</h1>
      <p class="muted text-lg">${t("home.summary")}</p>
    </header>

    <section class="mb-4">
      <div class="row-between mb-3">
        <h2 style="margin:0;">${t("home.dueMeds")}</h2>
        <a href="/reminders.html" style="color:var(--primary); font-weight:600;">${t("home.viewAll")}</a>
      </div>
      ${dueHtml}
    </section>

    ${lowStockHtml}

    <section class="mt-4">
      <h2>${t("home.recentScans")}</h2>
      ${scansHtml}
    </section>`;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

loadHome();
