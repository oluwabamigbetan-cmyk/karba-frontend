(() => {
  const CFG = window.KARBA_CONFIG || {};
  const $  = (s, p = document) => p.querySelector(s);
  
  // ---- status helpers
  const statusEl = $("#status");
  const setStatus = (msg, color) => {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.style.color = color || "";
  };

  // ---- simple button toggler
  const btn = $("#submit-btn");
  const disable = (on, label) => {
    if (!btn) return;
    btn.disabled = !!on;
    btn.textContent = on ? (label || "Submitting…") : "Submit";
  };

  // ---- sanity checks visible on page
  if (!CFG.BACKEND_URL) {
    setStatus("Backend URL missing in config.js", "#f66");
  }

  // ---- ping backend /api/health
  const health = async () => {
    if (!CFG.BACKEND_URL) return;
    try {
      const r = await fetch(`${CFG.BACKEND_URL}/api/health`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      setStatus("[HEALTH] Backend OK", "#9f9");
    } catch (e) {
      setStatus("Backend not reachable. Check BACKEND_URL or CORS.", "#f66");
    }
  };
  health();

  // ---- get a reCAPTCHA v3 token (waits until script is ready)
  async function getRecaptchaToken(action = "lead") {
    const siteKey = CFG.RECAPTCHA_SITE_KEY;
    if (!siteKey) throw new Error("Missing RECAPTCHA_SITE_KEY in config.js");

    // wait until grecaptcha exists & ready()
    await new Promise((res, rej) => {
      const start = Date.now();
      (function wait() {
        if (window.grecaptcha && typeof window.grecaptcha.ready === "function") {
          window.grecaptcha.ready(res);
        } else if (Date.now() - start > 12000) {
          rej(new Error("reCAPTCHA loader never arrived"));
        } else {
          setTimeout(wait, 120);
        }
      })();
    });

    // execute
    return await window.grecaptcha.execute(siteKey, { action });
  }

  // ---- form submit
  const form = $("#lead-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // basic validation
      const nameEl = $("#name");
      const emailEl = $("#email");
      if (!nameEl.value.trim() || !emailEl.value.trim()) {
        setStatus("Please enter your name and email.", "#f66");
        return;
      }

      try {
        disable(true, "Securing…");
        setStatus("Getting security token…");

        const token = await getRecaptchaToken("lead");

        const body = {
          name: nameEl.value.trim(),
          email: emailEl.value.trim(),
          phone: ($("#phone")?.value || "").trim(),
          service: $("#service")?.value || "",
          message: ($("#message")?.value || "").trim(),
          recaptchaToken: token
        };

        setStatus("Submitting…");
        const r = await fetch(`${CFG.BACKEND_URL}/api/leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        const text = await r.text();
        if (!r.ok) throw new Error(text || `HTTP ${r.status}`);

        setStatus("Thanks — we’ll be in touch shortly.", "#9f9");
        form.reset();
      } catch (err) {
        console.error(err);
        // Two most common causes:
        // 1) reCAPTCHA not configured for your domain -> fix key/domain in Google admin
        // 2) CORS block on backend -> update CORS_ORIGINS env to include your Vercel URL
        setStatus("Network or security error — please try again.", "#f66");
      } finally {
        disable(false);
      }
    });
  }
})();
