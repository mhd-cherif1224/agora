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
    window.location.href = "../UI/homepage/home-page.html";
});