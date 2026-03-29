// ==============================
// SELECTION LIGNE
// ==============================
const PHP_URL = "../../controller/service-actions.php";

let selectedRow = null;
const table = document.getElementById("serviceTable");

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

    if(selectedRow && !e.target.closest("#serviceTable tbody tr") && !e.target.closest(".buttons") && !e.target.closest(".modal-content")){
        selectedRow.classList.remove("selected");
        selectedRow = null;
    }

});



// ==============================
// MODAL
// ==============================

const modal = document.getElementById("modal");
const cancelBtn = document.getElementById("deleteBtn");
const closeModal = document.querySelector(".closeConfirm");

cancelBtn.onclick = () => {
    confirmModal.style.display = "none";
    showNotification("Annulé");
};

closeModal.onclick = cancelBtn.onclick;



// ==============================
// AJOUTER SERVICE 
// ==============================
document.getElementById("confirmAdd").onclick = function () {

    const titreAdd    = document.getElementById("titreInputAdd").value.trim();
    const descriptionAdd   = document.getElementById("descriptionInputAdd").value;
    const DateDePublicationAdd  = document.getElementById("DateDePublicationInputAdd").value.trim();
    const statusAdd    = document.getElementById("statusInputAdd").value.trim();
    const prixAdd   = document.getElementById("prixInputAdd").value;
   

    if (!nomtitre || !descriptionAdd || !DateDePublicationAddAdd || !statusAdd || !prixAdd) {
        showNotification("Veuillez remplir tous les champs obligatoires");
        return;
    }

    fetch(PHP_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action:   "ajouter",
            titre:      titreAdd,
            description:   descriptionAdd,
            DateDePublication:     DateDePublicationAdd,
            status:    statusAdd,
            prix:      prixAdd,
        })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            showNotification(data.message);
            return;
        }

        const tbody  = document.querySelector("#adminTable tbody");
        const newRow = tbody.insertRow();
        newRow.innerHTML = `
            <td>${data.id}</td>
            <td>${titreAdd}</td>
            <td>${descriptionAdd}</td>
            <td>${DateDePublicationAddAdd}</td>
            <td>${statusAdd}</td>
            <td>${prixAdd}</td>
            
        `;

        document.getElementById("nomInputAdd").value    = "";
        document.getElementById("prenomInputAdd").value = "";
        document.getElementById("dateInputAdd").value   = "";
        document.getElementById("emailInputAdd").value  = "";
        document.getElementById("telInputAdd").value    = "";
        document.getElementById("passWordAdd").value    = "";
        document.getElementById("roleInputAdd").value   = "";

        modal.style.display = "none";
        showNotification("Admin ajouté avec succès ✅");
    })
    .catch(err => {
        console.error(err);
        showNotification("Erreur réseau lors de l'ajout");
    });
};



// ==============================
// SUPPRESSION SERVICE — AVEC PHP
// ==============================

const confirmModal = document.getElementById("confirmModal");

document.getElementById("deleteBtn").onclick = function(){

    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner un service");
        return;
    }

    confirmModal.style.display = "block";

};

document.getElementById("confirmYes").onclick = function(){

    // Récupère l'ID du service sélectionné
    let serviceId = selectedRow.cells[0].innerText;

    // Envoie la demande de suppression au PHP
    fetch(PHP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "supprimer",
            id    : id
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            // Supprime la ligne du tableau HTML
            selectedRow.remove();
            selectedRow = null;
            confirmModal.style.display = "none";
            showNotification("Service supprimé avec succès ✅");
        } else {
            showNotification("Erreur : " + data.message);
        }
    })
    .catch(err => {
        showNotification("Erreur de connexion au serveur");
        console.error(err);
    });

};

document.getElementById("confirmNo").onclick = function(){

    confirmModal.style.display = "none";

    showNotification("Suppression annulée");

};

document.querySelector(".close").onclick = function(){

    confirmModal.style.display = "none";

    showNotification("Suppression annulée");

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
// CHARGEMENT DES DONNÉES BDD
// ==============================

window.onload = function(){

    // Récupère le rôle depuis localStorage
    let role = localStorage.getItem("role");

    // Grise le bouton Table d'Admins si admin simple
    let btn = document.getElementById("adminTableBtn");
    if(role === "admin"){
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
    }

    // Charge les services depuis la BDD via PHP
    fetch("../../Controller/service-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lister" })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            let tbody = document.querySelector("#serviceTable tbody");
            tbody.innerHTML = ""; // Vide les données statiques HTML

            // Remplit le tableau avec les vraies données de la BDD
            data.services.forEach(service => {
                let row = tbody.insertRow();
                row.innerHTML = `
                    <td>${service.ID}</td>
                    <td>${service.titre}</td>
                    <td>${service.description}</td>
                    <td>${service.DateDePublication}</td>
                    <td>${service.status}</td>
                    <td>${service.prix}</td>
                `;
            });
        }
    })
    .catch(err => console.error("Erreur chargement services:", err));

};