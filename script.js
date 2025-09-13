// script.js
(() => {
  const log = (...a) => console.log("[KARBA]", ...a);
  const err = (...a) => console.error("[KARBA]", ...a);

  // ----- config checks -----
  const CFG = window.KARBA_CONFIG || {};
  const BACKEND = CFG.BACKEND_URL || "";
  const SITE = CFG.RECAPTCHA_SITE_KEY || "";

  document.addEventListener("DOMContentLoaded", () => {
    log("DOM ready");
    const form = document.getElementById("lead-form");
    const statusBox = document.getElementById("form-status");

    if (!form) {
      err("No form with id='lead-form' found.");
      return;
    }
    if (!BACKEND) {
      statusBox.textContent = "Setup error: BACKEND_URL missing.";
      err("BACKEND_URL missing in config.");
      return;
    }
    if (!SITE) {
      statusBox.textContent = "Setup error: RECAPTCHA_SITE_KEY missing.";
      err("RECAPTCHA_SITE_KEY missing in config.");
      return;
    }

    // ----- load reCAPTCHA v3 -----
    let greLoaded;
    const waitForGre = new Promise((resolve, reject) => {
      greLoaded = { resolve, reject };
    });

    function loadRecaptcha(siteKey) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      grecaptcha.ready(resolve);
    };
    s.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(s);
  });
}
function injectRecaptcha() {
      if (window.grecaptcha) {
        // already present
        greLoaded.resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE)}`;
      s.async = true;
      s.defer = true;
      s.onload = () => {
        log("reCAPTCHA script loaded.");
        // grecaptcha.ready is async; resolve when ready
        window.grecaptcha.ready(() => {
          log("reCAPTCHA ready()");
          greLoaded.resolve();
        });
      };
      s.onerror = () => greLoaded.reject(new Error("Failed to load reCAPTCHA script"));
      document.head.appendChild(s);
    }
    injectRecaptcha();

    // Expose a tiny tester in the console
    window.KARBA = {
      config: CFG,
      async getToken() {
        await waitForGre;
        return window.grecaptcha.execute(SITE, { action: "lead" });
      }
    };

    // health check (optional, helpful)
    fetch(BACKEND + "/api/health")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(j => log("health:", j))
      .catch(e => err("health error:", e));

    // ----- submit handler -----
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      statusBox.textContent = "Submitting…";

      // gather fields
      const data = Object.fromEntries(new FormData(form).entries());

      try {
        await waitForGre; // ensure grecaptcha is ready
        const token = await window.grecaptcha.execute(SITE, { action: "lead" });
        log("token acquired (len):", token?.length);

        const res = await fetch(BACKEND + "/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, recaptchaToken: token })
        });

        const bodyText = await res.text();
        if (res.ok) {
          statusBox.textContent = "✅ Thank you! We will contact you shortly.";
          form.reset();
          log("lead ok:", bodyText);
        } else {
          statusBox.textContent = "Error " + res.status + ": " + bodyText;
          err("lead error:", res.status, bodyText);
        }
      } catch (e2) {
        statusBox.textContent = "Network/Setup error. Check Console.";
        err(e2);
      }
    });
  });
})();
