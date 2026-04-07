// ========================
// PROGRESS BAR
// ========================
const progressBar = document.querySelector(".progress-bar");
let step = localStorage.getItem("step") || 2;

function animateProgress(from, to, duration = 600){
    const style = document.createElement('style');
    const animName = `loadProgress${Date.now()}`;
    style.innerHTML = `
        @keyframes ${animName} {
            from { width: ${from}; }
            to { width: ${to}; }
        }
    `;
    document.head.appendChild(style);
    progressBar.style.animation = `${animName} ${duration}ms ease-out forwards`;

    setTimeout(() => {
        progressBar.style.width = to;
        progressBar.style.animation = '';
        style.remove();
    }, duration);
}

if(progressBar){
    if(step === "back"){
        animateProgress("100%", "60%");
        localStorage.setItem("step", 2);
    } else {
        animateProgress("30%", "60%");
    }
}

function showError(inputId,message){
    const input = document.getElementById(inputId);
    input.classList.add("error");
    let oldError = input.parentElement.querySelector(".error-message");
    if(oldError) oldError.remove();
    const error = document.createElement("div");
    error.className="error-message"; error.innerText=message;
    input.parentElement.appendChild(error);
}

function clearErrors(){
    document.querySelectorAll(".error").forEach(el=>el.classList.remove("error"));
    document.querySelectorAll(".error-message").forEach(el=>{if(el.id!=="date-error") el.remove();});
    const dateError=document.getElementById("date-error"); if(dateError) dateError.innerText="";
}

function showDateError(message){document.getElementById("date-error").innerText=message;}

document.getElementById("continueBtn").addEventListener("click",()=>{
    clearErrors();
    let nom=document.getElementById("nom").value.trim();
    let prenom=document.getElementById("prenom").value.trim();
    let sexe=document.getElementById("sexe").value;
    let jour=document.getElementById("jour").value.trim();
    let mois=document.getElementById("mois").value.trim();
    let annee=document.getElementById("annee").value.trim();
    let hasError=false;

    if(!nom){showError("nom","*Entrez un nom*"); hasError=true;}
    if(!prenom){showError("prenom","*Entrez un prénom*"); hasError=true;}
    if(sexe=="- choisissez -"){showError("sexe","*Choisissez un sexe*"); hasError=true;}
    if(!jour || !mois || !annee){
        showDateError("*Complétez toute la date*");
        if(!jour) document.getElementById("jour").classList.add("error");
        if(!mois) document.getElementById("mois").classList.add("error");
        if(!annee) document.getElementById("annee").classList.add("error");
        hasError=true;
    }
    if(hasError) return;

    let day=parseInt(jour,10), month=parseInt(mois,10), year=parseInt(annee,10);
    if(isNaN(day)||isNaN(month)||isNaN(year)){
        showDateError("*La date doit contenir uniquement des chiffres*");
        if(isNaN(day)) document.getElementById("jour").classList.add("error");
        if(isNaN(month)) document.getElementById("mois").classList.add("error");
        if(isNaN(year)) document.getElementById("annee").classList.add("error");
        return;
    }

    const mois30=[4,6,9,11];
    if(month<1||month>12){ showDateError("*Choisissez un mois entre 1 et 12*"); document.getElementById("mois").classList.add("error"); return;}
    if(mois30.includes(month)&&day>30){ showDateError("*Ce mois contient maximum 30 jours*"); document.getElementById("jour").classList.add("error"); return;}
    if(!mois30.includes(month)&&month!==2&&day>31){ showDateError("*Ce mois contient maximum 31 jours*"); document.getElementById("jour").classList.add("error"); return;}
    if(month===2&&day>29){ showDateError("*Février max 29 jours*"); document.getElementById("jour").classList.add("error"); return;}

    let currentYear=new Date().getFullYear();
    if(year<1900||year>currentYear){ showDateError(`La date est invalide (année entre 1900 et ${currentYear})`); document.getElementById("annee").classList.add("error"); return;}

    localStorage.setItem("nom",nom);
    localStorage.setItem("prenom",prenom);
    localStorage.setItem("sexe",sexe);
    localStorage.setItem("date_naissance",`${jour.padStart(2,'0')}/${mois.padStart(2,'0')}/${annee}`);
    localStorage.setItem("step",3);
    window.location.href="photo-profil.html";
});

document.getElementById("back").addEventListener("click",()=>{
    localStorage.setItem("step","back");
    window.location.href="user-choice.html";
});

