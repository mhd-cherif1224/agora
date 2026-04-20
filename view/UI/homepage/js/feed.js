// ── feed.js ──
// Handles like toggling on post cards

document.addEventListener('DOMContentLoaded', () => {

  // Delegate click events on like buttons
  document.querySelector('.feed').addEventListener('click', (e) => {
    const btn = e.target.closest('.post-action-btn[data-action="like"]');
    if (!btn) return;
    toggleLike(btn);
  });

});

function toggleLike(btn) {
  const isLiked = btn.classList.toggle('liked');
  const icon = btn.querySelector('i');
  icon.className = isLiked ? 'fa-solid fa-thumbs-up' : 'fa-regular fa-thumbs-up';

  // Update count in the post-likes bar
  const card    = btn.closest('.post-card');
  const countEl = card.querySelector('.post-likes');
  const raw     = countEl.textContent.replace(/\s/g, '').match(/[\d]+/);
  if (raw) {
    let num = parseInt(raw[0]);
    num = isLiked ? num + 1 : num - 1;
    countEl.innerHTML = `<span class="likes-icon"><i class="fa-solid fa-thumbs-up"></i></span> ${num.toLocaleString('fr')}`;
  }
}
