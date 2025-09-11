// script.js — no-hang submit + clear errors
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lead-form');
  const statusBox = document.getElementById('form-status');

  const cfg = window.KARBA_CONFIG || {};
  const BACKEND = (cfg.BACKEND_URL || '').replace(/\/+$/, '');
  const SITE = cfg.RECAPTCHA_SITE_KEY || '';

  function show(msg) {
    if (statusBox) statusBox.textContent = msg;
  }

  // Load reCAPTCHA v3 with your SITE key
  (function loadRecaptcha() {
    if (!SITE) return;
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE}`;
    s.async = true; s.defer = true;
    document.head.appendChild(s);
  })();

  // Helper: fetch with timeout so it can’t spin forever
  async function fetchWithTimeout(url, options = {}, ms = 20000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      return await fetch(url, { ...options, signal: ctrl.signal });
    } finally {
      clearTimeout(t);
    }
  }

  async function getRecaptchaToken() {
    try {
      if (!window.grecaptcha || !SITE) return null; // allow backend to decide
      await grecaptcha.ready();
      return await grecaptcha.execute(SITE, { action: 'lead' });
    } catch {
      return null;
    }
  }

  async function postLead(path, payload) {
    return fetchWithTimeout(`${BACKEND}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!BACKEND) { show('Setup error: BACKEND_URL missing.'); return; }
    if (!SITE) { show('Setup error: RECAPTCHA_SITE_KEY missing.'); return; }

    show('Submitting…');

    const data = Object.fromEntries(new FormData(form).entries());
    const token = await getRecaptchaToken();
    const payload = { ...data, recaptchaToken: token };

    try {
      // Try main route, then a fallback if your backend uses /api/test-lead
      let res = await postLead('/api/leads', payload);
      if (res.status === 404) res = await postLead('/api/test-lead', payload);

      const text = await res.text();
      let json; try { json = JSON.parse(text); } catch { json = { message: text }; }

      if (!res.ok) {
        show(`Error ${res.status}: ${json.message || text || 'Unknown error'}`);
      } else {
        show('Thank you! We will contact you shortly.');
        form.reset();
      }
    } catch (err) {
      show(err?.name === 'AbortError' ? 'Request timed out. Please try again.' : 'Network error. Please try again.');
    }
  });
});
