// ==============================
// SELECTION LIGNE
// ==============================

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
// AJOUTER SERVICE — commenté par ton binôme, on ne touche pas
// ==============================

// document.getElementById("confirmAdd").onclick = function(){
//     ...
// };



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
    fetch("../../Controller/service-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "supprimer",
            id    : serviceId
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