
const selection = document.querySelector('#sport-select');


selection.onchange = function () {
  const selected = selection.options[selection.selectedIndex].value;
  window.location = `/registrants?sport=${encodeURIComponent(selected)}`;
};

let sport = new URLSearchParams(window.location.search).get('sport');
selection.value = sport ? sport : 'All';
