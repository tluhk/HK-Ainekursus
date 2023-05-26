function closeMenu() {
  let x = document.querySelector('.closing-menu');
  x.classList.toggle('menu-zero');
}
//function to add or togle sidebar menus
const panMainContentLeft = () => {
  const x = document.querySelector('.main-wrapper');
  x.classList.toggle('left-pan');
  x.classList.remove('right-pan');
};

const panMainContentRight = () => {
  const x = document.querySelector('.main-wrapper');
  x.classList.remove('left-pan');
  x.classList.toggle('right-pan');
};

// function to close sidebar menus, when clicked outside
const remMainContent = () => {
  const x = document.querySelector('.main-wrapper');
  x.classList.remove('left-pan');
  x.classList.remove('right-pan');
};

// add class on mediaquery change
const mediaQuery = window.matchMedia('(min-width: 1024px)');
function handleTabletChange(e) {
  // Check if the media query is true
  if (e.matches) {
    let x = document.querySelector('.closing-menu');
    x.classList.toggle('menu-zero');
  }
}

/* // Register event listener
mediaQuery.addListener(handleTabletChange);

// Initial check
handleTabletChange(mediaQuery); */

// Theme switcher
function setTheme(name) {
  localStorage.setItem('theme', name);
  document.documentElement.className = name;
}

function toggleTheme() {
  if (localStorage.getItem('theme') === 'dark-theme') {
    setTheme('light-theme');
  } else {
    setTheme('dark-theme');
  }
}

(function () {
  if (localStorage.getItem('theme') === 'dark-theme') {
    setTheme('dark-theme');
  } else {
    setTheme('light-theme');
  }
})();
