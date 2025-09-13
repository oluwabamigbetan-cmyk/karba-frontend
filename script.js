// script.js  — clean, user-friendly form flow

document.addEventListener('DOMContentLoaded', () => {
  const CFG = window.KARBA_CONFIG || {};
  const form = document.getElementById('lead-form');
  const statusEl = document.getElementById('form-status');
  const submitBtn = form?.querySelector('button[type="submit"]');

  // Guard rails: show clear setup errors if something is missing
  if (!CFG.BACKEND_URL) {
    if (statusEl) statusEl.textContent = 'Setup error: BACKEND_URL missing.';
    return;
  }
  if (!CFG.RECAPTCHA_SITE_KEY) {
    if (statusEl) statusEl.textContent = 'Setup error: RECAPTCHA_SITE_KEY missing.';
    return;
  }

  // Load reCAPTCHA v3 dynamically (keeps HTML clean)
  const recaptchaReady = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${CFG.RECAPTCHA_SITE_KEY}`;
    s.async = true;
    s.onload = () => grecaptcha.ready(resolve);
    s.onerror = () => reject(new Error('Failed to load reCAPTCHA.'));
    document.head.appendChild(s);
  });

  // Optional: health check once at load (helps debugging)
  fetch(`${CFG.BACKEND_URL}/api/health`).then(r => r.json())
    .then(j => console.log('[HEALTH]', j))
    .catch(() => {});

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // UI: lock while submitting
    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = 'Submitting…';
      statusEl.className = 'info';
    }

    try {
      // 1) Make sure reCAPTCHA is ready
      await recaptchaReady;

      // 2) Get a v3 token for action "lead"
      const token = await grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action: 'lead' });

      // 3) Build payload
      const data = Object.fromEntries(new FormData(form).entries());
      data.recaptchaToken = token;

      // 4) POST to backend
      const res = await fetch(`${CFG.BACKEND_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const text = await res.text();
      let body;
      try { body = JSON.parse(text); } catch { body = { ok:false, error:text }; }

      if (res.ok && body?.ok) {
        if (statusEl) {
          statusEl.textContent = '✅ Thank you! We will contact you shortly.';
          statusEl.className = 'success';
        }
        form.reset();
      } else {
        if (statusEl) {
          statusEl.textContent = `❌ Error: ${body?.error || res.statusText || 'Submission failed'}`;
          statusEl.className = 'error';
        }
      }
    } catch (err) {
      console.error(err);
      if (statusEl) {
        statusEl.textContent = '❌ Network or reCAPTCHA error. Please try again.';
        statusEl.className = 'error';
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
