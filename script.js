// script.js
(function () {
  "use strict";

  const CFG = window.KARBA_CONFIG;

  // ---------- HERO image rotator ----------
  const hero = document.querySelector("#heroImg");
  const heroImages = [
    "/assets/hero-1.jpg",
    "/assets/hero-2.jpg",
    "/assets/hero-3.jpg",
    "/assets/hero-4.jpg"
  ];

  let hidx = 0;
  function showHero(i) {
    if (!hero) return;
    hero.style.opacity = "0";
    setTimeout(() => {
      hero.style.backgroundImage = `url('${heroImages[i]}')`;
      hero.style.opacity = "1";
    }, 250);
  }

  if (hero && heroImages.length) {
    showHero(hidx);
    setInterval(() => {
      hidx = (hidx + 1) % heroImages.length;
      showHero(hidx);
    }, 6000);
  }

  // ---------- Health check ----------
  const statusEl = document.getElementById("form-status");
  fetch(CFG.BACKEND_URL + "/api/health")
    .then((r) => r.json())
    .then((j) => {
      if (statusEl) statusEl.textContent = "API OK — " + (j.time || "");
    })
    .catch(() => {
      if (statusEl) statusEl.textContent = "API unreachable";
    });

  // ---------- Lead form (reCAPTCHA v3) ----------
  const form = document.getElementById("lead-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault(); // stops the page from jumping/reloading

      const btn = form.querySelector('button[type="submit"]');
      const name = form.fullname.value.trim();
      const email = form.email.value.trim();
      const phone = form.phone.value.trim();
      const service = form.service.value;
      const message = form.message.value.trim();

      if (btn) {
        btn.disabled = true;
        btn.textContent = "Sending…";
      }
      if (statusEl) {
        statusEl.textContent = "";
        statusEl.style.color = "#fff";
      }

      try {
        await grecaptcha.ready();
        const token = await grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, {
          action: "lead",
        });

        const body = { name, email, phone, service, message, recaptchaToken: token };

        const resp = await fetch(CFG.BACKEND_URL + "/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const text = await resp.text();
        if (!resp.ok) throw new Error(text || "Request failed");

        if (statusEl) {
          statusEl.textContent = "Thanks — we’ll be in touch shortly.";
          statusEl.style.color = "#93e36f";
        }
        form.reset();
      } catch (err) {
        console.error(err);
        if (statusEl) {
          statusEl.textContent = "Network error. Please try again.";
          statusEl.style.color = "#ffb4b4";
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Submit";
        }
      }
    });
  }

  // ---------- Favicon (auto attach if missing) ----------
  if (!document.querySelector('link[rel="icon"]')) {
    const l = document.createElement("link");
    l.rel = "icon";
    l.href = "/assets/favicon.ico";
    document.head.appendChild(l);
  }
})();
