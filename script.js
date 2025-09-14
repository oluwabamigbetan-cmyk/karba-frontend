/* script.js — KARBA site */
// IMPORTANT: config.js must load BEFORE this file and define:
// window.KARBA_CONFIG = { BACKEND_URL: "https://…", RECAPTCHA_SITE_KEY: "…" };

(function () {
  "use strict";

  // ---------- utilities ----------
  const CFG = (window && window.KARBA_CONFIG) || {};
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Small status helper for the form
  function setStatus(msg, ok=false) {
    const el = $("#form-status");
    if (!el) return;
    el.textContent = msg;
    el.className = ok ? "ok" : "err";
  }

  // ---------- 1) HERO image rotator ----------
  // Put your images in /assets with these exact names (or edit array):
  const heroImages = [
    "/assets/hero-1.jpg",   // Nigerian family (your pick)
    "/assets/hero-2.jpg"    // alternate similar tone
    "/assets/hero-3.jpg",   // CAC certificate
  "/assets/hero-4.jpg"    // second professional image
  ];

  // Optional: preload to avoid first-fade flicker
  heroImages.forEach(src => { const i = new Image(); i.src = src; });

  const heroImg = $("#heroImg"); // <img id="heroImg"> in your HTML
  if (heroImg && heroImages.length) {
    let idx = 0;
    heroImg.src = heroImages[idx];

    setInterval(() => {
      idx = (idx + 1) % heroImages.length;
      // simple fade out/in (requires CSS: #heroImg {transition:opacity .25s})
      heroImg.style.opacity = "0";
      setTimeout(() => {
        heroImg.src = heroImages[idx];
        heroImg.style.opacity = "1";
      }, 250);
    }, 6000);
  }

  // ---------- 2) /api/health check (left status rail) ----------
  const healthEl = $("#health");
  function pingHealth() {
    if (!CFG.BACKEND_URL) return;
    fetch(CFG.BACKEND_URL + "/api/health")
      .then(r => r.json())
      .then(j => {
        if (healthEl) healthEl.textContent = "API OK — " + (j.time || "");
      })
      .catch(() => {
        if (healthEl) healthEl.textContent = "API unreachable";
      });
  }
  pingHealth();
  // ping every 60s in case Render idles
  setInterval(pingHealth, 60000);

  // ---------- 3) Lead form with reCAPTCHA v3 ----------
  const form = $("#lead-form");
  if (form) {
    const btn = $("#submitBtn") || form.querySelector('button[type="submit"], input[type="submit"]');

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // basic front-end validation
      const fullname = (form.fullname?.value || "").trim();
      const email    = (form.email?.value || "").trim();
      const phone    = (form.phone?.value || "").trim();
      const service  = (form.service?.value || "").trim();
      const message  = (form.message?.value || "").trim();

      if (!fullname || !email || !service) {
        setStatus("Please fill your name, email and service of interest.");
        return;
      }

      // reCAPTCHA must be present and configured
      if (typeof grecaptcha === "undefined" || !CFG.RECAPTCHA_SITE_KEY) {
        setStatus("Could not connect to the security service. Please try again.");
        return;
      }

      // UI state
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      setStatus("Submitting…");

      // ensure API is reachable (optional, but gives nicer UX)
      try {
        await fetch(CFG.BACKEND_URL + "/api/health", { cache: "no-store" });
      } catch {
        if (btn) { btn.disabled = false; btn.textContent = "Submit"; }
        setStatus("Network error. Please try again.");
        return;
      }

      // get reCAPTCHA token
      let token;
      try {
        await grecaptcha.ready();
        token = await grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action: "lead" });
        if (!token || token.length < 100) throw new Error("Empty token");
      } catch (err) {
        console.error("reCAPTCHA error:", err);
        if (btn) { btn.disabled = false; btn.textContent = "Submit"; }
        setStatus("Verification failed. Please retry.");
        return;
      }

      // send to backend
      const body = {
        name: fullname,
        email,
        phone,
        service,
        message,
        recaptchaToken: token
      };

      try {
        const r = await fetch(CFG.BACKEND_URL + "/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j.ok === false) {
          throw new Error(j.message || "Server error");
        }
        setStatus("Thanks — we’ll be in touch shortly.", true);
        form.reset();
      } catch (err) {
        console.error("LEAD FAIL:", err);
        setStatus("Network error. Please try again.");
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Submit"; }
      }
    });
  }

  // ---------- 4) Optional: swap favicon if missing ----------
  // If you put /assets/favicon.ico in the repo, you can keep this or remove it.
  const fav = $('link[rel="icon"]');
  if (!fav) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = "/assets/favicon.ico";
    document.head.appendChild(link);
  }
})();
