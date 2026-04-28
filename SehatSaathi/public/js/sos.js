// SOS page - get geolocation and notify emergency contacts

if (!requireAuth()) throw new Error("not authenticated");
renderLayout("home"); // keep "home" highlighted for nav consistency

const content = document.getElementById("content");

content.innerHTML = `
  <h1 style="color: var(--danger);">${t("sos.title")}</h1>
  <p class="text-lg mt-2 mb-4">${t("sos.help")}</p>

  <button id="sos-btn" class="btn btn-danger btn-lg" style="height:80px; font-size:22px;">
    ${t("sos.send")}
  </button>

  <div id="status" class="mt-4"></div>

  <a href="/profile.html" class="btn btn-outline mt-4">Manage emergency contacts</a>`;

document.getElementById("sos-btn").addEventListener("click", async () => {
  const status = document.getElementById("status");
  status.innerHTML = `<div class="card"><div class="spinner" style="width:32px; height:32px;"></div><p class="text-center mt-2">Getting your location...</p></div>`;

  if (!navigator.geolocation) {
    status.innerHTML = `<div class="card card-danger">Geolocation not supported on this device.</div>`;
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const res = await api.post("/sos", {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        message: "I need help!",
      });
      status.innerHTML = `
        <div class="card" style="background:#E8F5E9; border:2px solid var(--success);">
          <h3 style="color: var(--success);">✓ Alert Sent</h3>
          <p>${res.message}</p>
          <a href="${res.locationLink}" target="_blank" class="btn btn-outline mt-3">View location on map</a>
        </div>`;
    } catch (err) {
      status.innerHTML = `<div class="card card-danger">${err.message}</div>`;
    }
  }, (err) => {
    status.innerHTML = `<div class="card card-danger">Could not get location: ${err.message}. Please allow location access.</div>`;
  }, { enableHighAccuracy: true, timeout: 10000 });
});
