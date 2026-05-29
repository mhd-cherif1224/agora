// ==============================
// DARK THEME — appliqué tôt pour éviter le flash
// ==============================
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark-theme');
    document.body && document.body.classList.add('dark-theme');
}

// ==============================
// DROPDOWN
// ==============================

const dropdown = document.querySelector(".dropdown");

document.addEventListener("click", function(event) {

    if (!dropdown.contains(event.target)) {
        dropdown.removeAttribute("open");
    }

});

// Ce code s'exécute lorsque la page est complètement chargée
window.onload = function(){

    // Récupère le rôle de l'utilisateur depuis le localStorage
    // La valeur a été stockée lors du login (super_admin ou admin)
    let role = localStorage.getItem("role");
let btn = document.getElementById("adminTableBtn");

if (btn) {
    if (role === "admin") {
        // Grise le bouton — admin simple
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
        btn.style.cursor = "not-allowed";
        btn.title = "Accès réservé au super administrateur";
    } else if (role === "super_admin") {
        // Accès complet — super admin
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
        btn.style.cursor = "pointer";
    }
}
    // ==============================
    // DARK THEME
    // ==============================
    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
        toggleBtn.textContent = localStorage.getItem('theme') === 'dark' ? '☀️' : '🌙';
        toggleBtn.addEventListener('click', function () {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            toggleBtn.textContent = isDark ? '☀️' : '🌙';
        });
    }
    // Affiche l'email de l'utilisateur connecté dans la page
    // Récupéré depuis le localStorage
    let email = localStorage.getItem("email");
    document.getElementById("userName").innerText = email;
};