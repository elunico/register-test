const selection = document.querySelector('#sport-select');
const searchBox = document.querySelector('#search-box');
const searchButton = document.querySelector('#search-button');

searchButton.onclick = function () {
  const name = searchBox.value;
  window.location = `/registrants?name=${name}`;
};

selection.onchange = function () {
  const selected = selection.options[selection.selectedIndex].value;
  window.location = `/registrants?sport=${encodeURIComponent(selected)}`;
};

let sport = new URLSearchParams(window.location.search).get('sport');
selection.value = sport ? sport : 'All';
