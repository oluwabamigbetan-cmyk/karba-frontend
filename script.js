// script.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lead-form');
  const statusBox = document.getElementById('form-status');
  const BACKEND = (window.KARBA_CONFIG && window.KARBA_CONFIG.BACKEND_URL) || '';
  const SITE = (window.KARBA_CONFIG && window.KARBA_CONFIG.RECAPTCHA_SITE_KEY) || '';

  // Load Google reCAPTCHA v3 dynamically using your site key
  function loadRecaptcha() {
    if (!SITE) return;
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE}`;
    document.head.appendChild(s);
  }
  loadRecaptcha();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusBox.textContent = 'Submitting...';

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      // Wait for grecaptcha to be ready and get a token for action "lead"
      if (!window.grecaptcha || !SITE) {
        statusBox.textContent = 'reCAPTCHA not loaded. Please refresh and try again.';
        return;
      }
      await grecaptcha.ready();
      const token = await grecaptcha.execute(SITE, { action: 'lead' });

      // Send form data + token
      const res = await fetch(BACKEND + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, recaptchaToken: token })
      });

      const txt = await res.text();
      statusBox.textContent = res.ok ? 'Thank you! We will contact you shortly.' : ('Error: ' + txt);
      if (res.ok) form.reset();

    } catch (err) {
      statusBox.textContent = 'Network error. Please try again.';
      console.error(err);
    }
  });
});
