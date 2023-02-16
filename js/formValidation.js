export function isNotEmpty(elementID){
    let validated = false;
    let element = document.getElementById(elementID);
    if(element.value == null || element.value == '' || element.length == 0) {
        showError(elementID, "This field cannot be empty.");
    } else {
        validated = true;
        showSuccess(elementID, "This is valid field.");
    }
    return validated;
}

export function isValidYear(elementID) {
    let element = document.getElementById(elementID);
    return !isNaN(element.value) && isNotEmpty(elementID);
}

export function isValidZip(elementID) {
  let element = document.getElementById(elementID);
  let zipRegex = /^\d{5}$/; // regular expression for 5-digit US ZIP code
  let value = element.value.trim();
  if (value === '') {
    element.value = '00000'; // Set input value to '00000' if it's empty
    value = '00000';
  }
  return value.match(zipRegex) ? value : false;
}

function showSuccess(elementID, errMessage) {
    let small = document.querySelector(`#${elementID}-small`);
    if(small.classList.contains('d-none')) {
        small.classList.remove('d-none');
    }
    small.classList.add('validatedSuccess');
    small.textContent = errMessage;
}

function showError(elementID, errMessage) {
    let small = document.querySelector(`#${elementID}-small`);
    if(small.classList.contains('d-none')) {
        small.classList.remove('d-none');
    }
    small.classList.remove('d-none');
    small.classList.add('validatedError');
    small.textContent = errMessage;
}
