// lgbtqspaces API
// Utilizes the lgbtqspaces API to be deployed by Heroku to be able to
// connect with the database
"use strict";
(function () {

  window.addEventListener("load", init);

  // init function
  // added init to async (test for bugs!)
  async function init() {
    document.getElementById('add-observation-container').addEventListener('click', isLoggedIn);
    document.getElementById('submit-edit').addEventListener('click', reportIssue);
    document.getElementById("submit-button").addEventListener('click', newUser);
    document.getElementById('login-btn').addEventListener('click', submitPassword);
    document.getElementById('log-out-btn').addEventListener('click', () => {
      logOut();
    });
    document.getElementById('current-year-value').addEventListener('change', () => {
      yearChange();
    });


    // layer switcher
    document.getElementById('layers-container').addEventListener('mouseenter', function (e) {
      document.getElementById('basemap-selection').classList.remove('d-none');
    })

    document.getElementById('basemap-selection').addEventListener('mouseleave', function (e) {
      document.getElementById('basemap-selection').classList.add('d-none');
    })

    // hide the loader.
    $('#loader').fadeOut("slow");

  };


  async function newUser(event) {
    event.preventDefault();
    // Obtain data from user input
    let data = new URLSearchParams();
    let checkboxes = document.querySelectorAll('input[name=myCheckBoxes]:checked');
    let result = '';
    for (let box of checkboxes) {
      result += box.value;
      result += ', ';
      box.checked = false;
    }
    if (document.getElementById('otherGrid').value.length > 0) {
      result += document.getElementById('otherGrid').value
    } else {
      result = result.slice(0, -2);
    }
    data.append("location", document.getElementById('location-api').value);
    data.append("address", document.getElementById('address-api').value);
    data.append("city", document.getElementById('city-api').value);
    data.append("state", document.getElementById('state-api').value);
    data.append("type", result);
    data.append("year", document.getElementById('current-year-value').value);
    if (requiredInputCheck()) {
      // POST fetch request
      let settings = {
        method: 'POST',
        body: data
      }
      try {
        let sendData = await fetch('https://lgbtqspaces-api.herokuapp.com/api/user_observation', settings);
        clearForm();
        makeAlert('Your observation has been successfully submitted!')
      } catch (error) {
        handleError(error);
      }
    }
  }

  async function submitPassword(e) {
    let passphraseAttempts = document.querySelectorAll('.passphrase');
    let formalizedPassphraseAttempt = "";
    let textLengths = [];

    passphraseAttempts.forEach(passphraseAttempt => {
      formalizedPassphraseAttempt += passphraseAttempt.value.toLowerCase() + " ";
      textLengths.push(passphraseAttempt.value.length);
    });

    formalizedPassphraseAttempt = formalizedPassphraseAttempt.split(' ').sort().join(' ').trim();
    if (!textLengths.includes(0)) {
      try {
        let getResult = await fetch(`https://lgbtqspaces-api.herokuapp.com/api/passphraseCheck/${formalizedPassphraseAttempt}`, {
          method: 'GET'
        });
        let result = await getResult.json();
        if (result[0]['Result'] == '0') {


          document.getElementById("login-cls-btn").click();

          let alert = document.getElementById("alert-modal");
          let alertText = document.getElementById("alert-text");
          alertText.innerHTML = "Log in successfully!";
          let alertModal = new bootstrap.Modal(alert);
          alertModal.show();

          window.setTimeout(function () {
            document.getElementById("alert-cls-btn").click();
          }, 1500);


          document.getElementById('log-in-btn').classList.toggle('d-none');
          document.getElementById('log-out-btn').classList.toggle('d-none');


        } else if (result[0]['Result'] == '1') {
          let alertText = "Incorrect passphrase, please try again.";
          makeAlert(alertText);

          let passphrases = document.getElementsByClassName("passphrase");
          passphrases[0].value = "";
          passphrases[1].value = "";
          passphrases[2].value = "";

        } else {
          console.log('error.')
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      makeAlert('There is empty space in the passphrase!');
    }
  }

  function clearForm() {
    document.getElementById('location-api').value = '';
    document.getElementById('address-api').value = '';
    document.getElementById('city-api').value = '';
    document.getElementById('state-api').value = '';
    //document.getElementById('type-api').value = '';
    document.getElementById('current-year-value').value = 2014;
  }

  // // displayLoginButton()
  // // Displays the log in Google button
  // function handleCredentialResponse(response) {
  //     // console.log("Encoded JWT ID token: " + response.credential);
  //     document.getElementById('log-in-btn').classList.toggle('d-none');
  //     document.getElementById('googlelog-out-btn').classList.toggle('d-none');
  // };

  // function displayLoginButton() {
  //     google.accounts.id.initialize({
  //         client_id: "297181745349-pqlf8v2v6biopsm6bg42js8bbvrs4ing.apps.googleusercontent.com",
  //         callback: handleCredentialResponse
  //     });
  //     google.accounts.id.renderButton(
  //         document.getElementById("log-in-btn"),
  //         { theme: "filled_black", type: "standard", size: "medium", shape: "pill", text: "signin" }  // customization attributes
  //     );
  //     google.accounts.id.prompt(); // also display the One Tap dialog
  // };



  // isLoggedIn()
  // Checks if user is logged in already, on button clicked to add observation.
  function isLoggedIn() {

    let logInView = document.getElementById('log-in-btn');

    if (logInView.classList.contains('d-none')) {
      // if contains display none, means that user is logged in
      if (!document.getElementById('report-issue').classList.contains('d-none')) {
        document.getElementById('report-issue').classList.add('d-none');
      }
      toggleLeftPanelView('add-observation');

      // if left panel is close
      // if (document.getElementById('info').classList.contains('leftCollapse')) {
      document.getElementById('info').classList.toggle('leftCollapse');

      // }
    } else {
      let alertText = "Please log in before making any contribution to this geospatial platform.";
      makeAlert(alertText);
    }
  }

  // sign out the user when clicked on sign out
  function logOut() {
    if (!(document.getElementById('add-observation').classList.contains('d-none'))) {
      let collapseState = document.getElementById('info').classList.toggle('leftCollapse');
      document.getElementById('info-close-btn').classList.toggle('info-btn-collapse');
      let btnImg = document.getElementById('leftPanelArrow');
      if (collapseState) {
        btnImg.src = './assets/imgs/open-arrow.svg';
      } else {
        btnImg.src = './assets/imgs/back-btn.svg';
      }
    };
    // google.accounts.id.disableAutoSelect();
    document.getElementById('log-in-btn').classList.toggle('d-none');
    document.getElementById('log-out-btn').classList.toggle('d-none');
  }

  async function reportIssue(event) {
    try {
      event.preventDefault();
      // Obtain data from user input
      let newVenue = new URLSearchParams();
      let checkboxes = document.querySelectorAll('input[name=myCheckBoxes]:checked');
      let result = '';
      for (let box of checkboxes) {
        result += box.value;
        result += ', ';
        box.checked = false;
      }
      result = result.slice(0, -2);
      newVenue.append("state", document.getElementById('state-edit').value);
      newVenue.append("city", document.getElementById('city-edit').value);
      newVenue.append("year", document.getElementById('year-edit').value);
      newVenue.append("type", result);
      newVenue.append("name", document.getElementById('observed-name-edit').value);
      newVenue.append("address", document.getElementById('address-edit').value);
      newVenue.append("unit", "null");
      newVenue.append("loc_notes", "null");
      newVenue.append("temp_notes", "null");
      newVenue.append("notes", document.getElementById('notes-edit').value);
      newVenue.append("latitude", document.getElementById('lat-edit').value);
      newVenue.append("longitude", document.getElementById('long-edit').value);
      newVenue.append("codelist", document.getElementById('codelist-edit').value);
      newVenue.append("geocoder", "mapbox");
      newVenue.append("createdby", "user");

      // delete the ORIGINAL SELECTED POINT in the observation table
      let nameYearData = new URLSearchParams();
      nameYearData.append("name", document.getElementById('name').textContent);
      nameYearData.append("year", document.getElementById('year-info').textContent);

      // POST fetch request
      let venueData = {
        method: 'POST',
        body: newVenue
      };

      // DELETE fetch request
      let nameYear = {
        method: 'DELETE',
        body: nameYearData
      };

      let sendData = await fetch('https://lgbtqspaces-api.herokuapp.com/api/add-venue', venueData);
      console.log("Observation has been confirmed. Added to the list of venues. Please refresh the page.");
    } catch (error) {
      checkStatus(error);
    }
  };

  // // confirmedVenues
  // // Obtain data from database that contains all the venues in the city
  // async function confirmedVenues() {
  //     try {
  //         let getVenues = await fetch('https://lgbtqspaces-api.herokuapp.com/api/all-venues', {method: 'GET'});
  //         let venueData = await getVenues.json();
  //         console.log(venueData);
  //     } catch (err) {
  //     console.log(err);
  //     }
  // };

  // status checks
  function checkStatus(response) {
    if (response.ok) {
      return response;
    } else {
      throw Error("Error in request: " + response.statusText);
    }
  }

  // Change views of year when user move the slider
  function yearChange() {
    let yearSlider = document.getElementById('current-year-value');
    let yearText = document.getElementById('year-text-label');
    yearText.innerHTML = '';
    yearText.textContent = 'Year: ' + yearSlider.value;
  }


})();



// toggleLeftPanelView()
// Parameter:
// "legend"       : Shows: DEFAULT LEFT DASHBOARD VIEW
//                   Hides: DATA PANEL, IMGS CONTAINER, VERIFICATION & REVIEW BTNS, ADD NEW OBSERVATION INFO PANEL
// "info-default"     : Shows: DATA PANEL, VERIFICATION & REVIEW BTNS, IMGS CONTAINER
//                 : Hides: DEFAULT PANEL, VERIFICATION PANEL, ADD NEW OBSERVATION INFO PANEL
// "report-issue"        : Shows: VERIFICATION PANEL
//                   Hides: DEFAULT PANEL, DATA PANEL, IMGS CONTAINER, ADD NEW OBSERVATION INFO PANEL
// "add-observation": Shows: ADD NEW OBSERVATION INFO PANEL
//                   Hides: DEFAULT PANEL, DATA PANEL, VERIFICATION & REVIEW BTNS, IMGS CONTAINER
// "ground-truth-btns"
// "type-review-box"
// "reviews-confirmation"
// "reviews-container"
function toggleLeftPanelView(elementId) {

  if (elementId != "all") {
    $("#info > div").not($("#" + elementId)).addClass('d-none');
    $('#' + elementId).removeClass('d-none');
  }

  // exceptions
  // let footer = document.getElementById('attribution');
  // footer.classList.remove('d-none');

  // process the attribution
  let attributionLeft = document.getElementById("attribution").style["left"];

  if (attributionLeft == "28em" && elementId != 'report-issue') {
    document.getElementById("attribution").style["left"] = "0em";
    document.getElementById("year-slider").style["left"] = "0em";
    document.getElementById("legend").style["left"] = "0em";

  } else {

    document.getElementById("attribution").style["left"] = "28em";
    document.getElementById("year-slider").style["left"] = "28em";
    document.getElementById("legend").style["left"] = "28em";

  }


  if (elementId == "info-default") {
    document.getElementById('ground-truth-btns').classList.remove('d-none');
  }
  if (elementId == "report-issue") {
    document.getElementById('ground-truth-btns').classList.remove('d-none');
    // document.getElementById('report-issue-btn').classList.toggle('d-none');
    // document.getElementById('add-review-btn').classList.toggle('d-none');
    // document.getElementById('go-back-btn').classList.toggle('d-none');
  }
};


function logInCheck() {


  // let logInView = document.getElementById('log-in-btn');

  if (document.getElementById('log-in-btn').classList.contains("d-none")) {
    // if contains display none, means that user is logged in
    // toggleLeftPanelView('report-issue');

    // // if left panel is close
    // if (document.getElementById('info').classList.contains('leftCollapse')) {
    //     document.getElementById('info').classList.toggle('leftCollapse');
    // }
    return true;
  } else {
    let alertText = "Please log in before making any contribution to this geospatial platform.";
    makeAlert(alertText);
    return false;

  }

  // let signInView = document.getElementById('log-in-btn');
  // // if left panel is closed
  // if (document.getElementById('info').classList.contains('leftCollapse')) {
  //   let collapseState = document.getElementById('info').classList.toggle('leftCollapse');
  //   document.getElementById('info-close-btn').classList.toggle('info-btn-collapse');
  //   let btnImg = document.getElementById('leftPanelArrow');
  //   if (collapseState) {
  //     btnImg.src = './assets/imgs/open-arrow.svg';
  //   } else {
  //     btnImg.src = './assets/imgs/back-btn.svg';
  //   }
  // }

  // if (signInView.classList.contains('d-none')) {
  //   // if contains display none, means that user is logged in
  //   toggleLeftPanelView('report-issue');
  //   return true;
  // } else {
  //   alert('Please sign in through Google first!');
  // }
  // return false;
}


function handleError(err) {
  let error = "Error happens during fetching, please try again later";
  let message = "Error reason: " + err;
  console.log(error);
  console.log(message);
}

function requiredInputCheck() {
  let location = document.getElementById('location-api').value;
  let address = document.getElementById('address-api').value;
  let city = document.getElementById('city-api').value;
  let state = document.getElementById('state-api').value;
  if (location.length == 0 || address.length == 0 || city.length == 0 || state.length == 0) {
    //
    let alertText = "Please fill the required area before submiting:<br><br> Name, Address, City and State.";
    makeAlert(alertText);
    return false;
  } else {
    return true;
  }
}

function makeAlert(alertText) {
  let alert = document.getElementById("alert-modal");
  let alertTextBox = document.getElementById("alert-text");
  alertTextBox.innerHTML = alertText;
  let alertModal = new bootstrap.Modal(alert);
  alertModal.show();
}

