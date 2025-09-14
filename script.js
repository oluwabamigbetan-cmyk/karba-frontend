/* script.js v3 */
(function () {
  const CFG = window.KARBA_CONFIG || {};
  const form = document.getElementById('lead-form');
  const statusBox = document.getElementById('form-status');

  function $(id, name) {
    return document.getElementById(id) || document.querySelector(`[name="${name}"]`);
  }

  const el = {
    name:    () => ($('name','name')?.value || '').trim(),
    email:   () => ($('email','email')?.value || '').trim(),
    phone:   () => ($('phone','phone')?.value || '').trim(),
    service: () => ($('service','service')?.value || '').trim(),
    message: () => ($('message','message')?.value || '').trim()
  };

  function setStatus(msg, ok=false) {
    if (!statusBox) return;
    statusBox.textContent = msg;
    statusBox.style.color = ok ? '#0a0' : '#f66';
  }

  // quick health ping (visible in console only)
  fetch(`${CFG.BACKEND_URL}/api/health`)
    .then(r => r.json()).then(j => console.log('[HEALTH]', j))
    .catch(e => console.warn('[HEALTH FAIL]', e));

  if (!form) {
    console.error('lead-form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('Submitting…');

    const name = el.name();
    const email = el.email();
    const service = el.service();

    if (!name || !email || !service) {
      setStatus('Please fill your name, email and service of interest.');
      return;
    }

    try {
      await new Promise(res => grecaptcha.ready(res));
      const token = await grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action: 'lead' });

      const res = await fetch(`${CFG.BACKEND_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: el.phone(),
          service,
          message: el.message(),
          recaptchaToken: token
        })
      });

      console.log('[LEADS RES]', res.status, res.statusText);

      if (!res.ok) {
        const text = await res.text().catch(()=>'');
        if (res.status === 401 || res.status === 403) {
          setStatus('reCAPTCHA rejected (401/403). Check site key domains in reCAPTCHA admin.');
        } else if (res.status === 404) {
          setStatus('Endpoint not found (404). Check /api/leads path on backend.');
        } else if (res.status === 500) {
          setStatus('Server error (500). See Render logs.');
        } else {
          setStatus(`Error ${res.status}. ${text || 'Submit failed.'}`);
        }
        return;
      }

      await res.json().catch(()=>({}));
      setStatus('Thank you! We will contact you shortly.', true);
      form.reset();
    } catch (err) {
      console.error('[NETWORK/CORS FAIL]', err);
      setStatus('Network/CORS error. Ensure ALLOWED_ORIGINS on backend include this site.');
    }
  });
})();
