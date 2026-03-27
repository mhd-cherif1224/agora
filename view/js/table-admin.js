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
    let prenomAdd   = document.getElementById("prenomInputAdd").value;
    let dateValAdd  = document.getElementById("dateInputAdd").value;
    let sexeAdd     = document.getElementById("sexeInputAdd").value;
    let emailAdd    = document.getElementById("emailInputAdd").value;
    let telAdd      = document.getElementById("telInputAdd").value;
    let passWordAdd      = document.getElementById("passWordAdd").value;
    let role    = document.getElementById("roleInputAdd").value;
    
    
    if(nomAdd == "" || prenomAdd == "" || emailAdd == "" || dateValAdd == "" || sexeAdd == "" || passWordAdd == "" || role == ""){
        showNotification("Veuillez remplir les champs");
        return;
    }

    let tbody = document.querySelector("#adminTable tbody");

    if(currentUserRole === "admin"){
        document.getElementById("roleInput").value = "admin";
        document.getElementById("roleInput").disabled = true;
    }
    let maxId = 0;
    for(let row of tbody.rows){
        let rowId = parseInt(row.cells[0].innerText);
        if(rowId > maxId) maxId = rowId;
    }

    let newRow = tbody.insertRow();
    newRow.innerHTML = `
        <td>${maxId + 1}</td>
        <td>${nomAdd}</td>
        <td>${prenomAdd}</td>
        <td>${dateValAdd}</td>
        <td>${sexeAdd}</td>
        <td>${emailAdd}</td>
        <td>${telAdd}</td>
        <td>${passWordAdd}</td>
        <td>${role}</td>
    `;

    nomAdd = "";
    prenomAdd = "";
    dateValAdd = "";
    sexeAdd = "";
    emailAdd = "";
    telAdd = "";
    passWordAdd = "";
    role = "";
    modal.style.display = "none";

    showNotification("Admin ajouté avec succès");

};


/* ==============================
MODIFIER ADMIN
============================== */

const modifierModal = document.getElementById("modifierModal");
const editBtn = document.getElementById("editBtn");

editBtn.onclick = function(){

    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner un Admin");
        return;
    }

    // Convert DD/MM/YYYY → YYYY-MM-DD for the date input
    let rawDate = selectedRow.cells[3].innerText;
    let parts = rawDate.split("/");
    let formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : rawDate;

    document.getElementById("nomInput").value    = selectedRow.cells[1].innerText;
    document.getElementById("prenomInput").value = selectedRow.cells[2].innerText;
    document.getElementById("dateInput").value   = formattedDate;
    document.getElementById("sexeInput").value   = selectedRow.cells[4].innerText;
    document.getElementById("emailInput2").value  = selectedRow.cells[5].innerText;
    document.getElementById("telInput").value    = selectedRow.cells[6].innerText;
    document.getElementById("passWordEdit").value    = selectedRow.cells[7].innerText;
    document.getElementById("roleInputEdit").value   = selectedRow.cells[8].innerText;

    modifierModal.style.display = "block";

};

document.getElementById("confirmModifier").onclick = function(){

    let nom      = document.getElementById("nomInput").value;
    let prenom   = document.getElementById("prenomInput").value;
    let dateVal  = document.getElementById("dateInput").value;
    let sexe     = document.getElementById("sexeInput").value;
    let email    = document.getElementById("emailInput2").value;
    let tel      = document.getElementById("telInput").value;
    let passWord = document.getElementById("passWordEdit").value;
    let role = document.getElementById("roleInputEdit").value;

    if(nom == "" || prenom == "" || email == "" || dateVal == "" || sexe == "" || passWord == "" || role == ""){
        showNotification("Veuillez remplir les champs");
        return;
    }

    // Convert YYYY-MM-DD → DD/MM/YYYY
    let parts = dateVal.split("-");
    let formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateVal;

    selectedRow.cells[1].innerText = nom;
    selectedRow.cells[2].innerText = prenom;
    selectedRow.cells[3].innerText = formattedDate;
    selectedRow.cells[4].innerText = sexe;
    selectedRow.cells[5].innerText = email;
    selectedRow.cells[6].innerText = tel;
    selectedRow.cells[7].innerText = passWord;
    selectedRow.cells[8].innerText = role;

    modifierModal.style.display = "none";
    showNotification("Admin modifié");

};

document.querySelector(".closeModifier").onclick = function(){
    modifierModal.style.display = "none";
    showNotification("Modification annulée");
};
document.querySelector("#cancelModifier").onclick = function(){
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
        showNotification("Il faut d'abord sélectionner un Admin");
        return;
    }
    confirmModal.style.display = "block";
};

document.getElementById("confirmYes").onclick = function(){
    selectedRow.remove();
    selectedRow = null;
    confirmModal.style.display = "none";
    showNotification("Admin supprimé");
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

// Pour la gestion entre les roles
window.onload = function(){

    let role = localStorage.getItem("role");

    if(role !== "super_admin"){
        alert("Accès refusé !");
        window.location.href = "home-page-admin.html";
    }

};