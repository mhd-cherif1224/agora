// ==============================
// SELECTION LIGNE
// ==============================

let selectedRow = null;
const table = document.getElementById("postTable");

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

if(selectedRow && !e.target.closest("#postTable tbody tr") && !e.target.closest(".buttons")){
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
const closeModal = document.querySelector(".close");



cancelBtn.onclick = () =>{
    modal.style.display = "none";
    showNotification("Ajout annulé");
};

closeModal.onclick = cancelBtn.onclick;



// ==============================
// AJOUTER POST
// ==============================

document.getElementById("confirmAdd").onclick = function(){

    let titre = document.getElementById("titreInput").value.trim();
    let description = document.getElementById("descriptionInput").value.trim();
    let date = document.getElementById("dateInput").value;
    let statut = document.getElementById("statutInput").value.trim();
    let prix = document.getElementById("prixInput").value;

    if(titre === "" || description === ""){
        showNotification("Veuillez remplir les champs obligatoires");
        return;
    }

    let tbody = document.querySelector("#postTable tbody");

    let maxId = 0;

    for(let row of tbody.rows){
        let id = parseInt(row.cells[0].innerText);
        if(id > maxId) maxId = id;
    }

    let newRow = tbody.insertRow();

    newRow.innerHTML = `
        <td>${maxId+1}</td>
        <td>${titre}</td>
        <td>${description}</td>
        <td>${date}</td>
        <td>${statut}</td>
        <td>${prix}</td>
        <td>0</td>
    `;

    modal.style.display = "none";

    showNotification("Post ajouté avec succès");

};



// ==============================
// SUPPRESSION
// ==============================

const confirmModal = document.getElementById("confirmModal");

document.getElementById("deleteBtn").onclick = function(){

    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner un post");
        return;
    }

    confirmModal.style.display = "block";

};

document.getElementById("confirmYes").onclick = function(){

    selectedRow.remove();
    selectedRow = null;

    confirmModal.style.display = "none";

    showNotification("Post supprimé");

};

document.getElementById("confirmNo").onclick = function(){

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
