(() => {
  const $ = sel => document.querySelector(sel);
  const statusEl = $("#status");
  const form = $("#lead-form");
  const submitBtn = $("#submitBtn");

  const setStatus = (txt, type) => {
    statusEl.textContent = txt || "";
    statusEl.className = "status" + (type ? " " + type : "");
  };
  const disable = v => { submitBtn.disabled = v; };

  // Footer year
  $("#year").textContent = new Date().getFullYear();

  // Guard: config present
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

  // Ensure grecaptcha is ready
  function getRecaptchaToken() {
    return new Promise((resolve, reject) => {
      let waited = 0;
      const iv = setInterval(() => {
        waited += 100;
        if (window.grecaptcha && typeof grecaptcha.ready === "function") {
          clearInterval(iv);
          grecaptcha.ready(async () => {
            try {
              const token = await grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action: "lead" });
              resolve(token);
            } catch (e) {
              reject(new Error("reCAPTCHA execute failed"));
            }
          });
        } else if (waited > 8000) {
          clearInterval(iv);
          reject(new Error("reCAPTCHA not loaded"));
        }
      }, 100);
    });
  }

  // Submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");
    disable(true);

    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const phone = $("#phone").value.trim();
    const service = $("#service").value.trim();
    const message = $("#message").value.trim();

    if (!name || !email) {
      setStatus("Please enter your name and email.", "err");
      disable(false);
      return;
    }

    try {
      setStatus("Securing…");
      const recaptchaToken = await getRecaptchaToken();

      setStatus("Submitting…");
      const res = await fetch(CFG.BACKEND_URL + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, service, message, recaptchaToken })
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "HTTP error");

      setStatus("Thanks — we’ll be in touch shortly.", "ok");
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus("Network or security error — please try again.", "err");
    } finally {
      disable(false);
    }
  });
})();
