const selection = document.querySelector('#sport-select');
const searchBox = document.querySelector('#search-box');
const searchButton = document.querySelector('#search-button');

searchBox.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === 'Return') {
    searchButton.click();
  }
});

searchButton.addEventListener('click', function() {
  const name = searchBox.value;
  window.location = `/registrants?name=${name}`;
});

selection.addEventListener('change', function () {
  const selected = selection.options[selection.selectedIndex].value;
  window.location = `/registrants?sport=${encodeURIComponent(selected)}`;
});

let sport = new URLSearchParams(window.location.search).get('sport');
selection.value = sport ? sport : 'All';
