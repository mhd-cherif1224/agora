// ==============================
// SELECTION LIGNE
// ==============================
let selectedRow = null;
const table = document.getElementById("categorieTable");

table.addEventListener("click", function(e){
    let row = e.target.closest("tr");

    if(!row || row.rowIndex === 0) return;

    if(selectedRow){
        selectedRow.classList.remove("selected");
    }

    selectedRow = row;
    row.classList.add("selected");
});

document.addEventListener("click", function(e){
    if(selectedRow && !e.target.closest("#categorieTable tbody tr") && !e.target.closest(".buttons") && !e.target.closest(".modal-content")){
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

addBtn.onclick = () => {
    modal.style.display = "block";
};

cancelBtn.onclick = () => {
    modal.style.display = "none";
    showNotification("Ajout annulé");
};


closeModal.onclick = cancelBtn.onclick;


/* ==============================
AJOUTER ADMIN
============================== */

document.getElementById("confirmAdd").onclick = function(){
    
    let nomAdd      = document.getElementById("nomInputAdd").value;

    if(nomAdd == ""){
        showNotification("Veuillez remplir les champs");
        return;
    }

    let tbody = document.querySelector("#categorieTable tbody");

    let maxId = 0;
    for(let row of tbody.rows){
        let rowId = parseInt(row.cells[0].innerText);
        if(rowId > maxId) maxId = rowId;
    }

    let newRow = tbody.insertRow();
    newRow.innerHTML = `
        <td>${maxId + 1}</td>
        <td>${nomAdd}</td>
    `;

    nomAdd = "";
    modal.style.display = "none";

    showNotification("Catégorie ajoutée avec succès");

};


/* ==============================
MODIFIER ADMIN
============================== */

const modifierModal = document.getElementById("modifierModal");
const editBtn = document.getElementById("editBtn");

editBtn.onclick = function(){

    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner une catégorie");
        return;
    }

    document.getElementById("nomInput").value  = selectedRow.cells[1].innerText;

    modifierModal.style.display = "block";

};

document.getElementById("confirmModifier").onclick = function(){

    let nom  = document.getElementById("nomInput").value;

    if(nom == ""){
        showNotification("Veuillez remplir les champs");
        return;
    }

    selectedRow.cells[1].innerText = nom;

    modifierModal.style.display = "none";
    showNotification("Catégorie modifiée");

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
SUPPRESSION ADMIN
============================== */

const confirmModal = document.getElementById("confirmModal");
const deleteBtn = document.getElementById("deleteBtn");

deleteBtn.onclick = function(){
    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner une catégorie");
        return;
    }
    confirmModal.style.display = "block";
};

document.getElementById("confirmYes").onclick = function(){
    selectedRow.remove();
    selectedRow = null;
    confirmModal.style.display = "none";
    showNotification("Catégorie supprimée");
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
    if(event.target === modal){
        modal.style.display = "none";
        showNotification("Ajout annulé");
    }
    if(event.target === confirmModal){
        confirmModal.style.display = "none";
        showNotification("Suppression annulée");
    }
    if(event.target === modifierModal){
        modifierModal.style.display = "none";
        showNotification("Modification annulée");
    }
};


/* ==============================
NOTIFICATION
============================== */

function showNotification(message){
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "block";

    setTimeout(() => {
        notif.style.display = "none";
    }, 3000);
}

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

    // Affiche l'email de l'utilisateur connecté dans la page
    // Récupéré depuis le localStorage
    let email = localStorage.getItem("email");
    document.getElementById("userName").innerText = email;
};