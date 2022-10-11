export function isNotEmpty(elementID){
    let validated = false;
    let element = document.getElementById(elementID);
    if(element.value == null || element.value == '') {
        showError(elementID, "This field cannot be empty.");
    } else {
        validated = true;
        showSuccess(elementID, "This is valid field.");
    }
    return validated;
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