// script.js
(function () {
  const log = (...a) => console.log('[KARBA]', ...a);
  const err = (...a) => console.error('[KARBA]', ...a);

  function getEl(id) { return document.getElementById(id); }

  function setStatus(msg) {
    const box = getEl('form-status');
    if (box) box.textContent = msg;
  }

  // Bind once after DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    log('DOM ready');

    const form = getEl('lead-form');
    if (!form) { err('lead-form not found'); return; }

    // Safety: stop the browser’s default submit no matter what
    form.setAttribute('novalidate', 'true');
    form.addEventListener('submit', (ev) => ev.preventDefault(), { once: true });

    // Attach our real handler (and mark as bound)
    form.addEventListener('submit', onSubmit);
    window.__KARBA_FORM_BOUND__ = true;
    log('submit handler bound');

    // Quick config sanity
    const cfg = (window.KARBA_CONFIG || {});
    log('CONFIG', cfg);

    if (!cfg.BACKEND_URL) {
      setStatus('Setup error: BACKEND_URL missing.');
      return;
    }
    if (!cfg.RECAPTCHA_SITE_KEY) {
      setStatus('Setup error: RECAPTCHA_SITE_KEY missing.');
      return;
    }

    // Load reCAPTCHA v3
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${cfg.RECAPTCHA_SITE_KEY}`;
    s.onload = () => log('reCAPTCHA script loaded');
    s.onerror = () => err('Failed to load reCAPTCHA script');
    document.head.appendChild(s);

    // Optional: small health ping so you can see success in console
    fetch(cfg.BACKEND_URL + '/api/health')
      .then(r => r.text())
      .then(t => log('HEALTH:', t))
      .catch(e => err('HEALTH error', e));
  });

  async function onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    setStatus('Submitting…');

    const cfg = (window.KARBA_CONFIG || {});
    const BACKEND = cfg.BACKEND_URL;
    const SITE = cfg.RECAPTCHA_SITE_KEY;

    if (!BACKEND) { setStatus('Setup error: BACKEND_URL missing.'); return; }
    if (!SITE) { setStatus('Setup error: RECAPTCHA_SITE_KEY missing.'); return; }

    try {
      // Wait for reCAPTCHA then get token
      if (!window.grecaptcha) {
        setStatus('reCAPTCHA not ready. Refresh and try again.');
        return;
      }

      await grecaptcha.ready();
      const token = await grecaptcha.execute(SITE, { action: 'lead' });
      log('recaptcha token obtained (length):', token && token.length);

      const payload = Object.fromEntries(new FormData(form).entries());
      payload.recaptchaToken = token;

      const res = await fetch(BACKEND + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const txt = await res.text();
      log('POST /api/leads', res.status, txt);

      if (res.ok) {
        setStatus('Thank you! We will contact you shortly.');
        form.reset();
      } else {
        setStatus(`Error ${res.status}: ${txt}`);
      }
    } catch (ex) {
      err(ex);
      setStatus('Network error. Please try again.');
    }
  }
})();
