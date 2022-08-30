// lgbtqspaces API
// Utilizes the lgbtqspaces API to be deployed by Heroku to be able to
// connect with the database
"use strict";
(function () {
    window.addEventListener("load", init);

    // init function
    // added init to async (test for bugs!)
    async function init() {
        document.querySelector('#observation-parent').addEventListener('click', isLoggedIn);
        document.getElementById('submit-edit').addEventListener('click', validateObservation);
        document.querySelector("#submit-button").addEventListener('click', newUser);
        document.getElementById('logOutBtn').addEventListener('click', () => {
            signOut();
        });
        document.getElementById('year-api').addEventListener('change', () => {
            yearChange();
        });
        let basemapDisplay = document.getElementById('basemap-selection');
        let layersDisplay = document.getElementById('layers-container');
        layersDisplay.addEventListener('mouseenter', function (e) {
            basemapDisplay.classList.remove('d-none');
        })

        basemapDisplay.addEventListener('mouseleave', function (e) {
            basemapDisplay.classList.add('d-none');
        })

        //displayLoginButton();
        toggleLeftPanelView('references-container');

    };

    // function promptLogin(event){
    //     event.preventDefault();
    //     $("#myModal").modal('show');
    //     document.querySelector("#submit-button").addEventListener('click', newUser);

    // };

    async function newUser(event) {
        event.preventDefault();
        // Obtain data from user input
        let data = new URLSearchParams();
        data.append("location", document.getElementById('location-api').value);
        data.append("address", document.getElementById('address-api').value);
        data.append("city", document.getElementById('city-api').value);
        data.append("state", document.getElementById('state-api').value);
        data.append("type", document.getElementById('type-api').value);
        data.append("year", document.getElementById('submit-year').value);
        // POST fetch request
        let settings = {
            method: 'POST',
            body: data
        }

        try {
            let sendData = await fetch('https://lgbtqspaces-api.herokuapp.com/api/user_observation', settings);
            clearForm();
            console.log("User has been added to the database");
        } catch (error) {
            checkStatus(error);
        }
    }

    function clearForm() {
        document.getElementById('location-api').value = '';
        document.getElementById('address-api').value = '';
        document.getElementById('city-api').value = '';
        document.getElementById('state-api').value = '';
        document.getElementById('type-api').value = '';
        document.getElementById('submit-year').value = '';
    }

    // // displayLoginButton()
    // // Displays the log in Google button
    // function handleCredentialResponse(response) {
    //     // console.log("Encoded JWT ID token: " + response.credential);
    //     document.getElementById('logInBtn').classList.toggle('d-none');
    //     document.getElementById('googlelogOutBtn').classList.toggle('d-none');
    // };

    // function displayLoginButton() {
    //     google.accounts.id.initialize({
    //         client_id: "297181745349-pqlf8v2v6biopsm6bg42js8bbvrs4ing.apps.googleusercontent.com",
    //         callback: handleCredentialResponse
    //     });
    //     google.accounts.id.renderButton(
    //         document.getElementById("logInBtn"),
    //         { theme: "filled_black", type: "standard", size: "medium", shape: "pill", text: "signin" }  // customization attributes
    //     );
    //     google.accounts.id.prompt(); // also display the One Tap dialog
    // };



    // isLoggedIn()
    // Checks if user is logged in already, on button clicked to add observation.
    function isLoggedIn() {

        let signInView = document.getElementById('logInBtn');
        // if left panel is closed
        if (document.getElementById('info').classList.contains('leftCollapse')) {
            let collapseState = document.getElementById('info').classList.toggle('leftCollapse');
            document.getElementById('info-close-btn').classList.toggle('info-btn-collapse');
            let btnImg = document.getElementById('leftPanelArrow');
            if (collapseState) {
                btnImg.src = './assets/imgs/open-arrow.svg';
            } else {
                btnImg.src = './assets/imgs/back-btn.svg';
            }
        }

        if (signInView.classList.contains('d-none')) {
            // if contains display none, means that user is logged in
            toggleLeftPanelView('add-observation');
        } else {
            let alert = document.getElementById("alert-modal");
            let alertText = document.getElementById("alert-text");
            alertText.innerHTML = "Please log in before making any contribution to this geospatial platform.";
            let alertModal = new bootstrap.Modal(alert);
            alertModal.show();
        }
    }

    // sign out the user when clicked on sign out
    function signOut() {
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
        document.getElementById('logInBtn').classList.toggle('d-none');
        document.getElementById('logOutBtn').classList.toggle('d-none');
    }

    async function validateObservation(event) {
        try {
            event.preventDefault();
            // Obtain data from user input
            let newVenue = new URLSearchParams();
            newVenue.append("state", document.getElementById('state-edit').value);
            newVenue.append("city", document.getElementById('city-edit').value);
            newVenue.append("year", document.getElementById('year-edit').value);
            newVenue.append("type", document.getElementById('type-edit').value);
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
        let yearSlider = document.getElementById('year-api');
        let yearText = document.getElementById('year-text-label');
        yearText.innerHTML = '';
        yearText.textContent = 'Year: ' + yearSlider.value;
    }
})();