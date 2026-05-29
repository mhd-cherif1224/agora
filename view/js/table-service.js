// ==============================
// SÉCURITÉ — ÉCHAPPEMENT HTML
// ==============================
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/\r\n|\n/g, "<br>");
}


// ==============================
// SELECTION LIGNE
// ==============================
let selectedRow = null;
const table = document.getElementById("serviceTable");

table.addEventListener("click", function(e){
    let row = e.target.closest("tr");
    if(!row || row.rowIndex === 0) return;
    if(selectedRow) selectedRow.classList.remove("selected");
    selectedRow = row;
    row.classList.add("selected");
});

document.addEventListener("click", function(e){
    if(
        selectedRow &&
        !e.target.closest("#serviceTable tbody tr") &&
        !e.target.closest(".buttons") &&
        !e.target.closest(".modal-content")
    ){
        selectedRow.classList.remove("selected");
        selectedRow = null;
    }
});


// ==============================
// SUPPRESSION SERVICE — AVEC PHP
// ==============================
const confirmModal = document.getElementById("confirmModal");
const deleteBtn    = document.getElementById("deleteBtn");

deleteBtn.onclick = function(){
    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner un Service");
        return;
    }
    confirmModal.style.display = "block";
};

document.querySelector(".closeConfirm").onclick = function(){
    confirmModal.style.display = "none";
    showNotification("Suppression annulée");
};

document.getElementById("confirmYes").onclick = function(){
    // ✅ Récupération de l'ID via data-id (fiable peu importe le contenu des cellules)
    let serviceId = selectedRow.getAttribute("data-id");

    fetch("../../Controller/service-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "supprimer", id: serviceId })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            selectedRow.remove();
            selectedRow = null;
            confirmModal.style.display = "none";
            showNotification("Service supprimé avec succès");
        } else {
            showNotification("Erreur : " + data.message);
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Erreur de connexion au serveur");
    });
};

document.getElementById("confirmNo").onclick = function(){
    confirmModal.style.display = "none";
    showNotification("Suppression annulée");
};

window.addEventListener("click", function(event){
    if(event.target === confirmModal){
        confirmModal.style.display = "none";
        showNotification("Suppression annulée");
    }
});


// ==============================
// NOTIFICATION
// ==============================
function showNotification(message){
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "block";
    setTimeout(() => { notif.style.display = "none"; }, 3000);
}


// ==============================
// CHARGEMENT DES DONNÉES
// ==============================
window.onload = function(){

    // ✅ Rôle — avec null check
    let role = localStorage.getItem("role");
    let btn = document.getElementById("adminTableBtn");

    if(btn){
        if(role === "admin"){
            btn.style.opacity = "0.5";
            btn.style.pointerEvents = "none";
            btn.style.cursor = "not-allowed";
            btn.title = "Accès réservé au super administrateur";
        } else if(role === "super_admin"){
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        }
    }

    fetch("../../Controller/service-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lister" })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            let tbody = document.querySelector("#serviceTable tbody");
            tbody.innerHTML = "";

            data.services.forEach(service => {
                let row = tbody.insertRow();
                // ✅ Stockage de l'ID dans data-id pour une récupération fiable
                row.setAttribute("data-id", service.ID);
                row.innerHTML = `
                    <td>${service.ID}</td>
                    <td>${escapeHtml(service.titre)}</td>
                    <td>${escapeHtml(service.description)}</td>
                    <td>${escapeHtml(service.DateDePublication)}</td>
                    <td>${escapeHtml(service.status)}</td>
                    <td>${escapeHtml(service.prix)}</td>
                `;
            });
        } else {
            showNotification("Erreur chargement données");
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Erreur serveur");
    });
};


// ==============================
// DARK THEME
// ==============================
(function () {
    const STORAGE_KEY = 'theme';

    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
    }

    document.addEventListener('DOMContentLoaded', function () {
        const toggleBtn = document.getElementById('toggleBtn');
        if (!toggleBtn) return;

        toggleBtn.textContent = localStorage.getItem(STORAGE_KEY) === 'dark' ? '☀️' : '🌙';

        toggleBtn.addEventListener('click', function () {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
            toggleBtn.textContent = isDark ? '☀️' : '🌙';
        });
    });
})();