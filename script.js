// script.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lead-form');
  const statusBox = document.getElementById('form-status');

  const BACKEND = (window.KARBA_CONFIG && window.KARBA_CONFIG.BACKEND_URL) || '';
  const SITE = (window.KARBA_CONFIG && window.KARBA_CONFIG.RECAPTCHA_SITE_KEY) || '';

  // 1) Load reCAPTCHA with your site key
  function loadRecaptcha() {
    if (!SITE) return;
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE}`;
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }
  loadRecaptcha();

  // Helper: post to a given path
  async function postLead(path, payload) {
    const res = await fetch(BACKEND + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!BACKEND) {
      statusBox.textContent = 'Missing BACKEND_URL.';
      return;
    }
    if (!SITE) {
      statusBox.textContent = 'Missing RECAPTCHA_SITE_KEY.';
      return;
    }

    statusBox.textContent = 'Submitting…';

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      // 2) Get reCAPTCHA token
      if (!window.grecaptcha) {
        statusBox.textContent = 'reCAPTCHA not loaded. Please refresh and try again.';
        return;
      }
      await grecaptcha.ready();
      const token = await grecaptcha.execute(SITE, { action: 'lead' });

      const payload = { ...data, recaptchaToken: token };

      // 3) Try /api/leads, fallback to /api/test-lead if 404
      let res = await postLead('/api/leads', payload);
      if (res.status === 404) {
        res = await postLead('/api/test-lead', payload);
      }

      const txt = await res.text();
      if (res.ok) {
        statusBox.textContent = 'Thank you! We will contact you shortly.';
        form.reset();
      } else {
        statusBox.textContent = `Error: ${res.status} ${txt}`;
      }
    } catch (err) {
      console.error(err);
      statusBox.textContent = 'Network error. Please try again.';
    }
  });
});
