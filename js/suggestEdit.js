export function submitEdit() {
    document.getElementById('submit-edit').addEventListener('click', function(event) {
        let validateStatus = formValidateReportIssue(event);
        if(validateStatus) {
          reportIssue(event);
        } else {
          makeAlert('Invalid inputs, please check the form again.');
        }
    });
}

async function reportIssue(event) {
    try {
      event.preventDefault();
      // Obtain data from user input
      let packet = await import('./createObservations.js');
      let data = packet.createPackage('existingObservation');

      let settings = {
        method: 'POST',
        body: data
      }
      let response = await fetch('https://lgbtqspaces-api.herokuapp.com/api/suggest-an-edit', settings);
      if(response.status == 200) {
        makeAlert("Observation recorded! It will take some time for our team to review the information before any changes are reflected. You can now suggest another edit, or go back to the map.");
        defaultInputFields();
        document.getElementById('ground-truth-btns').classList.remove('d-none');
      }
    } catch (error) {
      console.log(error);
    }
}

function defaultInputFields () {
    let defaultCheckbox = JSON.parse(sessionStorage.getItem('defaultCheckbox'));
    let checkboxInput = document.querySelectorAll('div[id$="Verify"] input[type=checkbox]');
    checkboxInput.forEach(input => {
        if(defaultCheckbox.includes(input.id + "verify")) {
            input.checked = true;
        } else {
            input.checked = false;
        }
    })
    document.getElementById('report-issue').classList.add('d-none');
    document.getElementById('info-default').classList.remove('d-none');
}

function makeAlert(alertText) {
    let alert = document.getElementById("alert-modal");
    let alertTextBox = document.getElementById("alert-text");
    alertTextBox.innerHTML = alertText;
    $('#alert-modal').modal('show');
}

async function formValidateReportIssue(event) {
    event.preventDefault();
    let validate = await import('./formValidation.js');
    let locationValidate =  validate.isNotEmpty('observed-name-edit'),
        addressValidate = validate.isNotEmpty('address-edit'),
        cityValidate = validate.isNotEmpty('city-edit'),
        stateValidate = validate.isNotEmpty('state-edit'),
        zipValidate = validate.isValidZip('zip-edit'),
        yearValidate = validate.isValidYear('year-edit');
    return locationValidate && addressValidate && cityValidate && stateValidate && zipValidate && yearValidate;
}