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
