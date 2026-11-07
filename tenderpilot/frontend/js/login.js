// SMS one-time-code login (see docs/AUTH.md)
const CONFIG = {
  API_BASE: "",            // e.g. "https://api.tenderpilot.example" – same origin when empty
  DEMO_MODE: true,         // set to false once the backend /auth endpoints exist
  DEMO_CODE: "123456",
  RESEND_COOLDOWN: 60,     // seconds
  AFTER_LOGIN_URL: "index.html",
};

(() => {
  const $ = (id) => document.getElementById(id);
  const phoneStep = $("phoneStep"), codeStep = $("codeStep");
  const phoneInput = $("phone"), countryCode = $("countryCode");
  const otpInputs = [...document.querySelectorAll("#otp input")];
  const resendBtn = $("resendBtn");
  let e164 = "";
  let cooldownTimer;

  if (CONFIG.DEMO_MODE) $("demoNote").hidden = false;

  // ---------- API ----------
  async function api(path, body) {
    if (CONFIG.DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 700));
      if (path === "/auth/verify-code" && body.code !== CONFIG.DEMO_CODE) {
        return { ok: false, error: "That code is incorrect or has expired." };
      }
      return { ok: true };
    }
    try {
      const res = await fetch(CONFIG.API_BASE + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",           // session arrives as an HTTP-only cookie
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) return { ok: false, error: "Too many attempts. Please wait and try again." };
      if (!res.ok) return { ok: false, error: data.error || "That code is incorrect or has expired." };
      return { ok: true, ...data };
    } catch {
      return { ok: false, error: "Can't reach the server. Check your connection and try again." };
    }
  }

  function setLoading(btn, loading, label) {
    btn.disabled = loading;
    btn.innerHTML = loading ? '<span class="spinner"></span>' : label;
  }

  function normalizePhone() {
    let digits = phoneInput.value.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = digits.slice(1);   // 0712… → 712…
    const full = countryCode.value + digits;
    return /^\+[1-9]\d{7,14}$/.test(full) ? full : null;     // E.164
  }

  function showStep(step) {
    [phoneStep, codeStep].forEach((s) => s.classList.toggle("active", s === step));
  }

  function startCooldown() {
    let left = CONFIG.RESEND_COOLDOWN;
    resendBtn.disabled = true;
    resendBtn.textContent = `Resend in ${left}s`;
    clearInterval(cooldownTimer);
    cooldownTimer = setInterval(() => {
      left -= 1;
      if (left <= 0) { clearInterval(cooldownTimer); resendBtn.disabled = false; resendBtn.textContent = "Resend"; }
      else resendBtn.textContent = `Resend in ${left}s`;
    }, 1000);
  }

  async function requestCode() {
    return api("/auth/request-code", { phone: e164 });
  }

  // ---------- Step 1: phone ----------
  phoneStep.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("phoneError"), btn = $("sendBtn");
    err.textContent = "";
    phoneInput.classList.remove("invalid");
    const normalized = normalizePhone();
    if (!normalized) {
      err.textContent = "Please enter a valid phone number.";
      phoneInput.classList.add("invalid");
      return;
    }
    e164 = normalized;
    setLoading(btn, true);
    const res = await requestCode();
    setLoading(btn, false, "Send code");
    if (!res.ok) { err.textContent = res.error; return; }
    $("sentTo").textContent = e164;
    showStep(codeStep);
    otpInputs.forEach((i) => (i.value = ""));
    otpInputs[0].focus();
    startCooldown();
  });

  // ---------- Step 2: OTP inputs ----------
  otpInputs.forEach((input, idx) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(-1);
      input.classList.remove("invalid");
      if (input.value && idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
      if (otpInputs.every((i) => i.value)) codeStep.requestSubmit();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && idx > 0) otpInputs[idx - 1].focus();
      if (e.key === "ArrowLeft" && idx > 0) otpInputs[idx - 1].focus();
      if (e.key === "ArrowRight" && idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
    });
    input.addEventListener("paste", (e) => {
      const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
      if (!digits) return;
      e.preventDefault();
      digits.split("").forEach((d, i) => (otpInputs[i].value = d));
      otpInputs[Math.min(digits.length, 5)].focus();
      if (digits.length === 6) codeStep.requestSubmit();
    });
  });

  codeStep.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("codeError"), btn = $("verifyBtn");
    const code = otpInputs.map((i) => i.value).join("");
    err.textContent = "";
    if (code.length !== 6) { err.textContent = "Enter all 6 digits."; return; }
    if (btn.disabled) return;
    setLoading(btn, true);
    const res = await api("/auth/verify-code", { phone: e164, code });
    if (!res.ok) {
      setLoading(btn, false, "Verify &amp; log in");
      err.textContent = res.error;
      otpInputs.forEach((i) => { i.value = ""; i.classList.add("invalid"); });
      otpInputs[0].focus();
      return;
    }
    err.innerHTML = '<span class="success">✓ Logged in. Redirecting…</span>';
    setTimeout(() => (window.location.href = CONFIG.AFTER_LOGIN_URL), 900);
  });

  resendBtn.addEventListener("click", async () => {
    resendBtn.disabled = true;
    const res = await requestCode();
    $("codeError").innerHTML = res.ok ? '<span class="success">A new code is on its way.</span>' : res.error;
    startCooldown();
  });

  $("changeNumber").addEventListener("click", () => {
    clearInterval(cooldownTimer);
    showStep(phoneStep);
    phoneInput.focus();
  });
})();
