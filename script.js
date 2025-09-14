// script.js — hero slider + health ping + reCAPTCHA v3 + robust lead submit
(() => {
  const CFG = window.KARBA_CONFIG || {};
  const $ = (sel, p = document) => p.querySelector(sel);
  const $$ = (sel, p = document) => [...p.querySelectorAll(sel)];

  // ---------- HERO SLIDER ----------
  function startHeroSlider() {
    const slides = $$(".hero__img");
    if (!slides.length) return;
    let i = 0;
    slides[0].classList.add("is-active");
    setInterval(() => {
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    }, 5500);
  }

  // ---------- STATUS UI ----------
  const statusEl = $("#status");
  const setStatus = (txt, color) => {
    if (!statusEl) return;
    statusEl.textContent = txt;
    statusEl.style.color = color || "";
  };

  // ---------- HEALTH CHECK ----------
  async function healthPing() {
    if (!CFG.BACKEND_URL) {
      setStatus("Backend URL missing in config.js", "#ffb4b4");
      return;
    }
    try {
      const r = await fetch(`${CFG.BACKEND_URL}/api/health`, { cache: "no-store" });
      const j = await r.json();
      setStatus(j.ok ? `API OK — ${j.time}` : "API unreachable");
    } catch {
      setStatus("API unreachable");
    }
  }

  // ---------- reCAPTCHA v3 (explicit) ----------
  let grecaptchaWidgetId = null;
  function loadRecaptchaExplicit() {
    return new Promise((resolve) => {
      const tryInit = () => {
        if (!window.grecaptcha || !CFG.RECAPTCHA_SITE_KEY) return setTimeout(tryInit, 150);
        // Create an invisible widget we can execute()
        grecaptchaWidgetId = window.grecaptcha.render("recaptcha-badge-host", {
          sitekey: CFG.RECAPTCHA_SITE_KEY,
          size: "invisible",
          badge: "bottomright"
        });
        resolve();
      };
      tryInit();
    });
  }
  async function getRecaptchaToken() {
    if (!window.grecaptcha || grecaptchaWidgetId === null) throw new Error("reCAPTCHA not ready");
    // executes the invisible widget; action is optional metadata
    return await window.grecaptcha.execute(grecaptchaWidgetId, { action: "lead" });
  }

  // ---------- FORM SUBMIT ----------
  function wireForm() {
    const form = $("#lead-form");
    const btn = $("#submitBtn");
    if (!form || !btn) return;

    const disable = (v) => { btn.disabled = !!v; btn.textContent = v ? "Sending…" : "Submit"; };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get("name") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();

      if (!name || !email) {
        setStatus("Please enter your name and email.");
        return;
      }

      disable(true);
      setStatus("Securing…");

      try {
        const recaptchaToken = await getRecaptchaToken();

        const body = {
          name,
          email,
          phone: (fd.get("phone") || "").toString().trim(),
          service: (fd.get("service") || "").toString().trim(),
          message: (fd.get("message") || "").toString().trim(),
          recaptchaToken
        };

        const r = await fetch(`${CFG.BACKEND_URL}/api/leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        const text = await r.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { ok: r.ok, message: text }; }

        if (!r.ok || !data.ok) {
          throw new Error(data.message || `HTTP ${r.status}`);
        }

        setStatus("Thanks — we’ll be in touch shortly.");
        form.reset();
      } catch (err) {
        console.error(err);
        setStatus("Network error — please try again.");
      } finally {
        disable(false);
      }
    });
  }

  // ---------- INIT ----------
  document.addEventListener("DOMContentLoaded", async () => {
    startHeroSlider();
    await loadRecaptchaExplicit();
    wireForm();
    healthPing();
  });
})();
