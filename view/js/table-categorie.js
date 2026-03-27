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
AJOUTER CATEGORIE (FETCH)
============================== */

document.getElementById("confirmAdd").onclick = function(){

    let nomAdd = document.getElementById("nomInputAdd").value.trim();

    if(nomAdd === ""){
        showNotification("Veuillez remplir les champs");
        return;
    }

    fetch("../../Controller/categorie-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "ajouter",
            titre: nomAdd
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){

            let tbody = document.querySelector("#categorieTable tbody");
            let newRow = tbody.insertRow();
            newRow.innerHTML = `
                <td>${data.id}</td>
                <td>${nomAdd}</td>
            `;

            document.getElementById("nomInputAdd").value = "";
            modal.style.display = "none";
            showNotification("Catégorie ajoutée avec succès");

        } else {
            showNotification("Erreur : " + data.message);
        }
    })
    .catch(err => {
        showNotification("Erreur de connexion au serveur");
        console.error(err);
    });
};


/* ==============================
MODIFIER CATEGORIE
============================== */

const modifierModal = document.getElementById("modifierModal");
const editBtn = document.getElementById("editBtn");

editBtn.onclick = function(){

    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner une catégorie");
        return;
    }

    document.getElementById("nomInput").value = selectedRow.cells[1].innerText;
    modifierModal.style.display = "block";
};

document.getElementById("confirmModifier").onclick = function(){

    let nom = document.getElementById("nomInput").value.trim();

    if(nom === ""){
        showNotification("Veuillez remplir les champs");
        return;
    }

    let id = selectedRow.cells[0].innerText;

    fetch("../../Controller/categorie-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "modifier",
            id: id,
            titre: nom
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){

            selectedRow.cells[1].innerText = nom;
            modifierModal.style.display = "none";
            showNotification("Catégorie modifiée");

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
SUPPRESSION CATEGORIE (FETCH)
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

    let id = selectedRow.cells[0].innerText;

    fetch("../../Controller/categorie-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "supprimer",
            id: id
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){

            selectedRow.remove();
            selectedRow = null;
            confirmModal.style.display = "none";
            showNotification("Catégorie supprimée");

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


// ==============================
// CHARGEMENT AU DÉMARRAGE
// ==============================

window.onload = function(){

    let role = localStorage.getItem("role");
    let btn = document.getElementById("adminTableBtn");

    if(role === "admin"){
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
    }

    let email = localStorage.getItem("email");
    let userNameEl = document.getElementById("userName");
    if(userNameEl) {
        userNameEl.innerText = email ?? "Admin";
    }

    // FETCH — Charger les catégories depuis la BDD
    fetch("../../Controller/categorie-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lister" })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){

            let tbody = document.querySelector("#categorieTable tbody");
            tbody.innerHTML = "";

            data.categories.forEach(cat => {
                let row = tbody.insertRow();
                row.innerHTML = `
                    <td>${cat.ID}</td>
                    <td>${cat.titre}</td>
                `;
            });

        } else {
            showNotification("Erreur chargement : " + data.message);
        }
    })
    .catch(err => {
        showNotification("Erreur de connexion au serveur");
        console.error("Erreur chargement:", err);
    });
};
