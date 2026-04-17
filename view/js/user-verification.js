/* ══════════════════════════════════════════
   USER-VERIFICATION.JS
   Étape OTP : vérification du code email
══════════════════════════════════════════ */

const API = {
    verify: "../../Controller/verify-email.php",
    resend: "../../Controller/resend-code.php"
};

const currentEmail = localStorage.getItem("pendingEmail") || "utilisateur@exemple.com";

// ── Barre de progression ──
const progressBar = document.querySelector(".progress-bar");

function animateProgress(from, to, duration = 600) {
    if (!progressBar) return;
    const style    = document.createElement("style");
    const animName = `loadProg${Date.now()}`;
    style.innerHTML = `@keyframes ${animName} { from { width: ${from}; } to { width: ${to}; } }`;
    document.head.appendChild(style);
    progressBar.style.animation = `${animName} ${duration}ms ease-out forwards`;
    setTimeout(() => {
        progressBar.style.width     = to;
        progressBar.style.animation = "";
        style.remove();
    }, duration);
}

const step = localStorage.getItem("step");
if (progressBar) {
    if (step === "back") {
        animateProgress("50%", "25%");
    } else {
        animateProgress("0%", "25%");
    }
    localStorage.setItem("step", "1");
}

// ── Affichage de l'email ──
document.getElementById("email-display").textContent = currentEmail;

// ── Modal succès ──
const successModal = document.getElementById("success-view");
const modalClose   = document.getElementById("modal-close");

modalClose.onclick = () => {
    successModal.classList.remove("show");
    localStorage.setItem("step", "2");
    window.location.href = "user-choice.html";
};

successModal.onclick = (e) => {
    if (e.target === successModal) {
        successModal.classList.remove("show");
        localStorage.setItem("step", "2");
        window.location.href = "user-choice.html";
    }
};

// ── Cases OTP ──
const otpInputs = Array.from(document.querySelectorAll(".otp-input"));

otpInputs.forEach((inp, idx) => {
    inp.addEventListener("input", e => {
        const val = e.target.value.replace(/\D/g, "");
        e.target.value = val;
        inp.classList.toggle("filled", !!val);
        if (val && idx < 5) otpInputs[idx + 1].focus();
    });

    inp.addEventListener("keydown", e => {
        if (e.key === "Backspace" && !inp.value && idx > 0) {
            otpInputs[idx - 1].focus();
            otpInputs[idx - 1].value = "";
            otpInputs[idx - 1].classList.remove("filled");
        }
    });

    inp.addEventListener("paste", e => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData)
            .getData("text").replace(/\D/g, "");
        [...pasted].slice(0, 6).forEach((ch, i) => {
            if (otpInputs[i]) {
                otpInputs[i].value = ch;
                otpInputs[i].classList.add("filled");
            }
        });
        otpInputs[Math.min(pasted.length, 5)].focus();
    });
});

function getOtp()   { return otpInputs.map(i => i.value).join(""); }
function clearOtp() {
    otpInputs.forEach(i => { i.value = ""; i.classList.remove("filled", "shake"); });
    otpInputs[0].focus();
}
function shakeOtp() {
    otpInputs.forEach(i => {
        i.classList.add("shake");
        setTimeout(() => i.classList.remove("shake"), 450);
    });
}

// ── Timer ──
const CIRC = 2 * Math.PI * 18;
let timeLeft = 60, timerInterval = null;

function updateRing(s) {
    const fill  = document.getElementById("ring-fill");
    const label = document.getElementById("ring-label");
    fill.style.strokeDashoffset = CIRC * (1 - s / 60);
    label.textContent = s;
    const warn = s <= 15;
    fill.classList.toggle("warning", warn);
    label.classList.toggle("warning", warn);
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 60;
    const btn = document.getElementById("resend-btn");
    btn.disabled = true;
    btn.classList.remove("active");
    updateRing(60);

    timerInterval = setInterval(() => {
        timeLeft--;
        updateRing(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            btn.disabled = false;
            btn.classList.add("active");
        }
    }, 1000);
}

startTimer();
setTimeout(() => otpInputs[0].focus(), 100);

// ── Alertes ──
function showAlert(id, msg, type = "error") {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className   = `alert ${type} show`;
}
function clearAlerts() {
    ["alert-error", "alert-success"].forEach(id => {
        const el = document.getElementById(id);
        el.className   = "alert";
        el.textContent = "";
    });
}
function showNotification(msg) {
    const notif = document.getElementById("notification");
    notif.textContent    = msg;
    notif.style.display  = "block";
    setTimeout(() => { notif.style.display = "none"; }, 3000);
}

// ── Appel API ──
async function apiCall(endpoint, body) {
    const res = await fetch(endpoint, {
        method:      "POST",
        credentials: "include",                  // IMPORTANT : cookie de session
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`);
    return await res.json();
}

// BUG CORRIGÉ : suppression du sendCodeOnLoad()
// Le code OTP est déjà envoyé par signup-user.php.
// Le renvoyer ici écrasait le code en session → échec de vérification.

// ── Vérification du code ──
async function handleVerify() {
    clearAlerts();
    const code = getOtp();
    if (code.length < 6) {
        shakeOtp();
        showNotification("Entrez les 6 chiffres du code.");
        return;
    }

    const btn = document.getElementById("verify-btn");
    btn.classList.add("loading");
    btn.disabled = true;

    try {
        const data = await apiCall(API.verify, { email: currentEmail, code });

        if (data.success) {
            clearInterval(timerInterval);
            animateProgress("25%", "50%");

            setTimeout(() => {
                successModal.classList.add("show");
                setTimeout(() => {
                    localStorage.setItem("step", "2");
                    window.location.href = "user-choice.html";
                }, 2500);
            }, 300);

        } else {
            shakeOtp();
            clearOtp();
            showAlert("alert-error", data.message || "Code incorrect. Réessayez.");
        }

    } catch (err) {
        showNotification("Erreur réseau. Vérifiez votre connexion.");
    } finally {
        btn.classList.remove("loading");
        btn.disabled = false;
    }
}

// ── Renvoi du code ──
async function handleResend() {
    const btn = document.getElementById("resend-btn");
    if (btn.disabled) return;
    clearAlerts();
    clearOtp();
    btn.disabled = true;
    btn.classList.remove("active");

    try {
        const data = await apiCall(API.resend, { email: currentEmail });
        if (data.success) {
            showAlert("alert-success", "Nouveau code envoyé !", "success");
            setTimeout(() => clearAlerts(), 3000);
            startTimer();
        } else {
            showNotification(data.message || "Impossible de renvoyer.");
            btn.disabled = false;
            btn.classList.add("active");
        }
    } catch (err) {
        showNotification("Erreur réseau.");
        btn.disabled = false;
        btn.classList.add("active");
    }
}

// ── Bouton Retour ──
document.getElementById("back").addEventListener("click", () => {
    localStorage.setItem("step", "back");
    window.location.href = "signUp-user.html";
});

// ── Entrée clavier ──
document.addEventListener("keydown", e => {
    if (e.key === "Enter") handleVerify();
});