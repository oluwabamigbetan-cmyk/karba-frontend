// script.js — lead form handler (v3, no HTML inside this file)

document.addEventListener('DOMContentLoaded', async () => {
  const CFG = window.KARBA_CONFIG || {};
  const form = document.getElementById('lead-form');
  const statusBox = document.getElementById('form-status');

  const setStatus = (msg, ok = false) => {
    if (!statusBox) return;
    statusBox.textContent = msg;
    statusBox.style.color = ok ? '#22c55e' : '#fde047';
  };

  if (!CFG.BACKEND_URL) { setStatus('Setup error: BACKEND_URL missing.'); return; }
  if (!CFG.RECAPTCHA_SITE_KEY) { setStatus('Setup error: RECAPTCHA_SITE_KEY missing.'); return; }
  if (!form) { console.error('[KARBA] #lead-form not found'); return; }

  // quick health check (optional)
  try {
    const r = await fetch(`${CFG.BACKEND_URL}/api/health`);
    console.log('[HEALTH]', await r.json());
  } catch {}

  // load reCAPTCHA v3 dynamically
  const ensureRecaptcha = () =>
    new Promise((resolve, reject) => {
      if (window.grecaptcha?.ready) return resolve();
      const s = document.createElement('script');
      s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(CFG.RECAPTCHA_SITE_KEY)}`;
      s.async = true; s.defer = true;
      s.onload = () => window.grecaptcha?.ready ? resolve() : reject(new Error('grecaptcha init failed'));
      s.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
      document.head.appendChild(s);
    });

  try { await ensureRecaptcha(); await new Promise(res => grecaptcha.ready(res)); }
  catch (e) { setStatus('reCAPTCHA failed to load. Refresh and try again.'); return; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('Submitting…');

    const name    = (document.getElementById('name')?.value || '').trim();
    const email   = (document.getElementById('email')?.value || '').trim();
    const phone   = (document.getElementById('phone')?.value || '').trim();
    const service = (document.getElementById('service')?.value || '').trim();
    const message = (document.getElementById('message')?.value || '').trim();

    if (!name)  { setStatus('Please enter your full name.');  return; }
    if (!email) { setStatus('Please enter your email.');       return; }

    try {
      const token = await grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action: 'lead' });

      const res = await fetch(`${CFG.BACKEND_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, service, message, recaptchaToken: token }),
      });

      if (!res.ok) {
        const text = await res.text().catch(()=>'');
        setStatus(`Error ${res.status}: ${text || 'Submit failed. Try again.'}`);
        return;
      }

      await res.json().catch(()=>({}));
      setStatus('Thank you! We will contact you shortly.', true);
      form.reset();
    } catch (err) {
      setStatus('Network error. Please try again.');
    }
  });
});
