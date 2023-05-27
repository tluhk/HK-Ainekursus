function closeMenu() {
  let x = document.querySelector('.closing-menu');
  x.classList.toggle('menu-zero');
}
//function to add or togle sidebar menus
const panMainContentLeft = () => {
  const x = document.querySelector('.main-wrapper');
  const y = document.querySelector('.side-btn-wrapper');
  x.classList.toggle('left-pan');
  x.classList.remove('right-pan');

  y.classList.toggle('left-pan');
  y.classList.remove('right-pan');
};

const panMainContentRight = () => {
  const x = document.querySelector('.main-wrapper');
  const y = document.querySelector('.side-btn-wrapper');
  x.classList.remove('left-pan');
  x.classList.toggle('right-pan');

  y.classList.remove('left-pan');
  y.classList.toggle('right-pan');
};

// function to close sidebar menus, when clicked outside
/* const remMainContent = () => {
  const x = document.querySelector('.main-wrapper');
  const y = document.querySelector('.side-btn-wrapper');
  x.classList.remove('left-pan');
  x.classList.remove('right-pan');

  y.classList.remove('left-pan');
  y.classList.remove('right-pan');
}; */

// add class on mediaquery change
const mediaQuery = window.matchMedia('(min-width: 1024px)');
function handleTabletChange(e) {
  // Check if the media query is true
  if (e.matches) {
    let x = document.querySelector('.closing-menu');
    x.classList.toggle('menu-zero');
  }
}

// scroll first horisontally then vertically, you must use it with: scrollToAnchor('myAnchor');
const scrollToAnchor = (anchorId) => {
  const anchorElement = document.getElementById(anchorId);
  if (anchorElement) {
    const horizontalOffset =
      anchorElement.getBoundingClientRect().left + window.scrollX;
    window.scrollTo({ top: window.scrollY, left: horizontalOffset });
    anchorElement.scrollIntoView({ behavior: 'smooth' });
  }
};

/* // Register event listener
mediaQuery.addListener(handleTabletChange);

// Initial check
handleTabletChange(mediaQuery); */

// ------------------------------ Theme switcher -------------------------------//
// Retrieve the HTML element
const htmlElement = document.documentElement;

// Retrieve the saved theme from local storage
const savedTheme = localStorage.getItem('theme');

// Add the saved theme class to the HTML element if it exists
if (savedTheme) {
  htmlElement.classList.add(savedTheme);
} else {
  htmlElement.classList.add('dark-theme'); // Add 'dark-theme' class by default
  localStorage.setItem('theme', 'dark-theme'); // Save the default theme in local storage
}

// Get the checkbox element
const checkbox = document.getElementById('switch');

// Function to toggle theme
function toggleTheme() {
  if (htmlElement.classList.contains('light-theme')) {
    htmlElement.classList.remove('light-theme');
    checkbox.checked = true; // Update the checkbox state first
    setTimeout(function () {
      htmlElement.classList.add('dark-theme'); // Add the new class after a short delay
      localStorage.setItem('theme', 'dark-theme');
    }, 0);
  } else {
    htmlElement.classList.add('light-theme');
    checkbox.checked = false; // Update the checkbox state first
    setTimeout(function () {
      htmlElement.classList.remove('dark-theme'); // Remove the old class after a short delay
      localStorage.setItem('theme', 'light-theme');
    }, 0);
  }
}

// Initialize the checkbox state based on the saved theme
checkbox.checked = savedTheme !== 'light-theme';

// ------------------------------ End of Theme switcher -------------------------------//

// copy the anchor link into memory for coping

document.addEventListener('DOMContentLoaded', () => {
  const anchors = document.querySelectorAll('.header-anchor');

  anchors.forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      event.preventDefault();

      const href = window.location.href;
      const anchorHref = `${href.split('#')[0]}${anchor.getAttribute('href')}`;

      copyToClipboard(anchorHref);
      alert(`Kopeerisid veebiaadressi: ${anchorHref}`);
    });
  });
});

const copyToClipboard = (text) => {
  const dummyElement = document.createElement('textarea');
  document.body.appendChild(dummyElement);
  dummyElement.value = text;
  dummyElement.select();
  document.execCommand('copy');
  document.body.removeChild(dummyElement);
};

// radiobuttons behavior in lessons pages
function handleRadioClick(value) {
  //  console.log('value1:', value);
  document.getElementById('selectedVersion').value = value;
  document.getElementById('my-form').submit();
}

function handleCourseClick(team, courseSlug) {
  const formId = `overview-${team}-${courseSlug}`;
  // console.log('formId:', formId);
  document.getElementById(formId).submit();
  // console.log('team:', team);
  // console.log('courseSlug:', courseSlug);
  document.getElementById(`overview-${team}-${courseSlug}`).submit();
}
