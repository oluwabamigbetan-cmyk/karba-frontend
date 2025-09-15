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
  // In script.js – inside DOMContentLoaded, replace your submit handler with this:

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nameEl = q('input[name="name"]', form);
  const emailEl = q('input[name="email"]', form);
  const phoneEl = q('input[name="phone"]', form);
  const serviceEl = q('select[name="service"]', form);
  const messageEl = q('textarea[name="message"]', form);

  const setStatus = (txt, color) => {
    if (!statusEl) return;
    statusEl.textContent = txt;
    statusEl.style.color = color || "";
  };

  // simple validation
  const name = (nameEl.value || "").trim();
  const email = (emailEl.value || "").trim();
  if (!name || !email) {
    setStatus("Please enter your name and email.");
    return;
  }

  // get v3 token with 5s timeout
  let token;
  try {
    await withTimeout(
      new Promise((resolve, reject) => {
        grecaptcha.ready(async () => {
          try {
            const t = await grecaptcha.execute(window.KARBA_CONFIG.RECAPTCHA_SITE_KEY, { action: "lead" });
            resolve(t);
          } catch (err) {
            reject(err);
          }
        });
      }),
      5000,
      "reCAPTCHA timed out"
    ).then(t => token = t);
  } catch (err) {
    console.error(err);
    setStatus("reCAPTCHA failed. Please refresh and try again.", "tomato");
    return;
  }

  // send to API
  const body = {
    name,
    email,
    phone: (phoneEl.value || "").trim(),
    service: (serviceEl.value || "").trim(),
    message: (messageEl.value || "").trim(),
    recaptchaToken: token
  };

  btn.disabled = true;
  btn.textContent = "Submitting…";
  setStatus("");

  try {
    const r = await fetch(window.KARBA_CONFIG.BACKEND_URL + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      // show server reason to help debug
      setStatus(data.message || data.reason || `Submit failed (HTTP ${r.status}).`, "tomato");
      return;
    }

    setStatus("Thanks — we'll be in touch shortly.", "limegreen");
    form.reset();
  } catch (err) {
    console.error(err);
    setStatus("Network error — please try again.", "tomato");
  } finally {
    btn.disabled = false;
    btn.textContent = "Submit";
  }
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
