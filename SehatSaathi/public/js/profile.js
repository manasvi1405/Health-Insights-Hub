// Profile page - user info + language + emergency contacts

if (!requireAuth()) throw new Error("not authenticated");
renderLayout("profile");

const content = document.getElementById("content");
let user = null;
let contacts = [];
let editing = false;

async function load() {
  try {
    [user, contacts] = await Promise.all([api.get("/users/me"), api.get("/contacts")]);
    setUser(user);
    if (user.language) setAppLanguage(user.language);
    render();
  } catch (err) {
    if (err.status === 401) { logout(); return; }
    content.innerHTML = `<div class="card card-danger">${err.message}</div>`;
  }
}

function render() {
  content.innerHTML = `
    <div class="row-between mb-3">
      <h1>${t("profile.title")}</h1>
      <button class="btn btn-ghost" style="width:auto;" id="logout-btn">${t("profile.logout")}</button>
    </div>

    <div class="card">
      ${editing ? renderEditForm() : renderInfo()}
    </div>

    <h2 class="mt-4">${t("profile.lang")}</h2>
    <select class="select" id="lang-select">
      ${["English","Hindi","Marathi","Tamil","Bengali"].map(l =>
        `<option value="${l}" ${getAppLanguage() === l ? "selected" : ""}>${l}</option>`
      ).join("")}
    </select>

    <h2 class="mt-4">${t("profile.contacts")}</h2>
    <div id="contacts-list">${renderContacts()}</div>
    <button class="btn mt-3" id="add-contact">+ ${t("profile.add")}</button>`;

  document.getElementById("logout-btn").onclick = logout;
  document.getElementById("lang-select").onchange = async (e) => {
    const lang = e.target.value;
    setAppLanguage(lang);
    try {
      await api.put("/users/me", { language: lang });
      showToast("Language updated", "success");
      render();
    } catch (err) { showToast(err.message, "error"); }
  };
  document.getElementById("add-contact").onclick = addContact;
  document.querySelectorAll("[data-del-contact]").forEach(b =>
    b.onclick = () => delContact(b.dataset.delContact));

  if (editing) {
    document.getElementById("save-profile").onclick = saveProfile;
    document.getElementById("cancel-edit").onclick = () => { editing = false; render(); };
  } else {
    document.getElementById("edit-btn").onclick = () => { editing = true; render(); };
  }
}

function renderInfo() {
  return `
    <div class="row-between mb-3">
      <div>
        <div style="font-size:22px; font-weight:700;">${esc(user.name || "Friend")}</div>
        <div class="muted">+91 ${esc(user.phone)}</div>
      </div>
      <button class="btn btn-outline" style="width:auto;" id="edit-btn">${t("profile.edit")}</button>
    </div>
    <div class="muted text-sm">${t("profile.age")}: ${user.age || "-"}</div>
    <div class="muted text-sm">${t("profile.blood")}: ${esc(user.bloodGroup) || "-"}</div>
    <div class="muted text-sm">${t("profile.address")}: ${esc(user.address) || "-"}</div>`;
}

function renderEditForm() {
  return `
    <div class="input-group">
      <label>${t("profile.name")}</label>
      <input class="input" id="f-name" value="${esc(user.name || "")}" />
    </div>
    <div class="input-group">
      <label>${t("profile.age")}</label>
      <input class="input" id="f-age" type="number" min="0" value="${user.age || ""}" />
    </div>
    <div class="input-group">
      <label>${t("profile.blood")}</label>
      <select class="select" id="f-blood">
        ${["","A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b =>
          `<option value="${b}" ${user.bloodGroup === b ? "selected" : ""}>${b || "Select"}</option>`
        ).join("")}
      </select>
    </div>
    <div class="input-group">
      <label>${t("profile.address")}</label>
      <textarea class="input textarea" id="f-address" rows="2">${esc(user.address || "")}</textarea>
    </div>
    <div class="btn-row">
      <button class="btn btn-outline flex-1" id="cancel-edit">${t("profile.cancel")}</button>
      <button class="btn flex-1" id="save-profile">${t("profile.save")}</button>
    </div>`;
}

function renderContacts() {
  if (contacts.length === 0) {
    return `<div class="card-empty card">No emergency contacts yet</div>`;
  }
  return contacts.map(c => `
    <div class="card row-between">
      <div>
        <div style="font-weight:700;">${esc(c.name)} ${c.isPrimary ? '<span style="color:var(--primary); font-size:12px;">(Primary)</span>' : ''}</div>
        <div class="muted text-sm">${esc(c.phone)} • ${esc(c.relation || "")}</div>
      </div>
      <button class="btn btn-ghost" style="width:auto;" data-del-contact="${c._id}">🗑</button>
    </div>`).join("");
}

async function saveProfile() {
  const body = {
    name: document.getElementById("f-name").value.trim(),
    age: parseInt(document.getElementById("f-age").value, 10) || undefined,
    bloodGroup: document.getElementById("f-blood").value,
    address: document.getElementById("f-address").value.trim(),
  };
  try {
    user = await api.put("/users/me", body);
    setUser(user);
    editing = false;
    showToast("Profile saved", "success");
    render();
  } catch (err) { showToast(err.message, "error"); }
}

async function addContact() {
  const name = prompt("Contact name:");
  if (!name) return;
  const phone = prompt("Phone (10 digits):");
  if (!phone) return;
  const relation = prompt("Relation (e.g. Son, Doctor):") || "";
  try {
    await api.post("/contacts", { name, phone, relation, isPrimary: contacts.length === 0 });
    showToast("Contact added", "success");
    contacts = await api.get("/contacts");
    render();
  } catch (err) { showToast(err.message, "error"); }
}

async function delContact(id) {
  if (!confirm("Remove this contact?")) return;
  try {
    await api.del(`/contacts/${id}`);
    contacts = await api.get("/contacts");
    render();
  } catch (err) { showToast(err.message, "error"); }
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

load();
