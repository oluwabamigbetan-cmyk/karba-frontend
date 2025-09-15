(() => {
  const $ = sel => document.querySelector(sel);
  const statusEl = $("#status");
  const form = $("#lead-form");
  const submitBtn = $("#submitBtn");

  const setStatus = (txt, type) => {
    statusEl.textContent = txt || "";
    statusEl.className = "status" + (type ? " " + type : "");
  };
  const disable = v => { if (submitBtn) submitBtn.disabled = v; };

  // Footer year
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  // Read config
  const CFG = (window && window.KARBA_CONFIG) ? window.KARBA_CONFIG : null;
  if (!CFG || !CFG.BACKEND_URL) {
    setStatus("Backend URL missing in config.js", "err");
    return;
  }
  if (!CFG.RECAPTCHA_SITE_KEY) {
    setStatus("reCAPTCHA site key missing in config.js", "err");
    return;
  }

  // Health check
  setStatus("Checking API…");
  fetch(CFG.BACKEND_URL + "/api/health")
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(() => setStatus("[HEALTH] Backend OK", "ok"))
    .catch(() => setStatus("Backend not reachable. Check BACKEND_URL.", "err"));

  // --- reCAPTCHA v3 loader (correct way) ---
  let recaptchaReady = null;
  function loadRecaptcha() {
    if (recaptchaReady) return recaptchaReady;
    recaptchaReady = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://www.google.com/recaptcha/api.js?render=" +
              encodeURIComponent(CFG.RECAPTCHA_SITE_KEY);
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
      document.head.appendChild(s);
    }).then(() => new Promise(res => {
      // grecaptcha.ready exists only after script loads
      const chk = setInterval(() => {
        if (window.grecaptcha && typeof grecaptcha.ready === "function") {
          clearInterval(chk);
          grecaptcha.ready(res);
        }
      }, 50);
      // (no timeout; the submit handler will handle errors)
    }));
    return recaptchaReady;
  }

  async function getRecaptchaToken() {
    await loadRecaptcha();
    return grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action: "lead" });
  }

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");
    disable(true);

    const name = $("#name")?.value.trim();
    const email = $("#email")?.value.trim();
    const phone = $("#phone")?.value.trim();
    const service = $("#service")?.value.trim();
    const message = $("#message")?.value.trim();

    if (!name || !email) {
      setStatus("Please enter your name and email.", "err");
      disable(false);
      return;
    }

    try {
      setStatus("Securing…");
      const recaptchaToken = await getRecaptchaToken().catch(err => {
        throw new Error("reCAPTCHA not available: " + err.message);
      });

      setStatus("Submitting…");
      const res = await fetch(CFG.BACKEND_URL + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, service, message, recaptchaToken })
      });

      const text = await res.text();
      if (!res.ok) {
        // Show backend reason to the user (helps debugging)
        let msg = "HTTP error";
        try { const j = JSON.parse(text); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }

      setStatus("Thanks — we’ll be in touch shortly.", "ok");
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus("Network or security error — " + err.message, "err");
    } finally {
      disable(false);
    }
  });
})();
