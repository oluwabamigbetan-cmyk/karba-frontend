// script.js
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("lead-form");
  const statusBox = document.getElementById("form-status");
  const CFG = window.KARBA_CONFIG || {};

  // --- Guard rails (show clear setup errors on the page) ---
  if (!CFG.BACKEND_URL) {
    console.error("BACKEND_URL missing");
    if (statusBox) statusBox.textContent = "Setup error: BACKEND_URL missing.";
    return;
  }
  if (!CFG.RECAPTCHA_SITE_KEY) {
    console.error("RECAPTCHA_SITE_KEY missing");
    if (statusBox) statusBox.textContent = "Setup error: RECAPTCHA_SITE_KEY missing.";
    return;
  }

  // --- Load reCAPTCHA v3 dynamically ---
  function loadRecaptcha(siteKey) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      s.async = true;
      s.defer = true;
      s.onload = () => {
        try {
          grecaptcha.ready(() => resolve());
        } catch (e) {
          reject(e);
        }
      };
      s.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
      document.head.appendChild(s);
    });
  }

  try {
    await loadRecaptcha(CFG.RECAPTCHA_SITE_KEY);
    console.log("[KARBA] reCAPTCHA loaded");
  } catch (e) {
    console.error(e);
    if (statusBox) statusBox.textContent = "reCAPTCHA failed to load. Refresh and try again.";
    return;
  }

  // --- Submit handler ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusBox.textContent = "Submitting…";

    try {
      // Get a v3 token for action "lead"
      const recaptchaToken = await grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action: "lead" });

      const data = Object.fromEntries(new FormData(form).entries());
      const res = await fetch(`${CFG.BACKEND_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, recaptchaToken })
      });

      const text = await res.text();
      if (res.ok) {
        statusBox.textContent = "Thank you! We will contact you shortly.";
        form.reset();
      } else {
        statusBox.textContent = `Error ${res.status}: ${text}`;
      }
    } catch (err) {
      console.error(err);
      statusBox.textContent = "Network error. Please try again.";
    }
  });
});
