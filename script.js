/* global grecaptcha */
(() => {
  // ---- 0) Helpers
  const $ = (s,scope=document)=>scope.querySelector(s);
  const $$ = (s,scope=document)=>[...scope.querySelectorAll(s)];
  const statusEl = $('#status');
  const btn = $('#submitBtn');

  const setStatus = (txt, color = '') => {
    if (!statusEl) return;
    statusEl.textContent = txt;
    statusEl.style.color = color || '';
  };
  const disable = (v) => { if (btn) btn.disabled = !!v; };

  // ---- 1) HERO (2-image rotator; fast + simple)
  const heroImg = $('#hero-img');
  const heroImages = ['assets/hero1.jpg','assets/hero2.jpg'];
  let heroIdx = 0;
  if (heroImg) {
    heroImg.classList.add('active');
    setInterval(() => {
      heroIdx = (heroIdx + 1) % heroImages.length;
      heroImg.style.opacity = 0;
      setTimeout(() => {
        heroImg.src = heroImages[heroIdx];
        heroImg.onload = () => { heroImg.style.opacity = 1; };
      }, 250);
    }, 5500);
  }

  // ---- 2) Certificates modal (shown only on request)
  const modal = $('#modal');
  const modalImg = $('#modalImg');
  if (modal && modalImg) {
    $$('.cert-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const src = btn.getAttribute('data-img');
        if (src) modalImg.src = src;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden','false');
      });
    });
    $$('.modal [data-close]').forEach(el => el.addEventListener('click', close));
    function close(){
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      modalImg.src = '';
    }
    modal.addEventListener('keydown', e => (e.key === 'Escape') && close());
  }
  
  // ---- 3) Health check (Render backend)
  const CFG = window.KARBA_CONFIG || {};
  (async () => {
    try{
      if (!CFG.BACKEND_URL) {
        setStatus('Backend URL missing in config.js', '#f66');
        return;
      }
      const r = await fetch(CFG.BACKEND_URL + '/api/health', { cache:'no-store' });
      const j = await r.json();
      if (j && j.ok) setStatus('FILL FORM', '#6fcf97');
      else setStatus('Backend health check failed', '#f66');
    }catch(e){
      setStatus('Backend not reachable', '#f66');
    }
  })();
  // ---- 4) FORM SUBMIT with reCAPTCHA v3 (explicit)
  const form = $('#lead-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        // basic validation
        const name = $('#name').value.trim();
        const email = $('#email').value.trim();
        if (!name || !email) {
          setStatus('Please enter your name and email.', '#ffb74d');
          return;
        }

        disable(true);
        setStatus('Securing…');

        // Ensure grecaptcha is ready
        await new Promise((resolve, reject) => {
          const t = setTimeout(() => reject(new Error('reCAPTCHA not loaded')), 8000);
          if (window.grecaptcha && grecaptcha.ready) {
            grecaptcha.ready(() => { clearTimeout(t); resolve(); });
          } else {
            reject(new Error('reCAPTCHA not loaded'));
          }
        });

        // Create a v3 token (uses your site key from config.js)
        const token = await grecaptcha.execute(CFG.RECAPTCHA_SITE_KEY, { action: 'lead' });

        const body = {
          name,
          email,
          phone: $('#phone').value.trim(),
          service: $('#service').value,
          message: $('#message').value.trim(),
          recaptchaToken: token
        };

        const r = await fetch(CFG.BACKEND_URL + '/api/leads', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(body)
        });

        if (!r.ok) {
          const txt = await r.text();
          throw new Error('Server error: ' + (txt || r.status));
        }

        setStatus('Thanks — we’ll be in touch shortly.', '#6fcf97');
        form.reset();
      } catch (err) {
        console.error(err);
        const msg = String(err && err.message || err);
        const isSecurity = /recaptcha|captcha|403|401/i.test(msg);
        setStatus(`Network or security error — ${isSecurity ? 'Security error' : 'Server error'}`, '#f66');
      } finally {
        disable(false);
      }
    });
  }
})();
