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

// ==============================
// CHARGEMENT DE LA PAGE
// ==============================
window.onload = function () {

    // ── Rôle admin ──
    let role = localStorage.getItem("role");
    let btn = document.getElementById("adminTableBtn");

    if (btn) {
        if (role === "admin") {
            btn.style.opacity = "0.5";
            btn.style.pointerEvents = "none";
            btn.style.cursor = "not-allowed";
            btn.title = "Accès réservé au super administrateur";
        } else if (role === "super_admin") {
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
            btn.style.cursor = "pointer";
        }
    }

    // ── Dark theme toggle ──
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

    // ── Email utilisateur connecté ──
    let email = localStorage.getItem("email");
    document.getElementById("userName").innerText = email || "Administrateur";

    // ── STATS depuis la BDD ──
    fetch('../../Controller/stats.php')           
        .then(res => {
            if (!res.ok) throw new Error('Réponse serveur : ' + res.status);
            return res.json();
        })
        .then(data => {
            if (data.error) {
                console.error('Erreur stats BDD :', data.error);
                return;
            }
            document.getElementById('stat-users').textContent      = data.users;
            document.getElementById('stat-services').textContent   = data.services;
            document.getElementById('stat-categories').textContent = data.categories;
            document.getElementById('stat-activities').textContent = data.activities;
        })
        .catch(err => {
            console.error('Fetch stats échoué :', err);
            // Laisse les "—" en place si la requête échoue
        });
};