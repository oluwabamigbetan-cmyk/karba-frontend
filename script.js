<script>
document.addEventListener('DOMContentLoaded', () => {
  const CFG = window.KARBA_CONFIG || {};
  const form = document.getElementById('leadForm');
  const statusBox = document.getElementById('formStatus');

  // Small helpers
  const setStatus = (msg) => { if (statusBox) statusBox.textContent = msg; };

  // Quick sanity logs (you can remove later)
  console.log('[KARBA_CONFIG]', CFG);

  // 1) Health check (optional but nice)
  if (CFG.BACKEND_URL) {
    fetch(`${CFG.BACKEND_URL}/api/health`)
      .then(r => r.json()).then(j => console.log('[HEALTH]', j))
      .catch(() => console.warn('[HEALTH] check failed'));
  }

  // 2) Handle submit
  if (!form) {
    console.error('leadForm not found in DOM');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('Submitting…');

    try {
      // Build payload from *names*, not ids — prevents "undefined"
      const fd = new FormData(form);
      const payload = {
        name: (fd.get('name') || '').toString().trim(),
        email: (fd.get('email') || '').toString().trim(),
        phone: (fd.get('phone') || '').toString().trim(),
        service: (fd.get('service') || '').toString().trim(),
        message: (fd.get('message') || '').toString().trim(),
      };

      // Basic front-end validation
      if (!payload.name || !payload.email || !payload.service) {
        setStatus('Please fill in your name, email, and select a service.');
        return;
      }

      if (!CFG.RECAPTCHA_SITE_KEY) {
        setStatus('reCAPTCHA not configured.');
        console.error('Missing RECAPTCHA_SITE_KEY');
        return;
      }
      if (!CFG.BACKEND_URL) {
        setStatus('Backend not configured.');
        console.error('Missing BACKEND_URL');
        return;
      }

      // 3) Get reCAPTCHA v3 token
      const token = await grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action: 'lead' });

      // 4) Send to backend
      const res = await fetch(`${CFG.BACKEND_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, recaptchaToken: token })
      });

      const text = await res.text();
      if (!res.ok) {
        setStatus(`Error ${res.status}: ${text}`);
        console.error('Submit failed:', res.status, text);
        return;
      }

      // Success
      setStatus('Thank you! We will contact you shortly.');
      form.reset();
      console.log('Lead OK:', text);
    } catch (err) {
      console.error(err);
      setStatus('Network error. Please try again.');
    }
  });
});
</script>
