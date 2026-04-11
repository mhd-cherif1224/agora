// ========================
// TOGGLE PASSWORD
// ========================
const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

togglePassword.addEventListener("click", function() {
    const type = password.getAttribute("type") === "password" ? "text" : "password";
    password.setAttribute("type", type);
    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
});

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
const form = document.querySelector("form");           // ← manquait !
const emailInput = document.getElementById("in-email"); // ← utilise l'id directement
const rememberCheck = document.getElementById("checkbox"); // ← c'est "checkbox" pas "check"

window.addEventListener("load", () => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheck.checked = true;
    }
});

// ========================
// SUBMIT
// ========================
form.addEventListener("submit", function(e) {
    e.preventDefault();

    const email = emailInput.value;
    const pwd   = password.value;

    if (!email || !pwd) {
        showNotification("Veuillez remplir tous les champs !", "#c0392b");
        return;
    }

    if (rememberCheck.checked) {
        localStorage.setItem("rememberedEmail", email);
    } else {
        localStorage.removeItem("rememberedEmail");
    }

    console.log("Login admin :", email);
    form.submit();
});