// Login page logic - phone OTP flow

// If already logged in, skip to home
if (getToken()) {
  window.location.href = "/home.html";
}

const phoneStep = document.getElementById("phone-step");
const otpStep = document.getElementById("otp-step");
const phoneInput = document.getElementById("phone");
const otpInput = document.getElementById("otp");
const nameInput = document.getElementById("name");
const sendBtn = document.getElementById("send-otp-btn");
const verifyBtn = document.getElementById("verify-btn");
const backBtn = document.getElementById("back-btn");

let currentPhone = "";

sendBtn.addEventListener("click", async () => {
  const phone = phoneInput.value.trim();
  if (phone.length !== 10) {
    showToast("Please enter a valid 10-digit mobile number", "error");
    return;
  }
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";
  try {
    const res = await api.post("/auth/send-otp", { phone });
    currentPhone = phone;
    phoneStep.classList.add("hidden");
    otpStep.classList.remove("hidden");
    showToast(res.message || "OTP sent", "success");
  } catch (err) {
    showToast(err.message || "Could not send OTP", "error");
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send OTP";
  }
});

verifyBtn.addEventListener("click", async () => {
  const otp = otpInput.value.trim();
  const name = nameInput.value.trim();
  if (otp.length !== 6) {
    showToast("Please enter the 6-digit OTP", "error");
    return;
  }
  verifyBtn.disabled = true;
  verifyBtn.textContent = "Verifying...";
  try {
    const res = await api.post("/auth/verify-otp", { phone: currentPhone, otp, name });
    setToken(res.token);
    setUser(res.user);
    if (res.user?.language) setAppLanguage(res.user.language);
    // First-time user picks language, others go straight home
    if (!res.user?.profileComplete || !localStorage.getItem("sehat_lang")) {
      window.location.href = "/language.html";
    } else {
      window.location.href = "/home.html";
    }
  } catch (err) {
    showToast(err.message || "Login failed", "error");
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.textContent = "Verify & Login";
  }
});

backBtn.addEventListener("click", () => {
  otpStep.classList.add("hidden");
  phoneStep.classList.remove("hidden");
  otpInput.value = "";
});
