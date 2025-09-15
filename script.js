(() => {
  const cfg = window.KARBA_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byId = id => document.getElementById(id);

  const statusEl = byId("status");
  const btn = byId("submitBtn");
  const form = byId("lead-form");
  const nameEl = byId("name");
  const emailEl = byId("email");
  const phoneEl = byId("phone");
  const serviceEl = byId("service");
  const messageEl = byId("message");

  byId("year").textContent = new Date().getFullYear();

  const setStatus = (txt, color) => {
    if (!statusEl) return;
    statusEl.textContent = txt || "";
    statusEl.style.color = color || "#ffb86b";
  };
  const disable = v => { if (btn) btn.disabled = !!v; };

  // 1) Health check
  const ping = async () => {
    if (!cfg.BACKEND_URL) {
      setStatus("Backend URL missing in config.js", "#ff6b6b");
      return;
    }
    try {
      const r = await fetch(cfg.BACKEND_URL + "/api/health");
      const j = await r.json();
      if (j && j.ok) setStatus("[HEALTH] Backend OK", "#47d17f");
      else setStatus("Backend health failed", "#ff6b6b");
    } catch {
      setStatus("Backend unreachable", "#ff6b6b");
    }
  };
  ping();

  // 2) Form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");
    disable(true);

    // Basic validation
    const name = (nameEl.value || "").trim();
    const email = (emailEl.value || "").trim();
    if (!name || !email) {
      setStatus("Please enter your name and email.", "#ff6b6b");
      disable(false);
      return;
    }

    // Get reCAPTCHA v3 token
    try {
      if (!window.grecaptcha || !cfg.RECAPTCHA_SITE_KEY) {
        throw new Error("reCAPTCHA not loaded");
      }
      await grecaptcha.ready();
      const recaptchaToken = await grecaptcha.execute(cfg.RECAPTCHA_SITE_KEY, { action: "lead" });

      setStatus("Submitting…", "#9bb0d9");

      const body = {
        name,
        email,
        phone: phoneEl.value || "",
        service: serviceEl.value || "Life Insurance",
        message: messageEl.value || "",
        recaptchaToken
      };

      const r = await fetch(cfg.BACKEND_URL + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const txt = await r.text();
      if (!r.ok) throw new Error(txt || "HTTP error");

      setStatus("Thanks — we’ll be in touch shortly.", "#47d17f");
      form.reset();
    } catch (err) {
      setStatus("Network or security error — please try again.", "#ff6b6b");
      console.error(err);
    } finally {
      disable(false);
    }
  });
})();
