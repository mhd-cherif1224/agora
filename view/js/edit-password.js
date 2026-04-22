/* ══════════════════════════════════════════
   EDIT-PASSWORD.JS
   Modification du mot de passe (flux reset)
══════════════════════════════════════════ */
const newPass    = document.getElementById('newPass');
const confPass   = document.getElementById('confPass');
const saveBtn    = document.getElementById('saveBtn');
const matchError = document.getElementById('matchError');
const matchText  = document.getElementById('matchText');
const alertBox   = document.getElementById('alertBox');
const card       = document.getElementById('card');

// ── Barre de force ──
const strengthFill  = document.getElementById('strengthFill');
const strengthLabel = document.getElementById('strengthLabel');
const levels = [
    { w: '0%',   bg: '',          txt: ''           },
    { w: '25%',  bg: '#e74c3c',   txt: 'Très faible' },
    { w: '50%',  bg: '#e67e22',   txt: 'Faible'      },
    { w: '75%',  bg: '#f1c40f',   txt: 'Moyen'       },
    { w: '100%', bg: '#1a7a46',   txt: 'Fort'        },
];

function checkStrength(pw) {
    let s = 0;
    if (pw.length >= 8)          s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    const l = levels[s];
    strengthFill.style.width      = l.w;
    strengthFill.style.background = l.bg;
    strengthLabel.textContent     = l.txt;
    strengthLabel.style.color     = l.bg || 'var(--muted)';
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

// ── Erreurs ──
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
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
}

function clearAlert() { alertBox.className = 'alert'; alertBox.textContent = ''; }
function showAlert(msg, type) { alertBox.className = 'alert ' + type; alertBox.textContent = msg; }

// ── Fermer le modal ──
function closeModal() {
    document.getElementById('successModal').classList.remove('show');
    window.location.href = 'login-user.html';
}

// ── Sauvegarde ──
// BUG CORRIGÉ : suppression du onclick="handleSave()" dans le HTML
// Le bouton est géré uniquement ici via addEventListener
async function handleSave() {
    const pw = newPass.value;
    const cp = confPass.value;

    if (!pw)           { showMatchError('Veuillez entrer un nouveau mot de passe.'); return; }
    if (pw.length < 8) { showMatchError('Au moins 8 caractères requis.');            return; }
    if (!cp)           { showMatchError('Veuillez confirmer votre mot de passe.');   return; }
    if (pw !== cp)     { showMatchError('Les mots de passe ne correspondent pas.'); return; }

    clearMatchError();
    clearAlert();
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;

    try {
        // BUG CORRIGÉ : JSON + credentials:include (le PHP lit json et reçoit le cookie session)
        const response = await fetch('../../Controller/update-password.php', {
            method:      'POST',
            credentials: 'include',
            headers:     { 'Content-Type': 'application/json' },
            body:        JSON.stringify({ password: pw })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('successModal').classList.add('show');
            setTimeout(() => { window.location.href = 'login-user.html'; }, 2500);
        } else {
            showAlert(data.message || 'Une erreur est survenue.', 'error');
        }

    } catch (err) {
        showAlert('Erreur réseau. Réessayez.', 'error');
    } finally {
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
    }
}

// BUG CORRIGÉ : un seul handler sur le bouton (pas de onclick= dans le HTML)
saveBtn.addEventListener('click', handleSave);

// Entrée clavier
[newPass, confPass].forEach(el =>
    el.addEventListener('keydown', e => { if (e.key === 'Enter') handleSave(); })
);

// ── Toggle visibilité ──
const toggle1 = document.getElementById('togglePassword1');
if (toggle1) {
    toggle1.addEventListener('click', () => {
        const isHidden = newPass.type === 'password';
        newPass.type = isHidden ? 'text' : 'password';
        toggle1.classList.replace(
            isHidden ? 'fa-eye-slash' : 'fa-eye',
            isHidden ? 'fa-eye'       : 'fa-eye-slash'
        );
    });
}

const toggle2 = document.getElementById('togglePassword2');
if (toggle2) {
    toggle2.addEventListener('click', () => {
        const isHidden = confPass.type === 'password';
        confPass.type = isHidden ? 'text' : 'password';
        toggle2.classList.replace(
            isHidden ? 'fa-eye-slash' : 'fa-eye',
            isHidden ? 'fa-eye'       : 'fa-eye-slash'
        );
    });
}