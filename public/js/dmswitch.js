// check which theme is choosed and if it is darl then let the mode switcher will be slected
window.onload = function() {
    var htmlElement = document.documentElement;
    var checkboxElement = document.getElementById("switch");
  
    if (htmlElement.classList.contains("light-theme")) {
      checkboxElement.checked = false;
    }
  }