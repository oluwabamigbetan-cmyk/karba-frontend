// script.js
(function () {
  const log = (...a) => console.log("[KARBA]", ...a);
  const fail = (box, msg, ...a) => { console.error("[KARBA]", msg, ...a); box.textContent = msg; };

  document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("lead-form");
    const statusBox = document.getElementById("form-status");
    const CFG = window.KARBA_CONFIG || {};

    // Basic config checks
    if (!CFG.BACKEND_URL) return fail(statusBox, "Setup error: BACKEND_URL missing.");
    if (!CFG.RECAPTCHA_SITE_KEY) return fail(statusBox, "Setup error: RECAPTCHA_SITE_KEY missing.");

    // Load reCAPTCHA v3 dynamically
    async function loadRecaptcha(siteKey) {
      return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
        s.async = true;
        s.defer = true;
        s.onload = () => {
          try { grecaptcha.ready(resolve); } catch (e) { reject(e); }
        };
        s.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
        document.head.appendChild(s);
      });
    }

    try {
      await loadRecaptcha(CFG.RECAPTCHA_SITE_KEY);
      log("reCAPTCHA loaded");
    } catch (e) {
      return fail(statusBox, "reCAPTCHA failed to load. Check site key & domain then hard-refresh.", e);
    }

    // (Optional) check backend health silently
    fetch(`${CFG.BACKEND_URL}/api/health`).catch(() => {});

    // Submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      statusBox.textContent = "Submitting…";

      try {
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
          console.error("Submit failed", res.status, text);
        }
      } catch (e2) {
        fail(statusBox, "Network error. Please try again.", e2);
      }
    });
  });
})();
