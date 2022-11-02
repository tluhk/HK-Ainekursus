//let text = document.getElementById('sidebar').innerText;
//document.getElementById('sidebar').innerText = text.replace(/_/g, ' ');

// see on tekstihulk, kust ptsime vajalikku
const str = document.getElementById('sidebar').innerText;

// Nüüd eraldame sellest õige osa
const correctStr = str.split('>').pop().split('<')[0];

// ja nüüd asendame eelmises alakriipsud
const correctStrings = correctStr.replace(/_/g, ' ');
console.log(correctStrings);
