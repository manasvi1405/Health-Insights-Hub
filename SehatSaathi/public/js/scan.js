// Scan page - choose type → camera or upload → AI result with TTS

if (!requireAuth()) throw new Error("not authenticated");
renderLayout("scan");

const content = document.getElementById("content");
const fileInput = document.getElementById("file-input");
let pendingType = null;
let cameraStream = null;
let isSpeaking = false;

const SCAN_TYPES = [
  { type: "medicine",     labelKey: "scan.medicine",     descKey: "scan.medDesc",    iconClass: "medicine" },
  { type: "prescription", labelKey: "scan.prescription", descKey: "scan.presDesc",   iconClass: "prescription" },
  { type: "report",       labelKey: "scan.report",       descKey: "scan.reportDesc", iconClass: "report" },
];

function renderTypeSelection() {
  stopCameraIfRunning();
  content.innerHTML = `
    <h1>${t("scan.title")}</h1>
    <p class="muted text-lg mb-3">${t("scan.what")}</p>
    <div>
      ${SCAN_TYPES.map(s => `
        <button class="scan-card mb-3" data-type="${s.type}">
          <div class="scan-icon ${s.iconClass}">📷</div>
          <div class="flex-1">
            <div class="label">${t(s.labelKey)}</div>
            <div class="desc">${t(s.descKey)}</div>
          </div>
        </button>`).join("")}
    </div>
    <div class="card mt-4" style="background: var(--primary-light); border-color: var(--primary);">
      <p class="text-sm" style="color: var(--primary-dark);">
        AI will explain in your selected language. Tap "Listen" on the result to hear it.
      </p>
    </div>`;
  content.querySelectorAll(".scan-card").forEach(btn => {
    btn.addEventListener("click", () => renderInputPicker(btn.dataset.type));
  });
}

function renderInputPicker(type) {
  pendingType = type;
  content.innerHTML = `
    <div class="row-between mb-3">
      <h1 style="text-transform:capitalize;">Scan ${type}</h1>
      <button class="btn btn-ghost" style="width:auto;" id="back-to-types">✕</button>
    </div>
    <p class="muted">${t("scan.howAdd")}</p>
    <button class="scan-card mt-4" id="use-camera-btn">
      <div class="scan-icon medicine">📷</div>
      <div class="flex-1">
        <div class="label">${t("scan.useCamera")}</div>
        <div class="desc">Take a photo right now</div>
      </div>
    </button>
    <button class="scan-card mt-3" id="upload-btn">
      <div class="scan-icon" style="background:#475569;">⬆</div>
      <div class="flex-1">
        <div class="label">${t("scan.upload")}</div>
        <div class="desc">Choose from gallery or files</div>
      </div>
    </button>`;
  document.getElementById("back-to-types").onclick = renderTypeSelection;
  document.getElementById("use-camera-btn").onclick = () => startCamera(type);
  document.getElementById("upload-btn").onclick = () => fileInput.click();
}

// ---------- File upload ----------
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = ""; // reset so same file can be reselected
  if (!file || !pendingType) return;
  if (file.size > 10 * 1024 * 1024) {
    showToast("Image too large (max 10MB)", "error");
    return;
  }
  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image file", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const base64 = ev.target.result;
    const compressed = await compressImage(base64);
    await submitScan(compressed, pendingType);
  };
  reader.readAsDataURL(file);
});

// ---------- Camera ----------
async function startCamera(type) {
  pendingType = type;
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  } catch {
    showToast("Camera not available. Please use Upload Image.", "error");
    return;
  }
  content.innerHTML = "";
  const view = document.createElement("div");
  view.className = "camera-view";
  view.innerHTML = `
    <div class="camera-top">
      <span style="font-size:18px; font-weight:700; text-transform:capitalize;">Scan ${type}</span>
      <button id="cam-close" class="btn btn-ghost" style="width:auto; color:white;">✕</button>
    </div>
    <video id="cam-video" autoplay playsinline></video>
    <div class="camera-controls">
      <button id="cam-shutter" class="shutter">📷</button>
    </div>
    <canvas id="cam-canvas" class="hidden"></canvas>`;
  document.body.appendChild(view);
  const video = view.querySelector("#cam-video");
  video.srcObject = cameraStream;

  view.querySelector("#cam-close").onclick = () => { stopCameraIfRunning(); view.remove(); renderTypeSelection(); };
  view.querySelector("#cam-shutter").onclick = async () => {
    const canvas = view.querySelector("#cam-canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    stopCameraIfRunning();
    view.remove();
    await submitScan(base64, type);
  };
}

function stopCameraIfRunning() {
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
}

// ---------- Image compression (canvas) ----------
function compressImage(base64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const max = 1280;
      let w = img.width, h = img.height;
      if (w > max || h > max) {
        if (w > h) { h = (h / w) * max; w = max; }
        else { w = (w / h) * max; h = max; }
      }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

// ---------- Submit to backend ----------
async function submitScan(base64, type) {
  content.innerHTML = `
    <div class="loader-screen">
      <div class="spinner"></div>
      <h2>${t("scan.analyzing")}</h2>
      <p class="muted">${t("scan.wait")}</p>
    </div>`;
  try {
    const result = await api.post("/scans", { type, imageBase64: base64 });
    renderResult(result, base64);
  } catch (err) {
    console.error(err);
    showToast(err.message || "Could not analyze image", "error");
    renderTypeSelection();
  }
}

// ---------- Result ----------
function renderResult(result, imageBase64) {
  isSpeaking = false;
  stopSpeaking();
  content.innerHTML = `
    <div class="row-between mb-3">
      <h1>${t("scan.aiResult")}</h1>
      <button class="btn btn-ghost" style="width:auto;" id="result-close">✕</button>
    </div>
    <div class="card" style="background:#E8F5E9; border:2px solid #2E7D32;">
      <div style="font-weight:700; color:#1B5E20; text-transform:capitalize;">${escapeHtml(result.type)} Analyzed</div>
      <div class="text-sm" style="color:#2E7D32;">AI has reviewed your ${escapeHtml(result.type)}</div>
    </div>

    ${imageBase64 ? `<img src="${imageBase64}" alt="Scanned" class="result-image" />` : ""}

    <div class="card card-primary">
      <div class="row-between mb-3">
        <h3 style="margin:0; color: var(--primary);">${t("scan.whatFound")}</h3>
        <button id="listen-btn" class="btn" style="width:auto; padding:8px 16px;">🔊 ${t("scan.listen")}</button>
      </div>
      <div class="ai-text">${escapeHtml(result.aiInsight)}</div>
    </div>

    <div class="btn-row mt-4">
      <button class="btn btn-outline flex-1" id="scan-again-btn">${t("scan.again")}</button>
      ${(result.type === "medicine" || result.type === "prescription") ? `
        <a class="btn flex-1" href="/reminders.html?add=${encodeURIComponent((result.summary || "").replace(/^(Medicine|दवा|औषध):\\s*/i,"").split(/[\\s.,]/)[0] || "")}">
          + Add Reminder
        </a>` : ""}
    </div>`;

  document.getElementById("result-close").onclick = () => { stopSpeaking(); renderTypeSelection(); };
  document.getElementById("scan-again-btn").onclick = () => { stopSpeaking(); renderTypeSelection(); };

  const listenBtn = document.getElementById("listen-btn");
  listenBtn.onclick = () => {
    if (isSpeaking) {
      stopSpeaking(); isSpeaking = false;
      listenBtn.innerHTML = `🔊 ${t("scan.listen")}`;
      listenBtn.classList.remove("btn-danger");
    } else {
      isSpeaking = true;
      listenBtn.innerHTML = `⏹ ${t("scan.stop")}`;
      listenBtn.classList.add("btn-danger");
      speak(result.aiInsight, () => {
        isSpeaking = false;
        listenBtn.innerHTML = `🔊 ${t("scan.listen")}`;
        listenBtn.classList.remove("btn-danger");
      });
    }
  };
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

renderTypeSelection();
