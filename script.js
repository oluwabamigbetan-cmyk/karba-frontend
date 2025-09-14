// script.js — robust form + reCAPTCHA v3 + health check + hero slider
(() => {
  const CFG = window.KARBA_CONFIG || {};
  const log = (...a) => console.log("[KARBA]", ...a);
  const q = (sel, p = document) => p.querySelector(sel);

  // ---------- HERO image rotator ----------
  const hero = document.querySelector("#heroImg");
  const heroImages = [
    "assets/hero-1.jpg",
    "assets/hero-2.jpg",
    "assets/hero-3.jpg",
    "assets/hero-4.jpg",
  ].filter(Boolean);
  if (heroImg && heroImages.length) {
    let idx = 0;
    heroImg.src = heroImages[idx];
    setInterval(() => {
      idx = (idx + 1) % heroImages.length;
      heroImg.style.opacity = "0";
      setTimeout(() => {
        heroImg.src = heroImages[idx];
        heroImg.style.opacity = "1";
      }, 250);
    }, 6000);
  }

  // 2) Health ping (shows "API OK - <time>" in the small status strip on the page)
  const statusEl = q("#form-status");
  const setStatus = (txt, color = "") => {
    if (!statusEl) return;
    statusEl.textContent = txt;
    statusEl.style.color = color || "";
  };

  const health = () => {
    if (!CFG.BACKEND_URL) {
      setStatus("Backend URL missing", "#ffb4b4");
      return;
    }
    fetch(CFG.BACKEND_URL + "/api/health")
      .then((r) => r.json())
      .then((j) => setStatus(`API OK — ${j.time || ""}`))
      .catch(() => setStatus("API unreachable", "#ffb4b4"));
  };
  health();

  // 3) Form + reCAPTCHA v3
  const form = q("#lead-form");
  if (!form) return;

  const btn = q("#submitBtn", form);
  const nameEl = q('input[name="name"]', form);
  const emailEl = q('input[name="email"]', form);
  const phoneEl = q('input[name="phone"]', form);
  const serviceEl = q('select[name="service"]', form);
  const msgEl = q('textarea[name="message"]', form);

  const disable = (v) => { if (btn) btn.disabled = v; };

  // Safety: promise wrapper with timeout so recaptcha never hangs the UI
  const withTimeout = (p, ms, label = "operation") => {
    let to;
    const timeout = new Promise((_, rej) => {
      to = setTimeout(() => rej(new Error(`${label} timed out`)), ms);
    });
    return Promise.race([p.finally(() => clearTimeout(to)), timeout]);
  };

  // Single source for getting a v3 token
  const getRecaptchaToken = async () => {
    if (!CFG.RECAPTCHA_SITE_KEY) throw new Error("Missing reCAPTCHA site key");
    if (!window.grecaptcha || !grecaptcha.execute) {
      throw new Error("reCAPTCHA not loaded on page");
    }
    await withTimeout(
      new Promise((res) => grecaptcha.ready(res)),
      5000,
      "reCAPTCHA ready"
    );
    return withTimeout(
      grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action: "lead" }),
      5000,
      "reCAPTCHA execute"
    );
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      // basic validation
      const name = (nameEl?.value || "").trim();
      const email = (emailEl?.value || "").trim();
      if (!name || !email) {
        setStatus("Please enter your name and email.", "#ffb4b4");
        return;
      }

      disable(true);
      setStatus("Securing…");

      // GET TOKEN (clear message if any error)
      let recaptchaToken = "";
      try {
        recaptchaToken = await getRecaptchaToken();
      } catch (rcErr) {
        console.error(rcErr);
        setStatus(
          "Could not verify reCAPTCHA. Please check the site key / domain and try again.",
          "#ffb4b4"
        );
        disable(false);
        return;
      }

      setStatus("Sending…");

      const body = {
        name,
        email,
        phone: phoneEl?.value || "",
        service: serviceEl?.value || "",
        message: msgEl?.value || "",
        recaptchaToken,
      };

      const r = await withTimeout(
        fetch(CFG.BACKEND_URL + "/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        12000,
        "Lead submit"
      );

      const text = await r.text();
      if (!r.ok) throw new Error(text || `HTTP ${r.status}`);

      // success
      setStatus("Thanks — we’ll be in touch shortly.");
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus(
        /recaptcha|site key|token|ready|execute/i.test(String(err))
          ? "reCAPTCHA error. Check domain & site key."
          : "Network error. Please try again.",
        "#ffb4b4"
      );
    } finally {
      disable(false);
    }
  });
})();
