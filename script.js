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
/* ===== KARBA BRANDING ADDITIONS (Safe, non-breaking) ===== */
:root{
  --karba-navy-900:#0a1733;
  --karba-navy-800:#0f234a;
  --karba-navy-700:#132c5e;
  --karba-card:#112244;
  --karba-text:#ffffff;
  --karba-subtle:#d2dcff;
  --karba-gold:#d4af37;
  --karba-gold-strong:#f1cf57;
  --karba-outline:rgba(212,175,55,.35);
  --karba-shadow:0 10px 30px rgba(0,0,0,.35);
}

/* Page background + base text color (keeps your layout) */
html,body{
  background:
    radial-gradient(1200px 800px at 70% -10%, rgba(17,34,68,.65), transparent 60%),
    linear-gradient(160deg, var(--karba-navy-900) 10%, #081226 55%, #061028 100%);
  color: var(--karba-text);
}

/* Headings in gold */
h1,h2,h3,h4{
  color: var(--karba-gold);
  letter-spacing:.3px;
}

/* Links + nav */
a{ color: var(--karba-gold); text-decoration:none; }
a:hover{ color: var(--karba-gold-strong); }

/* Generic cards (applies to your service tiles) */
.card,
[class*="card"],
.tiles .tile,
.box,
.panel{
  background: linear-gradient(180deg, var(--karba-card), rgba(17,34,68,.75));
  border: 1px solid rgba(255,255,255,.08);
  border-radius:16px;
  box-shadow: var(--karba-shadow);
  backdrop-filter: blur(4px);
}

/* Section captions / small text */
.small, .muted, .note{ color: var(--karba-subtle); }

/* Buttons */
.btn, button[type="submit"], .button {
  background: var(--karba-gold);
  color:#000;
  border:none;
  border-radius:14px;
  padding:12px 22px;
  font-weight:700;
  letter-spacing:.2px;
  box-shadow: var(--karba-shadow);
  transition: transform .08s ease, background .2s ease, box-shadow .2s ease;
}
.btn:hover, button[type="submit"]:hover, .button:hover{
  background: var(--karba-gold-strong);
  transform: translateY(-1px);
}
.btn:active, button[type="submit"]:active, .button:active{
  transform: translateY(0);
}

/* Form shell (keeps your form markup intact) */
form{
  background: linear-gradient(180deg, rgba(17,34,68,.9), rgba(17,34,68,.75));
  border:1px solid rgba(255,255,255,.06);
  border-radius:18px;
  padding:28px;
  box-shadow: var(--karba-shadow);
}

/* Inputs (text, email, select, textarea) */
input[type="text"],
input[type="tel"],
input[type="email"],
select,
textarea{
  width:100%;
  background: rgba(10,23,51,.55);
  color: var(--karba-text);
  border:1px solid rgba(255,255,255,.12);
  border-radius:14px;
  padding:12px 14px;
  outline:none;
  transition: border .2s ease, box-shadow .2s ease, background .2s ease;
}
input::placeholder, textarea::placeholder{ color: rgba(255,255,255,.55); }
input:focus, select:focus, textarea:focus{
  border-color: var(--karba-outline);
  box-shadow: 0 0 0 3px rgba(212,175,55,.15);
  background: rgba(10,23,51,.75);
}

/* Form helper row (status/notes) */
.form-status, .help, .hint{ color: var(--karba-subtle); }

/* Footer strip */
footer, .footer{
  border-top:1px solid rgba(255,255,255,.06);
  color: var(--karba-subtle);
}

/* Hero headline emphasis */
.hero h1, .hero .title{
  font-weight:800;
  line-height:1.05;
}

/* Responsive polish */
@media (max-width: 980px){
  .grid, .row{ gap:18px; }
  form{ padding:20px; }
}
@media (max-width: 640px){
  .cards, .tiles{ grid-template-columns: 1fr !important; }
  .btn, button[type="submit"]{ width:100%; }
}

/* Utility helpers you can use anywhere */
.karba-shadow{ box-shadow: var(--karba-shadow); }
.karba-gold{ color: var(--karba-gold); }
.karba-pill{ border-radius: 999px; }
.karba-outline{ border:1px solid var(--karba-outline); }

