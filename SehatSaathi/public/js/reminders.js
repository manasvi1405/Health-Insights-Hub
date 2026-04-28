// Reminders page - list + add/take/delete

if (!requireAuth()) throw new Error("not authenticated");
renderLayout("reminders");

const content = document.getElementById("content");
const modalRoot = document.getElementById("modal-root");

async function loadReminders() {
  try {
    const list = await api.get("/reminders");
    render(list);
    // ?add=NAME from scan page → open modal pre-filled
    const params = new URLSearchParams(location.search);
    if (params.get("add")) {
      openModal({ medName: params.get("add") });
      history.replaceState({}, "", "/reminders.html");
    }
  } catch (err) {
    if (err.status === 401) { logout(); return; }
    content.innerHTML = `<div class="card card-danger">${err.message}</div>`;
  }
}

function render(list) {
  const empty = list.length === 0
    ? `<div class="card-empty card mt-4">
         <h3>${t("rem.empty")}</h3>
         <p class="muted">Tap the button above to add your medicines.</p>
       </div>`
    : list.map(r => {
        const stockClass = r.stockCount === 0 ? "out" : r.stockCount <= 5 ? "low" : "";
        const stockLabel = r.stockCount === 0 ? "Out of stock" : `${r.stockCount} left`;
        return `
          <div class="reminder-item">
            <div class="reminder-info">
              <div class="med-name">${esc(r.medName)}</div>
              <div class="med-meta">${esc(r.dosage)} • ${esc(r.frequency)}</div>
              <span class="stock-badge ${stockClass}">${stockLabel}</span>
            </div>
            <div class="row gap-2">
              <button class="btn" style="width:auto; padding:10px 14px; font-size:14px;"
                ${r.stockCount === 0 ? "disabled" : ""}
                data-take="${r._id}">${t("rem.takeNow")}</button>
              <button class="btn btn-ghost" style="width:auto; padding:8px;" data-del="${r._id}">🗑</button>
            </div>
          </div>`;
      }).join("");

  content.innerHTML = `
    <div class="row-between mb-3">
      <div>
        <h1>${t("rem.title")}</h1>
        <p class="muted">${list.length} ${t("rem.tracked")}</p>
      </div>
    </div>
    <button class="btn btn-lg" id="add-btn">+ ${t("rem.addNew")}</button>
    <div class="mt-4">${empty}</div>`;

  document.getElementById("add-btn").onclick = () => openModal();
  content.querySelectorAll("[data-take]").forEach(b => b.onclick = () => takeNow(b.dataset.take));
  content.querySelectorAll("[data-del]").forEach(b => b.onclick = () => deleteRem(b.dataset.del));
}

async function takeNow(id) {
  try {
    const res = await api.post(`/reminders/${id}/taken`);
    if (res.stockAlert === "OUT_OF_STOCK") showToast("⚠ Out of stock! Please buy more.", "error");
    else if (res.stockAlert === "RUNNING_LOW") showToast(`Only ${res.stockCount} left - please buy soon.`, "error");
    else showToast("Marked as taken!", "success");
    loadReminders();
  } catch (err) { showToast(err.message, "error"); }
}

async function deleteRem(id) {
  if (!confirm("Delete this reminder?")) return;
  try {
    await api.del(`/reminders/${id}`);
    showToast("Deleted", "success");
    loadReminders();
  } catch (err) { showToast(err.message, "error"); }
}

function openModal(prefill = {}) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="backdrop">
      <div class="modal" onclick="event.stopPropagation()">
        <h2>${t("rem.addNew")} <button class="close-btn" id="close-modal">✕</button></h2>
        <div class="input-group mt-3">
          <label>${t("rem.medName")}</label>
          <input class="input" id="m-name" value="${esc(prefill.medName || "")}" placeholder="e.g. Paracetamol" />
        </div>
        <div class="input-group">
          <label>${t("rem.dosage")}</label>
          <input class="input" id="m-dosage" placeholder="e.g. 1 tablet" />
        </div>
        <div class="input-group">
          <label>${t("rem.frequency")}</label>
          <select class="select" id="m-freq">
            <option value="once">Once a day</option>
            <option value="twice">Twice a day</option>
            <option value="thrice">Three times a day</option>
          </select>
        </div>
        <div class="input-group">
          <label>${t("rem.stock")}</label>
          <input class="input" id="m-stock" type="number" min="0" value="30" />
        </div>
        <button class="btn btn-lg mt-3" id="save-rem">Save</button>
      </div>
    </div>`;
  document.getElementById("backdrop").onclick = closeModal;
  document.getElementById("close-modal").onclick = closeModal;
  document.getElementById("save-rem").onclick = saveRem;
}
function closeModal() { modalRoot.innerHTML = ""; }

async function saveRem() {
  const medName = document.getElementById("m-name").value.trim();
  const dosage = document.getElementById("m-dosage").value.trim();
  const frequency = document.getElementById("m-freq").value;
  const stockCount = parseInt(document.getElementById("m-stock").value, 10) || 0;
  if (!medName || !dosage) { showToast("Please fill name and dosage", "error"); return; }
  try {
    await api.post("/reminders", { medName, dosage, frequency, stockCount, times: [] });
    showToast("Reminder added!", "success");
    closeModal();
    loadReminders();
  } catch (err) { showToast(err.message, "error"); }
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

loadReminders();
