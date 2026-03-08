// // table admin

// ==============================
// SELECTION LIGNE
// ==============================
let selectedRow = null;
const table = document.getElementById("adminTable");

table.addEventListener("click", function(e){
    let row = e.target.closest("tr");

    if(!row || row.rowIndex === 0) return;

    if(selectedRow){
        selectedRow.classList.remove("selected");
    }

    selectedRow = row;
    row.classList.add("selected");
});

// Désélection si clic en dehors d'une ligne (sauf boutons)
document.addEventListener("click", function(e){
    if(selectedRow && !e.target.closest("#adminTable tbody tr") && !e.target.closest(".buttons")){
        selectedRow.classList.remove("selected");
        selectedRow = null;
    }
});

/* ==============================
MODAL
============================== */

const modal = document.getElementById("modal");
const addBtn = document.getElementById("addBtn");
const cancelBtn = document.getElementById("cancelAdd");
const closeModal = document.querySelector(".close");

addBtn.onclick = () =>{
    modal.style.display = "block";
};

cancelBtn.onclick = () =>{
    modal.style.display = "none";
    showNotification("Ajout annulé");
};

closeModal.onclick = () => {
    modal.style.display = "none";
    showNotification("Ajout annulé");
};

/* ==============================
AJOUTER ADMIN
============================== */

const confirmAdd = document.getElementById("confirmAdd");

confirmAdd.onclick = function(){
    let email = document.getElementById("emailInput").value.trim();
    let password = document.getElementById("passwordInput").value.trim();

    if(email === "" || password === ""){
        showNotification("Veuillez remplir les champs");
        return;
    }

    // Sélection du tbody
    let tbody = document.querySelector("#adminTable tbody");

    // Calculer le prochain ID réel
    let maxId = 0;
    for(let row of tbody.rows){
        let rowId = parseInt(row.cells[0].innerText);
        if(rowId > maxId) maxId = rowId;
    }
    let id = maxId + 1;

    // Créer la ligne et ajouter le contenu
    let newRow = tbody.insertRow();
    newRow.innerHTML = `
        <td>${id}</td>
        <td>${email}</td>
        <td>${password}</td>
    `;

    // Réinitialiser le formulaire et fermer le modal
    document.getElementById("emailInput").value = "";
    document.getElementById("passwordInput").value = "";
    modal.style.display = "none";

    showNotification("Admin ajouté avec succès");
};


// ==============================
// MODAL CONFIRMATION SUPPRESSION
// ==============================
const confirmModal = document.getElementById("confirmModal");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");
const closeConfirm = document.querySelector(".closeConfirm");
const deleteBtn = document.getElementById("deleteBtn");

deleteBtn.onclick = function(){
    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner un Admin");
        return;
    }

    confirmModal.style.display = "block";
};

confirmYes.onclick = function(){
    selectedRow.remove();
    selectedRow = null;
    confirmModal.style.display = "none";
    showNotification("Admin supprimé");
};

confirmNo.onclick = closeConfirm.onclick = function(){
    confirmModal.style.display = "none";
    showNotification("Suppression annulée");
};

// Fermer si clic en dehors du modal
window.onclick = function(event){
    if(event.target === modal){
        modal.style.display = "none";
        showNotification("Ajout annulé");
    }
    if(event.target === confirmModal){
        confirmModal.style.display = "none";
        showNotification("Suppression annulée");
    }
};

// ==============================
// NOTIFICATION
// ==============================
function showNotification(message){
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "block";

    setTimeout(() => {
        notif.style.display = "none";
    }, 3000);
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