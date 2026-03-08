// ==============================
// DROPDOWN
// ==============================

const dropdown = document.querySelector(".dropdown");

document.addEventListener("click", function(event) {

    if (!dropdown.contains(event.target)) {
        dropdown.removeAttribute("open");
    }

});