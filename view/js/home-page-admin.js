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

    // Sélectionne le bouton "Table d'Admins" sur la page
    let btn = document.getElementById("adminTableBtn");

    // Si l'utilisateur est un admin simple (pas super_admin)
    if(role === "admin"){
        // On grise le bouton pour montrer qu'il n'est pas cliquable
        btn.style.opacity = "0.5";

        // On désactive complètement le clic sur le bouton
        btn.style.pointerEvents = "none";
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