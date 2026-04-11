// ── Read email from URL ──
  const params = new URLSearchParams(window.location.search);
  const email  = params.get('email') || '';
  document.getElementById('emailDisplay').textContent = email || 'votre adresse e-mail';

  const inputs    = Array.from(document.querySelectorAll('.otp-input'));
  const alertBox  = document.getElementById('alertBox');
  const verifyBtn = document.getElementById('verifyBtn');
  const resendBtn = document.getElementById('resendBtn');
  const ringFill  = document.getElementById('ringFill');
  const ringLabel = document.getElementById('ringLabel');
  const timerTxt  = document.getElementById('timerTxt');
  const CIRC      = 113.1;

  // ── OTP input logic ──
  inputs.forEach((inp, i) => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace') {
        if (!inp.value && i > 0) { inputs[i-1].focus(); inputs[i-1].value = ''; }
        inp.classList.remove('filled');
      }
      if (e.key === 'ArrowLeft'  && i > 0)               inputs[i-1].focus();
      if (e.key === 'ArrowRight' && i < inputs.length-1) inputs[i+1].focus();
    });
    inp.addEventListener('input', () => {
      const v = inp.value.replace(/\D/g, '');
      inp.value = v ? v[v.length-1] : '';
      inp.classList.toggle('filled', !!inp.value);
      if (inp.value && i < inputs.length-1) inputs[i+1].focus();
      clearAlert();
    });
    inp.addEventListener('paste', e => {
      e.preventDefault();
      const p = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'');
      [...p].slice(0, 6).forEach((ch, j) => {
        if (inputs[i+j]) { inputs[i+j].value = ch; inputs[i+j].classList.add('filled'); }
      });
      const next = i + p.length;
      (inputs[next] || inputs[5]).focus();
    });
  });

  function getCode() { return inputs.map(i => i.value).join(''); }

  function clearAlert() { alertBox.className = 'alert'; alertBox.textContent = ''; }
  function showAlert(msg, type) {
    alertBox.className = 'alert ' + type;
    alertBox.textContent = msg;
  }
  function shakeInputs() {
    inputs.forEach(i => {
      i.classList.add('error-box');
      setTimeout(() => i.classList.remove('error-box'), 450);
    });
  }

  // ── Countdown (2 min) ──
  let seconds = 60;
  const countdown = setInterval(() => {
    seconds--;
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, '0');
    const txt = m + ':' + s;
    timerTxt.textContent = txt;
    ringLabel.textContent = txt;

    const offset = CIRC * (1 - seconds / 60);
    ringFill.style.strokeDashoffset = offset;

    const isWarn = seconds <= 30;
    ringFill.classList.toggle('warning', isWarn);
    ringLabel.classList.toggle('warning', isWarn);

    if (seconds <= 0) {
      clearInterval(countdown);
      resendBtn.classList.add('active');
      timerTxt.textContent = 'expiré';
      ringLabel.textContent = '0:00';
    }
  }, 1000);

  function resendCode() {
    if (!resendBtn.classList.contains('active')) return;
    showNotification('Code renvoyé !');
    resendBtn.classList.remove('active');
    resendBtn.textContent = 'Renvoyé ✓';
    resendBtn.style.color = '#1a7a46';
  }

  // ── Verify ──
  function handleVerify() {
    const code = getCode();
    if (code.length < 6) {
      showAlert('Veuillez entrer les 6 chiffres du code.', 'error');
      shakeInputs(); return;
    }
    clearAlert();
    verifyBtn.classList.add('loading');
    verifyBtn.disabled = true;

    // ── Remplacer par votre vrai appel API ──
    // Demo : code "123456" accepté
    setTimeout(() => {
      verifyBtn.classList.remove('loading');
      verifyBtn.disabled = false;

      if (code === '123456') {
        document.getElementById('successModal').classList.add('show');
        setTimeout(() => {
          window.location.href = 'edit-password.html?email=' + encodeURIComponent(email);
        }, 2200);
      } else {
        showAlert('Code incorrect. Vérifiez votre e-mail et réessayez.', 'error');
        shakeInputs();
        inputs.forEach(i => { i.value=''; i.classList.remove('filled'); });
        inputs[0].focus();
      }
    }, 1600);
  }

  function closeModal() {
    document.getElementById('successModal').classList.remove('show');
  }

  function showNotification(msg) {
    const n = document.getElementById('notification');
    n.textContent = msg; n.style.display = 'block';
    setTimeout(() => { n.style.display = 'none'; }, 2500);
  }

  inputs[0].focus();