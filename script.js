// script.js
(function () {
  const log = (...a) => console.log('[KARBA]', ...a);
  const err = (...a) => console.error('[KARBA]', ...a);

  function el(id) { return document.getElementById(id); }
  function setStatus(msg, color) {
    const box = el('form-status');
    if (box) { box.textContent = msg; if (color) box.style.color = color; }
  }

  // Load reCAPTCHA v3 dynamically from the Site key in config
  function loadRecaptcha(siteKey) {
    if (!siteKey) return;
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true; s.defer = true;
    s.onload = () => log('reCAPTCHA loaded');
    s.onerror = () => err('reCAPTCHA failed to load');
    document.head.appendChild(s);
  }

  // Never hang forever
  async function fetchWithTimeout(url, options = {}, ms = 20000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      return await fetch(url, { ...options, signal: ctrl.signal });
    } finally { clearTimeout(t); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    log('DOM ready');
    const form = el('lead-form');
    if (!form) { err('Form #lead-form not found'); return; }

    // Prevent native submit/reload no matter what
    form.setAttribute('novalidate', 'true');

    const cfg = window.KARBA_CONFIG || {};
    log('CONFIG', cfg);

    if (!cfg.BACKEND_URL) { setStatus('Setup error: BACKEND_URL missing.', 'red'); return; }
    if (!cfg.RECAPTCHA_SITE_KEY) { setStatus('Setup error: RECAPTCHA_SITE_KEY missing.', 'red'); return; }

    // Load reCAPTCHA
    loadRecaptcha(cfg.RECAPTCHA_SITE_KEY);

    // Optional: backend health log
    fetch(cfg.BACKEND_URL + '/api/health')
      .then(r => r.text()).then(txt => log('HEALTH:', txt))
      .catch(e => err('HEALTH error', e));

    form.addEventListener('submit', onSubmit);
  });

  async function onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    setStatus('Submitting…', '#EEDC82'); // soft gold

    const { BACKEND_URL, RECAPTCHA_SITE_KEY } = window.KARBA_CONFIG || {};
    if (!BACKEND_URL) { setStatus('Setup error: BACKEND_URL missing.', 'red'); return; }
    if (!RECAPTCHA_SITE_KEY) { setStatus('Setup error: RECAPTCHA_SITE_KEY missing.', 'red'); return; }

    try {
      if (!window.grecaptcha) {
        setStatus('reCAPTCHA not ready. Refresh and try again.', 'red');
        return;
      }

      // Acquire token (v3 score)
      await grecaptcha.ready();
      const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'lead' });
      log('token length:', token && token.length);

      // Gather form data
      const data = Object.fromEntries(new FormData(form).entries());
      data.recaptchaToken = token;

      // Post to backend
      let res = await fetchWithTimeout(`${BACKEND_URL.replace(/\/+$/,'')}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      // Auto-fallback if your server uses /api/test-lead
      if (res.status === 404) {
        res = await fetchWithTimeout(`${BACKEND_URL.replace(/\/+$/,'')}/api/test-lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }

      const text = await res.text();
      log('POST result', res.status, text);

      if (!res.ok) {
        setStatus(`Error ${res.status}: ${text}`, 'red');
      } else {
        setStatus('✅ Thank you! We will contact you shortly.', 'green');
        form.reset();
      }
    } catch (ex) {
      err(ex);
      setStatus(ex?.name === 'AbortError' ? 'Request timed out. Please try again.' : 'Network error. Please try again.', 'red');
    }
  }
})();
