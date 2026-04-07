console.log('step au chargement:', localStorage.getItem('step'));



/* ══════════════════════════════════════════
   CONFIG
══════════════════════════════════════════ */
const API = {
  verify: '../../Controller/verify-email.php',
  resend: '../../Controller/resend-code.php'
};

const currentEmail = localStorage.getItem('pendingEmail') || 'utilisateur@exemple.com';

/* ══════════════════════════════════════════
   PROGRESS BAR
══════════════════════════════════════════ */
const progressBar = document.querySelector('.progress-bar');

function animateProgress(from, to, duration = 600) {
  if (!progressBar) return;
  const style    = document.createElement('style');
  const animName = `loadProg${Date.now()}`;
  style.innerHTML = `@keyframes ${animName} { from { width: ${from}; } to { width: ${to}; } }`;
  document.head.appendChild(style);
  progressBar.style.animation = `${animName} ${duration}ms ease-out forwards`;
  setTimeout(() => {
    progressBar.style.width = to;
    progressBar.style.animation = '';
    style.remove();
  }, duration);
}

const step = localStorage.getItem('step');

if (progressBar) {
  if (step === 'back') {
    animateProgress('50%', '25%');
    localStorage.setItem('step', 1);
  } else {
    animateProgress('0%', '25%');
  }
}

/* ══════════════════════════════════════════
   INITIALISATION
══════════════════════════════════════════ */
document.getElementById('email-display').textContent = currentEmail;

/* ══════════════════════════════════════════
   MODAL — REFERENCES & FERMETURE
══════════════════════════════════════════ */
const successModal = document.getElementById('success-view');
const modalClose   = document.getElementById('modal-close');

/* Le × ferme le modal et redirige immédiatement */
modalClose.onclick = () => {
  successModal.classList.remove('show');
  localStorage.setItem('step', 2);
  window.location.href = 'user-choice.html';
};

/* Clic sur l'overlay (en dehors de la boîte) — même comportement */
successModal.onclick = (e) => {
  if (e.target === successModal) {
    successModal.classList.remove('show');
    localStorage.setItem('step', 2);
    window.location.href = 'user-choice.html';
  }
};

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
   TIMER  (r=18 → circonférence ≈ 113.1)
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

startTimer();
setTimeout(() => otpInputs[0].focus(), 100);

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
   APPEL API RÉEL
══════════════════════════════════════════ */
async function apiCall(endpoint, body) {
  const res = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`);
  return await res.json();
}

/* ══════════════════════════════════════════
   ENVOI DU CODE AU CHARGEMENT DE LA PAGE
══════════════════════════════════════════ */
(async function sendCodeOnLoad() {
  if (step === 'back') return;
  try {
    await apiCall(API.resend, { email: currentEmail });
  } catch (err) {
    showNotification("Impossible d'envoyer le code. Vérifiez votre connexion.");
  }
})();

/* ══════════════════════════════════════════
   HANDLERS
══════════════════════════════════════════ */
async function handleVerify() {
  clearAlerts();
  const code = getOtp();
  if (code.length < 6) { shakeOtp(); showNotification('Entrez les 6 chiffres du code.'); return; }

  const btn = document.getElementById('verify-btn');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const data = await apiCall(API.verify, { email: currentEmail, code });

    if (data.success) {
      /*  Code valide → stopper le timer, animer la barre, afficher le modal */
      clearInterval(timerInterval);
      animateProgress('25%', '50%');

      setTimeout(() => {
        successModal.classList.add('show'); /* modal visible */
        /* Redirection automatique après 2,5 secondes */
        setTimeout(() => {
          localStorage.setItem('step', 2);
          window.location.href = 'user-choice.html';
        }, 2500);
      }, 300);

    } else {
      /* Code invalide → secouer + message d'erreur */
      shakeOtp();
      clearOtp();
      showAlert('alert-error', data.message || 'Code incorrect. Réessayez.');
    }

  } catch (err) {
    showNotification('Erreur réseau. Vérifiez votre connexion.');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

async function handleResend() {
  const btn = document.getElementById('resend-btn');
  if (btn.disabled) return;
  clearAlerts(); clearOtp();
  btn.disabled = true;
  btn.classList.remove('active');

  try {
    const data = await apiCall(API.resend, { email: currentEmail });
    if (data.success) {
      showAlert('alert-success', 'Nouveau code envoyé !', 'success');
      setTimeout(() => clearAlerts(), 3000);
      startTimer();
    } else {
      showNotification(data.message || 'Impossible de renvoyer.');
      btn.disabled = false;
      btn.classList.add('active');
    }
  } catch (err) {
    showNotification('Erreur réseau.');
    btn.disabled = false;
    btn.classList.add('active');
  }
}

document.getElementById('back').addEventListener('click', () => {
  localStorage.setItem('step', 'back');
  window.location.href = 'signUp-user.html';
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleVerify();
});