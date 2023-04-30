//  .querySelectorAll('#sidebar a, #sidebar h3')
//  .forEach((el) => (el.innerText = el.innerText.split('_').join(' ')));
function closeMenu() {
  let x = document.querySelector('.closing-menu');
  x.classList.toggle('menu-zero');
}

function closeSideMenu() {
  let x = document.querySelector('.aside');
  x.classList.toggle('menu-zero');
}

// add class on mediaquery change
const mediaQuery = window.matchMedia('(max-width: 1024px)');
function handleTabletChange(e) {
  // Check if the media query is true
  if (e.matches) {
    let x = document.querySelector('.aside');
    x.classList.toggle('menu-zero');
  }
}
// Register event listener
mediaQuery.addListener(handleTabletChange);

// Initial check
handleTabletChange(mediaQuery);

// dark-mode switcher

function setTheme(name) {
  localStorage.setItem("theme", name);
  document.documentElement.className = name;
}

function toggleTheme() {
  if (localStorage.getItem("theme") === "dark-theme") {
    setTheme("light-theme");
  } else {
    setTheme("dark-theme");
  }
}

(function () {
  if (localStorage.getItem("theme") === "dark-theme") {
    setTheme("dark-theme");
  } else {
    setTheme("light-theme");
  }
})();
