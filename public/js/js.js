// esialgne alakriipsude asendamine tühikuga
// document
//  .querySelectorAll('#sidebar a, #sidebar h3')
//  .forEach((el) => (el.innerText = el.innerText.split('_').join(' ')));
function closeMenu() {
  let x = document.querySelector('.closing-menu');
  x.classList.toggle('top-zero');
}
