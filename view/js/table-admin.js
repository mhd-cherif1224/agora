// ==============================
// SELECTION LIGNE
// ==============================
let selectedRow = null;
const table = document.getElementById("adminTable");

table.addEventListener("click", function(e){
    let row = e.target.closest("tr");
    if(!row || row.rowIndex === 0) return;
    if(selectedRow) selectedRow.classList.remove("selected");
    selectedRow = row;
    row.classList.add("selected");
});

document.addEventListener("click", function(e){
    if(selectedRow && !e.target.closest("#adminTable tbody tr") && !e.target.closest(".buttons") && !e.target.closest(".modal-content")){
        selectedRow.classList.remove("selected");
        selectedRow = null;
    }
});


/* ==============================
MODAL AJOUT
============================== */

const modal = document.getElementById("modal");
const addBtn = document.getElementById("addBtn");
const cancelBtn = document.getElementById("cancelAdd");
const closeModal = document.querySelector(".close");

addBtn.onclick = () => { modal.style.display = "block"; };
cancelBtn.onclick = () => { modal.style.display = "none"; showNotification("Ajout annulé"); };
closeModal.onclick = cancelBtn.onclick;

/* ==============================
AJOUTER ADMIN avec PHP
============================== */

document.getElementById("confirmAdd").onclick = function(){

    let nomAdd     = document.getElementById("nomInputAdd").value.trim();
    let prenomAdd  = document.getElementById("prenomInputAdd").value.trim();
    let dateValAdd = document.getElementById("dateInputAdd").value;
    let sexeAdd    = document.getElementById("sexeInputAdd").value;
    let emailAdd   = document.getElementById("emailInputAdd").value.trim();
    let telAdd     = document.getElementById("telInputAdd").value.trim();
    let passWordAdd = document.getElementById("passWordAdd").value;
    let role       = document.getElementById("roleInputAdd").value;

    // Vérification des champs obligatoires
    if(nomAdd === "" || prenomAdd === "" || emailAdd === "" || dateValAdd === "" || passWordAdd === "" || role === ""){
        showNotification("Veuillez remplir les champs obligatoires");
        return;
    }


    fetch("../../Controller/admin-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action   : "ajouter",
            nom      : nomAdd,
            prenom   : prenomAdd,
            date     : dateValAdd,
            sexe     : sexeAdd,
            email    : emailAdd,
            tel      : telAdd,
            password : passWordAdd,
            role     : role
        })
    })
    .then(res => {
        return res.text().then(text => {
          
            try {
                return JSON.parse(text);
            } catch(e) {
                console.error("Réponse non-JSON :", text);
                throw new Error("Le serveur n'a pas renvoyé du JSON valide");
            }
        });
    })
    .then(data => {
        if(data.success){
            let tbody = document.querySelector("#adminTable tbody");
            let newRow = tbody.insertRow();
            newRow.innerHTML = `
                <td>${data.id}</td>
                <td>${nomAdd}</td>
                <td>${prenomAdd}</td>
                <td>${dateValAdd}</td>
                <td>${sexeAdd}</td>
                <td>${emailAdd}</td>
                <td>${telAdd || ''}</td>
                <td>********</td>
                <td>${role}</td>
            `;

            modal.style.display = "none";
            showNotification("Admin ajouté avec succès");

            // Reset du formulaire
            document.getElementById("nomInputAdd").value = "";
            document.getElementById("prenomInputAdd").value = "";
            document.getElementById("dateInputAdd").value = "";
            document.getElementById("emailInputAdd").value = "";
            document.getElementById("telInputAdd").value = "";
            document.getElementById("passWordAdd").value = "";
        } 
        else {
            showNotification("Erreur : " + (data.message || "Erreur inconnue"));
        }
    })
    .catch(err => {
        console.error("Erreur complète :", err);
        showNotification("Erreur de connexion au serveur ");
    });
    };
/* ===========================
MODIFIER ADMIN
============================== */

const modifierModal = document.getElementById("modifierModal");
const editBtn = document.getElementById("editBtn");

editBtn.onclick = function(){
    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner un Admin");
        return;
    }

    // Convertit DD/MM/YYYY → YYYY-MM-DD pour l'input date
    let rawDate = selectedRow.cells[3].innerText;
    let parts = rawDate.split("/");
    let formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : rawDate;

    document.getElementById("nomInput").value       = selectedRow.cells[1].innerText;
    document.getElementById("prenomInput").value    = selectedRow.cells[2].innerText;
    document.getElementById("dateInput").value      = formattedDate;
    document.getElementById("sexeInput").value      = selectedRow.cells[4].innerText;
    document.getElementById("emailInput2").value    = selectedRow.cells[5].innerText;
    document.getElementById("telInput").value       = selectedRow.cells[6].innerText;
    document.getElementById("passWordEdit").value   = "";  // vide pour sécurité
    document.getElementById("roleInputEdit").value  = selectedRow.cells[8].innerText;

    modifierModal.style.display = "block";
};

document.getElementById("confirmModifier").onclick = function(){

    let nom      = document.getElementById("nomInput").value.trim();
    let prenom   = document.getElementById("prenomInput").value.trim();
    let dateVal  = document.getElementById("dateInput").value;
    let sexe     = document.getElementById("sexeInput").value;
    let email    = document.getElementById("emailInput2").value.trim();
    let tel      = document.getElementById("telInput").value.trim();
    let passWord = document.getElementById("passWordEdit").value;
    let role     = document.getElementById("roleInputEdit").value;

    if(nom == "" || prenom == "" || email == "" || dateVal == "" || role == ""){
        showNotification("Veuillez remplir les champs obligatoires");
        return;
    }

    // Récupère l'ID de la ligne sélectionnée
    let adminId = selectedRow.cells[0].innerText;

    // Envoie les données vers le Controller PHP
    fetch("../../Controller/admin-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action  : "modifier",
            id      : adminId,   // ID indispensable pour savoir quel admin modifier
            nom     : nom,
            prenom  : prenom,
            date    : dateVal,
            sexe    : sexe,
            email   : email,
            tel     : tel,
            password: passWord,  // vide = on ne change pas le mot de passe
            role    : role
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            // Convertit YYYY-MM-DD → DD/MM/YYYY pour l'affichage
            let parts = dateVal.split("-");
            let formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateVal;

            // Met à jour la ligne dans le tableau HTML
            selectedRow.cells[1].innerText = nom;
            selectedRow.cells[2].innerText = prenom;
            selectedRow.cells[3].innerText = formattedDate;
            selectedRow.cells[4].innerText = sexe;
            selectedRow.cells[5].innerText = email;
            selectedRow.cells[6].innerText = tel;
            selectedRow.cells[8].innerText = role;

            modifierModal.style.display = "none";
            showNotification("Admin modifié avec succès");
        } else {
            showNotification("Erreur : " + data.message);
        }
    })
    .catch(err => {
        showNotification("Erreur de connexion au serveur");
        console.error(err);
    });
};

document.querySelector(".closeModifier").onclick = function(){
    modifierModal.style.display = "none";
    showNotification("Modification annulée");
};
document.querySelector("#cancelModifier").onclick = function(){
    modifierModal.style.display = "none";
    showNotification("Modification annulée");
};


/* ==============================
SUPPRESSION ADMIN — AVEC PHP
============================== */

const confirmModal = document.getElementById("confirmModal");
const deleteBtn = document.getElementById("deleteBtn");

deleteBtn.onclick = function(){
    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner un Admin");
        return;
    }
    confirmModal.style.display = "block";
};

document.getElementById("confirmYes").onclick = function(){

    // Récupère l'ID de l'admin sélectionné
    let adminId = selectedRow.cells[0].innerText;

    // Envoie la demande de suppression au PHP
    fetch("../../Controller/admin-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "supprimer",
            id    : adminId
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            // Supprime la ligne du tableau HTML
            selectedRow.remove();
            selectedRow = null;
            confirmModal.style.display = "none";
            showNotification("Admin supprimé avec succès");
        } else {
            showNotification("Erreur : " + data.message);
        }
    })
    .catch(err => {
        showNotification("Erreur de connexion au serveur");
        console.error(err);
    });
};

document.querySelector(".closeConfirm").onclick = function(){
    confirmModal.style.display = "none";
    showNotification("Suppression annulée");
};
document.getElementById("confirmNo").onclick = function(){
    confirmModal.style.display = "none";
    showNotification("Suppression annulée");
};

window.onclick = function(event){
    if(event.target === modal){ modal.style.display = "none"; showNotification("Ajout annulé"); }
    if(event.target === confirmModal){ confirmModal.style.display = "none"; showNotification("Suppression annulée"); }
    if(event.target === modifierModal){ modifierModal.style.display = "none"; showNotification("Modification annulée"); }
};


/* ==============================
NOTIFICATION
============================== */

function showNotification(message){
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "block";
    setTimeout(() => { notif.style.display = "none"; }, 3000);
}


/* ==============================
CHARGEMENT DES DONNÉES BDD
============================== */

window.onload = function(){

    // Vérifie que c'est bien un super_admin
    let role = localStorage.getItem("role");
    if(role !== "super_admin"){
        alert("Accès refusé !");
        window.location.href = "home-page-admin.html";
        return;
    }

    // Charge les admins depuis la BDD via PHP
    fetch("../../Controller/admin-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lister" })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            let tbody = document.querySelector("#adminTable tbody");
            tbody.innerHTML = ""; // Vide les données statiques HTML

            // Remplit le tableau avec les vraies données de la BDD
            data.admins.forEach(admin => {
                let row = tbody.insertRow();
                row.innerHTML = `
                    <td>${admin.ID}</td>
                    <td>${admin.nom}</td>
                    <td>${admin.prenom}</td>
                    <td>${admin.DateDeNaissance}</td>
                    <td>${admin.sexe}</td>
                    <td>${admin.email}</td>
                    <td>${admin.NumTel ?? ''}</td>
                    <td>********</td>
                    <td>${admin.role}</td>
                `;
            });
        }
    })
    .catch(err => console.error("Erreur chargement admins:", err));
};



// theme.js

(function () {
  const STORAGE_KEY = 'theme';

  // Apply saved theme immediately (prevents flicker)
  function applyThemeEarly() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }

  // Apply theme after DOM is ready (sync body + button)
  function applyTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const isDark = savedTheme === 'dark';

    document.body.classList.toggle('dark-theme', isDark);

    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
      toggleBtn.textContent = isDark ? '☀️' : '🌙';
    }
  }

  // Toggle handler
  function initToggle() {
    const toggleBtn = document.getElementById('toggleBtn');

    if (!toggleBtn) {
      console.warn('toggleBtn not found in the DOM.');
      return;
    }

    toggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');

      // Sync html element too (important if you style from root)
      document.documentElement.classList.toggle('dark-theme', isDark);

      // Save preference
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');

      // Update button icon
      toggleBtn.textContent = isDark ? '☀️' : '🌙';
    });
  }

  // Run early (before DOMContentLoaded)
  applyThemeEarly();

  // Run after DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    initToggle();
  });

})();
