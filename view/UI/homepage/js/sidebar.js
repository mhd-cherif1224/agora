// ── sidebar.js ──
// Handles follow button toggle in the suggestions sidebar

document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.follow-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleFollow(btn));
  });

});

function toggleFollow(btn) {
  const isFollowing = btn.classList.toggle('following');
  btn.textContent = isFollowing ? '✓ Suivi' : '+ Suivre';
}

const seeAllBtn       = document.getElementById('seeAllBtn');
const listPreview     = document.getElementById('suggestListPreview');
const listAll         = document.getElementById('suggestListAll');
let showingAll        = false;

seeAllBtn.addEventListener('click', e => {
    e.preventDefault();
    showingAll = !showingAll;
    if (showingAll) {
        listPreview.style.display = 'none';
        listAll.style.display     = 'flex';
        seeAllBtn.textContent     = '← réduire les suggestions';
    } else {
        listAll.style.display     = 'none';
        listPreview.style.display = 'flex';
        seeAllBtn.textContent     = 'voir tous les suggestions →';
    }
});

