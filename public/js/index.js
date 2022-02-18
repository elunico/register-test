const nameInput = document.querySelector('input[name="name"]');
const emailInput = document.querySelector('input[name="email"]');
const submitButton = document.querySelector('input[type="submit"]');

submitButton.setAttribute('disabled', true);

nameInput.addEventListener('input', () => {
  nameInput.value.length < 2 ? submitButton.setAttribute('disabled', true) : submitButton.removeAttribute('disabled');
});

emailInput.addEventListener('input', () => {
  !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(emailInput.value) ? submitButton.setAttribute('disabled', true) : submitButton.removeAttribute('disabled');
});
