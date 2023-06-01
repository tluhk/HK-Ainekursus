// check which theme is choosed and if it is dark then let the mode switcher will be selected
window.onload = function () {
  var htmlElement = document.documentElement;
  var checkboxElement = document.getElementById('switch');

  if (htmlElement.classList.contains('light-theme')) {
    checkboxElement.checked = false;
  }
};
