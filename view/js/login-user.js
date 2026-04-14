const form = document.querySelector("form");

// ========================
// NOTIFICATIONS
// ========================
function showNotification(message, color = "#16376E") {
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.background = color;
    notif.style.display = "block";
    setTimeout(() => { notif.style.display = "none"; }, 4000);
}

// ========================
// REMEMBER ME
// ========================
const emailInput    = form.querySelector("input[type='email']");
const rememberCheck = document.getElementById("check");

window.addEventListener("load", () => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheck.checked = true;
    }
});

// ========================
// TOGGLE PASSWORD
// ========================
const toggle        = document.getElementById("togglePassword");
const passwordInput = document.getElementById("passwordInput");

toggle.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggle.classList.replace("fa-eye-slash", "fa-eye");
    } else {
        passwordInput.type = "password";
        toggle.classList.replace("fa-eye", "fa-eye-slash");
    }
});

// ========================
// STRENGTH BAR + REQUIREMENTS
// ========================
const strengthFill  = document.getElementById("strengthFill");
const strengthLabel = document.getElementById("strengthLabel");

const levels = [
    { w: "0%",   bg: "",          txt: "" },
    { w: "25%",  bg: "#e74c3c",   txt: "Très faible" },
    { w: "50%",  bg: "#e67e22",   txt: "Faible" },
    { w: "75%",  bg: "#f1c40f",   txt: "Moyen" },
    { w: "100%", bg: "#1a7a46",   txt: "Fort" },
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
    strengthLabel.style.color     = l.bg || "var(--muted)";
}

function setReq(id, ok) {
    document.getElementById(id).classList.toggle("ok", ok);
}

passwordInput.addEventListener("input", () => {
    const v = passwordInput.value;
    checkStrength(v);
    setReq("req-len", v.length >= 8);
    setReq("req-up",  /[A-Z]/.test(v));
    setReq("req-num", /[0-9]/.test(v));
    setReq("req-sym", /[^A-Za-z0-9]/.test(v));
});

// ========================
// SUBMIT
// ========================
form.addEventListener("submit", function(e) {
    e.preventDefault();

    const email    = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        showNotification("Veuillez remplir tous les champs !", "#c0392b");
        return;
    }

    if (!email.includes("@")) {
        showNotification("Entrez un email valide.", "#c0392b");
        return;
    }

    if (rememberCheck.checked) {
        localStorage.setItem("rememberedEmail", email);
    } else {
        localStorage.removeItem("rememberedEmail");
    }

    console.log("Login envoyé :", email, password);
    window.location.href = "../html/landing-page.html";
});