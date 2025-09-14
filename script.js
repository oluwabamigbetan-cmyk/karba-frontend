// script.js  —  KARBA landing page logic (frontend)
// Works with config.js (window.KARBA_CONFIG) and a Render Node backend.

// ===== tiny helpers =========================================================
const $ = (sel, root = document) => root.querySelector(sel);
const delay = (ms) => new Promise(r => setTimeout(r, ms));

function setStatus(msg, type = "info") {
  // Expects an element with id="form-status" in your HTML
  const box = $("#form-status");
  if (!box) return;
  box.textContent = msg;
  box.dataset.type = type; // let CSS colorize if you want
}

// ===== reCAPTCHA loader (v3, invisible) ====================================
function loadRecaptcha(siteKey) {
  // If already present, reuse
  if (window.grecaptcha && window.grecaptcha.execute) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      // wait for grecaptcha.ready to exist
      let tries = 0;
      (function waitReady() {
        if (window.grecaptcha && window.grecaptcha.ready) {
          resolve();
        } else if (tries++ < 50) {
          setTimeout(waitReady, 100);
        } else {
          reject(new Error("grecaptcha failed to initialize"));
        }
      })();
    };
    s.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
    document.head.appendChild(s);
  });
}

async function recaptchaToken(siteKey, action = "lead") {
  await new Promise((r) => grecaptcha.ready(r));
  return grecaptcha.execute(siteKey, { action });
}

// ===== main ================================================================
document.addEventListener("DOMContentLoaded", async () => {
  const CFG = window.KARBA_CONFIG || {};
  const BACKEND = CFG.BACKEND_URL;
  const SITE_KEY = CFG.RECAPTCHA_SITE_KEY;

  // Guard rails – show clear setup errors on the page
  if (!BACKEND) {
    console.error("[KARBA] BACKEND_URL missing in config.js");
    setStatus("Setup error: BACKEND_URL missing.", "error");
    return;
  }
  if (!SITE_KEY) {
    console.error("[KARBA] RECAPTCHA_SITE_KEY missing in config.js");
    setStatus("Setup error: RECAPTCHA_SITE_KEY missing.", "error");
    return;
  }

  console.log("[KARBA_CONFIG]", CFG);

  // 1) Health check (optional but helpful)
  try {
    const r = await fetch(`${BACKEND}/api/health`, { method: "GET" });
    if (!r.ok) throw new Error(`Health ${r.status}`);
    const j = await r.json().catch(() => ({}));
    console.log("[HEALTH]", j);
  } catch (err) {
    console.warn("[KARBA] Backend health check failed:", err);
    // Don’t block the form because of a transient health miss
  }

  // 2) Load reCAPTCHA
  try {
    await loadRecaptcha(SITE_KEY);
    console.log("[KARBA] reCAPTCHA loaded");
  } catch (err) {
    console.error("[KARBA] reCAPTCHA failed to load:", err);
    setStatus("reCAPTCHA failed to load. Refresh and try again.", "error");
    return;
  }

  // 3) Wire up form submit
  const form = $("#lead-form");
  if (!form) {
    console.warn('[KARBA] No form with id="lead-form" found.');
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Basic front-end validation (you can expand if you like)
const name = document.getElementById("name").value.trim();
const email = document.getElementById("email").value.trim();
const phone = document.getElementById("phone").value.trim();
const service = document.getElementById("service").value;
const message = document.getElementById("message").value.trim();

    const payload = {
  name,
  email,
  phone,
  service,
  message,
  recaptchaToken: token
};

    setStatus("Submitting…", "info");

    try {
      // 3a) get reCAPTCHA v3 token
      const token = await recaptchaToken(SITE_KEY, "lead");

      // 3b) send to backend
      const payload = { name, email, phone, service, message, recaptchaToken: token };

      const res = await fetch(`${BACKEND}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 3c) handle reply
      const text = await res.text(); // read first; backend usually returns JSON
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (res.ok) {
        setStatus("Thank you! We will contact you shortly.", "success");
        form.reset();
      } else {
        // show backend error message if any
        const msg = data?.message || data?.error || `Error ${res.status}`;
        setStatus(`Error: ${msg}`, "error");
      }
    } catch (err) {
      console.error("[KARBA] submit error:", err);
      setStatus("Network error. Please try again.", "error");
    }
  });

  // Optional: gentle UX hint if user clicks submit too fast after load
  await delay(400);
  const btn = form.querySelector('[type="submit"]');
  if (btn) btn.disabled = false;
});
