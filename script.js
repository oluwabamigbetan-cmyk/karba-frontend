(function () {
  const CFG = window.KARBA_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);

  // 1) Hero image rotator
  const heroImages = [
    "assets/hero-1.jpg", // Nigerian family in suits (your #6)
    "assets/hero-2.jpg", // optional second image (similar tone)
  ];
  let idx = 0;
  const heroImg = $("#heroImg");
  setInterval(() => {
    idx = (idx + 1) % heroImages.length;
    heroImg.style.opacity = "0.2";
    setTimeout(() => {
      heroImg.src = heroImages[idx];
      heroImg.style.opacity = "1";
    }, 250);
  }, 6000);

  // 2) Health check (to reassure)
  fetch(CFG.BACKEND_URL + "/api/health")
    .then((r) => r.json())
    .then((j) => ($("#health").textContent = "API OK — " + j.time))
    .catch(() => ($("#health").textContent = "API unreachable"));

  // 3) Lead form + reCAPTCHA v3
  const btn = $("#submitBtn");
  const status = $("#formStatus");
  $("#leadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    btn.disabled = true;
    btn.textContent = "Sending…";

    try {
      await new Promise((res) => grecaptcha.ready(res));
      const token = await grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action: "lead" });

      const form = e.currentTarget;
      const body = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        service: form.service.value,
        message: form.message.value.trim(),
        recaptchaToken: token,
      };

      const r = await fetch(CFG.BACKEND_URL + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      status.textContent = j.message || "Thanks — we’ll be in touch shortly.";
      status.style.color = "#9fe29f";
      form.reset();
    } catch (err) {
      console.error(err);
      status.textContent = "Network error. Please try again.";
      status.style.color = "#f39";
    } finally {
      btn.disabled = false;
      btn.textContent = "Submit";
    }
  });

  // Quiets favicon 404s (optional)
  window.addEventListener("error", (e) => {
    if (String(e?.target?.src || "").includes("favicon.ico")) e.preventDefault();
  }, true);
})();
