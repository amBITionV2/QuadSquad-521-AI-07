const btn = document.getElementById('footer-btn');
const names = document.getElementById('footer-names');

btn.addEventListener('click', () => {
  names.classList.toggle('hidden');
});
