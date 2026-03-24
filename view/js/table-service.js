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
const addBtn = document.getElementById("addBtn");
const cancelBtn = document.getElementById("cancelAdd");
const closeModal = document.querySelector(".closeConfirm");



cancelBtn.onclick = () =>{
    confirmModal.style.display = "none";
    showNotification("Ajout annulé");
};

closeModal.onclick = cancelBtn.onclick;



// ==============================
// AJOUTER SERVICE
// ==============================

// document.getElementById("confirmAdd").onclick = function(){

//     let titre = document.getElementById("titreInput").value.trim();
//     let description = document.getElementById("descriptionInput").value.trim();
//     let date = document.getElementById("dateInput").value;
//     let statut = document.getElementById("statutInput").value.trim();
//     let prix = document.getElementById("prixInput").value;

//     if(titre === "" || description === ""){
//         showNotification("Veuillez remplir les champs obligatoires");
//         return;
//     }

//     let tbody = document.querySelector("#serviceTable tbody");

//     let maxId = 0;

//     for(let row of tbody.rows){
//         let id = parseInt(row.cells[0].innerText);
//         if(id > maxId) maxId = id;
//     }

//     let newRow = tbody.insertRow();

//     newRow.innerHTML = `
//         <td>${maxId+1}</td>
//         <td>${titre}</td>
//         <td>${description}</td>
//         <td>${date}</td>
//         <td>${statut}</td>
//         <td>${prix}</td>
//         <td>0</td>
//     `;

//     modal.style.display = "none";

//     showNotification("Service ajouté avec succès");

// };



// ==============================
// SUPPRESSION
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

    selectedRow.remove();
    selectedRow = null;

    confirmModal.style.display = "none";

    showNotification("Service supprimé");

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