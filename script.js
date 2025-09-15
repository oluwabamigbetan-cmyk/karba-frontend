(() => {
  const cfg = window.KARBA_CONFIG || {};
  const $ = s => document.querySelector(s);
  const byId = id => document.getElementById(id);
  const statusEl = byId("status");
  const setStatus = (t, color) => { if(!statusEl) return; statusEl.textContent = t||""; statusEl.style.color = color||""; };
  const disable = v => { const b = byId("submitBtn"); if(b) b.disabled = !!v; };

  // Year
  const y = byId("year"); if (y) y.textContent = new Date().getFullYear();

  // Health ping
  (async () => {
    if (!cfg.BACKEND_URL) { setStatus("Backend URL missing in config.js","#ff6b6b"); return; }
    try {
      const r = await fetch(cfg.BACKEND_URL + "/api/health");
      const j = await r.json().catch(()=>({}));
      setStatus(j && j.ok ? "[HEALTH] Backend OK" : "Backend health failed", j && j.ok ? "#47d17f" : "#ff6b6b");
    } catch {
      setStatus("Backend unreachable", "#ff6b6b");
    }
  })();

  // Form submit
  const form = byId("lead-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = (byId("name").value||"").trim();
    const email = (byId("email").value||"").trim();
    const phone = byId("phone").value||"";
    const service = byId("service").value||"Life Insurance";
    const message = byId("message").value||"";
    if (!name || !email) { setStatus("Please enter your name and email.", "#ff6b6b"); return; }

    try {
      disable(true); setStatus("Securing…");
      if (!window.grecaptcha || !cfg.RECAPTCHA_SITE_KEY) throw new Error("reCAPTCHA not loaded");
      await grecaptcha.ready();
      const recaptchaToken = await grecaptcha.execute(cfg.RECAPTCHA_SITE_KEY, { action: "lead" });

      setStatus("Submitting…", "#9bb0d9");
      const r = await fetch(cfg.BACKEND_URL + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, service, message, recaptchaToken })
      });
      const text = await r.text();
      if (!r.ok) throw new Error(text || "HTTP error");
      setStatus("Thanks — we’ll be in touch shortly.", "#47d17f");
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus("Network or security error — please try again.", "#ff6b6b");
    } finally {
      disable(false);
    }
  });
})();
(() => {
  const cfg = window.KARBA_CONFIG || {};
  const $ = s => document.querySelector(s);
  const byId = id => document.getElementById(id);
  const statusEl = byId("status");
  const setStatus = (t, color) => { if(!statusEl) return; statusEl.textContent = t||""; statusEl.style.color = color||""; };
  const disable = v => { const b = byId("submitBtn"); if(b) b.disabled = !!v; };

  // Year
  const y = byId("year"); if (y) y.textContent = new Date().getFullYear();

  // Health ping
  (async () => {
    if (!cfg.BACKEND_URL) { setStatus("Backend URL missing in config.js","#ff6b6b"); return; }
    try {
      const r = await fetch(cfg.BACKEND_URL + "/api/health");
      const j = await r.json().catch(()=>({}));
      setStatus(j && j.ok ? "[HEALTH] Backend OK" : "Backend health failed", j && j.ok ? "#47d17f" : "#ff6b6b");
    } catch {
      setStatus("Backend unreachable", "#ff6b6b");
    }
  })();

  // Form submit
  const form = byId("lead-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = (byId("name").value||"").trim();
    const email = (byId("email").value||"").trim();
    const phone = byId("phone").value||"";
    const service = byId("service").value||"Life Insurance";
    const message = byId("message").value||"";
    if (!name || !email) { setStatus("Please enter your name and email.", "#ff6b6b"); return; }

    try {
      disable(true); setStatus("Securing…");
      if (!window.grecaptcha || !cfg.RECAPTCHA_SITE_KEY) throw new Error("reCAPTCHA not loaded");
      await grecaptcha.ready();
      const recaptchaToken = await grecaptcha.execute(cfg.RECAPTCHA_SITE_KEY, { action: "lead" });

      setStatus("Submitting…", "#9bb0d9");
      const r = await fetch(cfg.BACKEND_URL + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, service, message, recaptchaToken })
      });
      const text = await r.text();
      if (!r.ok) throw new Error(text || "HTTP error");
      setStatus("Thanks — we’ll be in touch shortly.", "#47d17f");
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus("Network or security error — please try again.", "#ff6b6b");
    } finally {
      disable(false);
    }
  });
})();
