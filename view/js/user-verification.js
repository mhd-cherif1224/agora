/* ══════════════════════════════════════════
     CONFIG
  ══════════════════════════════════════════ */
  const API = {
    verify: '../../Controller/verify-email.php',
    resend: '../../Controller/resend-code.php'
  };

  /* MODE SIMULATION — mettre false quand le PHP est prêt */
  const SIMULATION = true;
  const DEMO_CODE  = '123456';

  /* ── Récupérer l'email depuis localStorage (mis par signUp-user.js) ── */
  const currentEmail = localStorage.getItem('pendingEmail') || 'utilisateur@exemple.com';

  /* ══════════════════════════════════════════
     INITIALISATION
  ══════════════════════════════════════════ */
  document.getElementById('email-display').textContent = currentEmail;
  animateProgress('0%', '66%');   /* étape 2/3 de la progression */
  startTimer();
  setTimeout(() => otpInputs[0].focus(), 100);

  /* ══════════════════════════════════════════
     OTP — LOGIQUE DES CASES
  ══════════════════════════════════════════ */
  const otpInputs = Array.from(document.querySelectorAll('.otp-input'));

  otpInputs.forEach((inp, idx) => {
    inp.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val;
      inp.classList.toggle('filled', !!val);
      if (val && idx < 5) otpInputs[idx + 1].focus();
    });

    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && idx > 0) {
        otpInputs[idx - 1].focus();
        otpInputs[idx - 1].value = '';
        otpInputs[idx - 1].classList.remove('filled');
      }
    });

    inp.addEventListener('paste', e => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      [...pasted].slice(0, 6).forEach((ch, i) => {
        if (otpInputs[i]) { otpInputs[i].value = ch; otpInputs[i].classList.add('filled'); }
      });
      otpInputs[Math.min(pasted.length, 5)].focus();
    });
  });

  function getOtp()   { return otpInputs.map(i => i.value).join(''); }
  function clearOtp() { otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled', 'shake'); }); otpInputs[0].focus(); }
  function shakeOtp() { otpInputs.forEach(i => { i.classList.add('shake'); setTimeout(() => i.classList.remove('shake'), 450); }); }

  /* ══════════════════════════════════════════
     TIMER
     Circonférence r=18 : 2π×18 ≈ 113.1
  ══════════════════════════════════════════ */
  const CIRC = 2 * Math.PI * 18;
  let timeLeft = 60, timerInterval = null;

  function updateRing(s) {
    const fill  = document.getElementById('ring-fill');
    const label = document.getElementById('ring-label');
    fill.style.strokeDashoffset = CIRC * (1 - s / 60);
    label.textContent = s;
    const warn = s <= 15;
    fill.classList.toggle('warning', warn);
    label.classList.toggle('warning', warn);
  }

  function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 60;
    const btn = document.getElementById('resend-btn');
    btn.disabled = true;
    btn.classList.remove('active');
    updateRing(60);

    timerInterval = setInterval(() => {
      timeLeft--;
      updateRing(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        btn.disabled = false;
        btn.classList.add('active');
      }
    }, 1000);
  }

  /* ══════════════════════════════════════════
     PROGRESS BAR (même logique que user-choice)
  ══════════════════════════════════════════ */
const progressBar = document.querySelector(".progress-bar");
let step = localStorage.getItem("step") || 1;

function animateProgress(from, to, duration = 600){
    const style = document.createElement('style');
    const animName = `loadProgress${Date.now()}`;
    style.innerHTML = `
        @keyframes ${animName} { from { width: ${from}; } to { width: ${to}; } }
    `;
    document.head.appendChild(style);
    progressBar.style.animation = `${animName} ${duration}ms ease-out forwards`;
    setTimeout(() => {
        progressBar.style.width = to;
        progressBar.style.animation = '';
        style.remove();
    }, duration);
}

if(progressBar){
    if(step == "back"){
        animateProgress("50%", "25%");
        localStorage.setItem("step", 1); // reset
    } else {
        animateProgress("0%", "25%");
    }
}



//   function animateProgress(from, to, duration = 600) {
//     const bar = document.getElementById('progress-bar');
//     const style = document.createElement('style');
//     const name  = `prog${Date.now()}`;
//     style.innerHTML = `@keyframes ${name} { from { width: ${from}; } to { width: ${to}; } }`;
//     document.head.appendChild(style);
//     bar.style.animation = `${name} ${duration}ms ease-out forwards`;
//     setTimeout(() => { bar.style.width = to; bar.style.animation = ''; style.remove(); }, duration);
//   }

  /* ══════════════════════════════════════════
     ALERTES
  ══════════════════════════════════════════ */
  function showAlert(id, msg, type = 'error') {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className = `alert ${type} show`;
  }
  function clearAlerts() {
    ['alert-error', 'alert-success'].forEach(id => {
      const el = document.getElementById(id);
      el.className = 'alert';
      el.textContent = '';
    });
  }

  function showNotification(msg) {
    const notif = document.getElementById('notification');
    notif.textContent = msg;
    notif.style.display = 'block';
    setTimeout(() => { notif.style.display = 'none'; }, 3000);
  }

  /* ══════════════════════════════════════════
     APPEL API (simulation ou réel)
  ══════════════════════════════════════════ */
  async function apiCall(endpoint, body) {
    if (SIMULATION) {
      await new Promise(r => setTimeout(r, 900));
      if (endpoint === API.resend) {
        console.log(`[SIMULATION] Nouveau code envoyé à ${body.email} : ${DEMO_CODE}`);
        return { success: true };
      }
      if (endpoint === API.verify) {
        return body.code === DEMO_CODE
          ? { success: true }
          : { success: false, message: 'Code incorrect. Réessayez.' };
      }
    }
    /* ── Production (décommenter quand PHP prêt) ──
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
    */
  }

  /* ══════════════════════════════════════════
     HANDLERS
  ══════════════════════════════════════════ */
  async function handleVerify() {
    clearAlerts();
    const code = getOtp();
    if (code.length < 6) { shakeOtp(); showNotification('Entrez les 6 chiffres du code.'); return; }

    const btn = document.getElementById('verify-btn');
    btn.classList.add('loading'); btn.disabled = true;

    try {
      const data = await apiCall(API.verify, { email: currentEmail, code });
      if (data.success) {
        clearInterval(timerInterval);
        showAlert('alert-success', '✓ Code validé !', 'success');
        setTimeout(() => {
          document.getElementById('main-view').classList.add('hidden');
          document.getElementById('success-view').classList.add('show');
          animateProgress('66%', '100%');
          /* Rediriger après 1.5s */
          setTimeout(() => { window.location.href = '../html/dashboard.html'; }, 1500);
        }, 800);
      } else {
        shakeOtp(); clearOtp();
        showAlert('alert-error', data.message || 'Code incorrect.');
      }
    } catch (err) {
      showNotification('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      btn.classList.remove('loading'); btn.disabled = false;
    }
  }

  async function handleResend() {
    const btn = document.getElementById('resend-btn');
    if (btn.disabled) return;
    clearAlerts(); clearOtp();
    btn.disabled = true; btn.classList.remove('active');

    try {
      const data = await apiCall(API.resend, { email: currentEmail });
      if (data.success) {
        showAlert('alert-success', 'Nouveau code envoyé !', 'success');
        setTimeout(() => clearAlerts(), 3000);
        startTimer();
      } else {
        showNotification(data.message || 'Impossible de renvoyer.');
        btn.disabled = false; btn.classList.add('active');
      }
    } catch (err) {
      showNotification('Erreur réseau.');
      btn.disabled = false; btn.classList.add('active');
    }
  }

  function goBack() {
    localStorage.setItem('step', 'back');
    window.location.href = '../html/signUp-user.html';
  }

  /* Entrée clavier */
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleVerify();
  });