// ==============================
// SELECTION LIGNE
// ==============================

let selectedRow = null;
const table = document.getElementById("teacherTable");

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

    if(selectedRow && !e.target.closest("#teacherTable tbody tr") && !e.target.closest(".buttons")){
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

addBtn.onclick = () =>{
    modal.style.display = "block";
};

cancelBtn.onclick = () =>{
    modal.style.display = "none";
    showNotification("Ajout annulé");
};

closeModal.onclick = cancelBtn.onclick;



// ==============================
// AJOUTER ENSEIGNANT
// ==============================

document.getElementById("confirmAdd").onclick = function(){

    let nom = document.getElementById("nomInput").value.trim();
    let prenom = document.getElementById("prenomInput").value.trim();
    let date = document.getElementById("dateInput").value;
    let sexe = document.getElementById("sexeInput").value.trim();
    let email = document.getElementById("emailInput").value.trim();
    let tel = document.getElementById("telInput").value.trim();
    let grade = document.getElementById("gradeInput").value.trim();
    let specialite = document.getElementById("specialiteInput").value.trim();

    if(nom === "" || prenom === "" || email === ""){
        showNotification("Veuillez remplir les champs obligatoires");
        return;
    }

    let tbody = document.querySelector("#teacherTable tbody");

    let maxId = 0;

    for(let row of tbody.rows){
        let id = parseInt(row.cells[0].innerText);
        if(id > maxId) maxId = id;
    }

    let newRow = tbody.insertRow();

    newRow.innerHTML = `
        <td>${maxId+1}</td>
        <td>${nom}</td>
        <td>${prenom}</td>
        <td>${date}</td>
        <td>${sexe}</td>
        <td>${email}</td>
        <td>${tel}</td>
        <td>${grade}</td>
        <td>${specialite}</td>
        <td>0</td>
    `;

    modal.style.display = "none";

    showNotification("Enseignant ajouté avec succès");

};



// ==============================
// SUPPRESSION
// ==============================

const confirmModal = document.getElementById("confirmModal");

document.getElementById("deleteBtn").onclick = function(){

    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner un utilisateur");
        return;
    }

    confirmModal.style.display = "block";

};

document.getElementById("confirmYes").onclick = function(){

    selectedRow.remove();
    selectedRow = null;

    confirmModal.style.display = "none";

    showNotification("Utilisateur supprimé");

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
