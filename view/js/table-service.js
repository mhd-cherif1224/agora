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
const cancelBtn    = document.getElementById("cancelBtn");
const closeModal   = document.querySelector(".closeConfirm");

deleteBtn.onclick = function(){
    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner un Service");
        return;
    }
    confirmModal.style.display = "block";
};

if(cancelBtn){
    cancelBtn.onclick = () => {
        confirmModal.style.display = "none";
        showNotification("Annulé");
    };
}

if(closeModal){
    closeModal.onclick = () => {
        confirmModal.style.display = "none";
        showNotification("Suppression annulée");
    };
}

document.getElementById("confirmYes").onclick = function(){
    let serviceId = selectedRow.cells[0].innerText;

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
            showNotification("Service supprimé avec succès ✅");
        } else {
            showNotification("Erreur : " + data.message);
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Erreur de connexion au serveur");
        console.error(err);
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
window.addEventListener("load", function(){
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
                row.innerHTML = `
                    <td>${service.ID}</td>
                    <td>${service.titre}</td>
                    <td>${service.description ?? ''}</td>
                    <td>${service.DateDePublication}</td>
                    <td>${service.status}</td>
                    <td>${service.prix}</td>
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
});

// ==============================
// DARK THEME
// ==============================
(function () {
  const STORAGE_KEY = 'theme';

  function applyThemeEarly() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }

  function applyTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const isDark = savedTheme === 'dark';

    document.body.classList.toggle('dark-theme', isDark);

    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
      toggleBtn.textContent = isDark ? '☀️' : '🌙';
    }
  }

  function initToggle() {
    const toggleBtn = document.getElementById('toggleBtn');

    if (!toggleBtn) {
      console.warn('toggleBtn not found in the DOM.');
      return;
    }

    toggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      document.documentElement.classList.toggle('dark-theme', isDark);
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
      toggleBtn.textContent = isDark ? '☀️' : '🌙';
    });
  }

  applyThemeEarly();

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    initToggle();
  });

})();