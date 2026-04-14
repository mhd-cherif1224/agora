  const newPass    = document.getElementById('newPass');
  const confPass   = document.getElementById('confPass');
  const saveBtn    = document.getElementById('saveBtn');
  const matchError = document.getElementById('matchError');
  const matchText  = document.getElementById('matchText');
  const alertBox   = document.getElementById('alertBox');
  const card       = document.getElementById('card');


  const strengthFill  = document.getElementById('strengthFill');
  const strengthLabel = document.getElementById('strengthLabel');
  const levels = [
    { w:'0%',   bg:'',          txt:'' },
    { w:'25%',  bg:'#e74c3c',   txt:'Très faible' },
    { w:'50%',  bg:'#e67e22',   txt:'Faible' },
    { w:'75%',  bg:'#f1c40f',   txt:'Moyen' },
    { w:'100%', bg:'#1a7a46',   txt:'Fort' },
  ];

  function checkStrength(pw) {
    let s = 0;
    if (pw.length >= 8)           s++;
    if (/[A-Z]/.test(pw))         s++;
    if (/[0-9]/.test(pw))         s++;
    if (/[^A-Za-z0-9]/.test(pw))  s++;
    const l = levels[s];
    strengthFill.style.width = l.w;
    strengthFill.style.background = l.bg;
    strengthLabel.textContent = l.txt;
    strengthLabel.style.color = l.bg || 'var(--muted)';
  }
  function setReq(id, ok) {
    document.getElementById(id).classList.toggle('ok', ok);
  }

  newPass.addEventListener('input', () => {
    const v = newPass.value;
    checkStrength(v);
    setReq('req-len', v.length >= 8);
    setReq('req-up',  /[A-Z]/.test(v));
    setReq('req-num', /[0-9]/.test(v));
    setReq('req-sym', /[^A-Za-z0-9]/.test(v));
    clearMatchError();
  });
  confPass.addEventListener('input', clearMatchError);

  function clearMatchError() {
    matchError.classList.remove('visible');
    confPass.style.borderColor = '';
    confPass.style.boxShadow   = '';
  }
  function showMatchError(msg) {
    matchText.textContent = msg;
    matchError.classList.add('visible');
    confPass.style.borderColor = '#e74c3c';
    confPass.style.boxShadow   = '0 0 0 3px rgba(231,76,60,.15)';
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  }
  function clearAlert() { alertBox.className = 'alert'; alertBox.textContent = ''; }
  function showAlert(msg, type) { alertBox.className = 'alert ' + type; alertBox.textContent = msg; }

  function handleSave() {
    const pw = newPass.value, cp = confPass.value;
    if (!pw)           { showMatchError('Veuillez entrer un nouveau mot de passe.'); return; }
    if (pw.length < 8) { showMatchError('Au moins 8 caractères requis.'); return; }
    if (!cp)           { showMatchError('Veuillez confirmer votre mot de passe.'); return; }
    if (pw !== cp)     { showMatchError('Les mots de passe ne correspondent pas.'); return; }

    clearMatchError(); clearAlert();
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;

    // ── Remplacer par votre vrai appel API ──
    setTimeout(() => {
      saveBtn.classList.remove('loading');
      saveBtn.disabled = false;
      document.getElementById('successModal').classList.add('show');
      setTimeout(() => { window.location.href = 'login-user.html'; }, 2500);
    }, 1800);
  }

  function closeModal() {
    document.getElementById('successModal').classList.remove('show');
  }

  [newPass, confPass].forEach(el =>
    el.addEventListener('keydown', e => { if (e.key === 'Enter') handleSave(); })
  );


  // ========================
// Toggle password visibility
// ========================
const toggle1 = document.getElementById("togglePassword1");
const passwordInput1 = document.getElementById("newPass");

toggle1.addEventListener("click", () => {
    if (passwordInput1.type === "password") {
        passwordInput1.type = "text";
        toggle1.classList.replace("fa-eye-slash", "fa-eye");
    } else {
        passwordInput1.type = "password";
        toggle1.classList.replace("fa-eye", "fa-eye-slash");
    }
});

const toggle2 = document.getElementById("togglePassword2");
const passwordInput2 = document.getElementById("confPass");

toggle2.addEventListener("click", () => {
    if (passwordInput2.type === "password") {
        passwordInput2.type = "text";
        toggle2.classList.replace("fa-eye-slash", "fa-eye");
    } else {
        passwordInput2.type = "password";
        toggle2.classList.replace("fa-eye", "fa-eye-slash");
    }
});

