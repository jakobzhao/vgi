// lgbtqspaces API
// Utilizes the lgbtqspaces API to be deployed by Heroku to be able to
// connect with the database
"use strict";
(function() {
    window.addEventListener("load", init);

    // init function
    // added init to async (test for bugs!)
    async function init() {
        document.querySelector('#observation-parent').addEventListener('click', isLoggedIn);
        document.getElementById('submit-edit').addEventListener('click', validateObservation);
        document.querySelector("#submit-button").addEventListener('click', newUser);
        document.getElementById('googleSignOutBtn').addEventListener('click', () => {
            signOut();
        });

        let basemapDisplay = document.getElementById('basemap-selection');
        let layersDisplay = document.getElementById('layers-container');
        layersDisplay.addEventListener('mouseenter', function(e) {
            basemapDisplay.classList.remove('d-none');
        })

        basemapDisplay.addEventListener('mouseleave', function(e){
            basemapDisplay.classList.add('d-none');
        })

        // damron code dropdown toggle
        let dmCodeBtn = document.getElementById('damron-code-btn');
        let mainButtons = [];
        let smallButtons = [];
        mainButtons.push(document.getElementById('dropdown-container'));
        mainButtons.push(document.getElementById('dropdown-container1'));
        smallButtons.push(document.getElementById('secondDropdown-container'));
        smallButtons.push(document.getElementById('secondDropdown-container1'));
        smallButtons.push(document.getElementById('secondDropdown-container2'));
        smallButtons.push(document.getElementById('secondDropdown-container3'));
        smallButtons.push(document.getElementById('secondDropdown-container4'));
        smallButtons.push(document.getElementById('secondDropdown-container5'));

        dmCodeBtn.addEventListener('click', function(e){
            let selectionDiv = document.getElementById('dropdown-container');
            removeScenes([mainButtons[1]]);
            removeScenes(smallButtons);
            selectionDiv.classList.toggle('d-none');
        });

        let dmCodeDesBtn = document.getElementById('EntryDescriptors');
        dmCodeDesBtn.addEventListener('click', function(e){
            let selectionDiv = document.getElementById('secondDropdown-container');
            removeScenes(smallButtons);
            selectionDiv.classList.toggle('d-none')
        })

        let dmCodeDesBtn1 = document.getElementById('UserDescriptors');
        dmCodeDesBtn1.addEventListener('click', function(e){
            let selectionDiv = document.getElementById('secondDropdown-container1');
            removeScenes(smallButtons);
            selectionDiv.classList.toggle('d-none')
        })

        let dmCodeDesBtn2 = document.getElementById('AmenityDescriptors');
        dmCodeDesBtn2.addEventListener('click', function(e){
            let selectionDiv = document.getElementById('secondDropdown-container2');
            removeScenes(smallButtons);
            selectionDiv.classList.toggle('d-none')
        })

        let dmCodeDesBtn3 = document.getElementById('CautionDescriptors');
        dmCodeDesBtn3.addEventListener('click', function(e){
            let selectionDiv = document.getElementById('secondDropdown-container3');
            removeScenes(smallButtons);
            selectionDiv.classList.toggle('d-none')
        })

        let dmCodeDesBtn4 = document.getElementById('OrganizationDescriptors');
        dmCodeDesBtn4.addEventListener('click', function(e){
            let selectionDiv = document.getElementById('secondDropdown-container4');
            removeScenes(smallButtons);
            selectionDiv.classList.toggle('d-none')
        })


        let dmCodeDesBtn5 = document.getElementById('OtherDescriptors');
        dmCodeDesBtn5.addEventListener('click', function(e){
            let selectionDiv = document.getElementById('secondDropdown-container5');
            removeScenes(smallButtons);
            selectionDiv.classList.toggle('d-none')
        })

        let dmCodeBtn1 = document.getElementById('damron-code-btn1');
        dmCodeBtn1.addEventListener('click', function(e){
            let selectionDiv = document.getElementById('dropdown-container1');
            removeScenes([mainButtons[0]]);
            removeScenes(smallButtons);
            selectionDiv.classList.toggle('d-none');
        });

        //displayLoginButton();
        toggleLeftPanelView('references-container');
   };

    function removeScenes(buttons) {
        for (var btn of buttons) {
         btn.classList.add('d-none');
        }
    }
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
        } catch(error) {
            checkStatus(error);
        }
    }

    function clearForm() {
        document.getElementById('location-api').value='';
        document.getElementById('address-api').value='';
        document.getElementById('city-api').value='';
        document.getElementById('state-api').value='';
        document.getElementById('type-api').value='';
        document.getElementById('submit-year').value='';
    }

    // // displayLoginButton()
    // // Displays the log in Google button
    // function handleCredentialResponse(response) {
    //     // console.log("Encoded JWT ID token: " + response.credential);
    //     document.getElementById('signInBtn').classList.toggle('d-none');
    //     document.getElementById('googleSignOutBtn').classList.toggle('d-none');
    // };

    // function displayLoginButton() {
    //     google.accounts.id.initialize({
    //         client_id: "297181745349-pqlf8v2v6biopsm6bg42js8bbvrs4ing.apps.googleusercontent.com",
    //         callback: handleCredentialResponse
    //     });
    //     google.accounts.id.renderButton(
    //         document.getElementById("signInBtn"),
    //         { theme: "filled_black", type: "standard", size: "medium", shape: "pill", text: "signin" }  // customization attributes
    //     );
    //     google.accounts.id.prompt(); // also display the One Tap dialog
    // };



    // isLoggedIn()
    // Checks if user is logged in already, on button clicked to add observation.
    function isLoggedIn() {

        let signInView = document.getElementById('signInBtn');
        // if left panel is closed
        if( document.getElementById('info').classList.contains('leftCollapse')) {
            let collapseState = document.getElementById('info').classList.toggle('leftCollapse');
            document.getElementById('info-close-btn').classList.toggle('info-btn-collapse');
            let btnImg = document.getElementById('leftPanelArrow');
            if(collapseState) {
              btnImg.src = './assets/imgs/open-arrow.svg';
            } else {
              btnImg.src = './assets/imgs/back-btn.svg';
            }
        }

        if(signInView.classList.contains('d-none')) {
            // if contains display none, means that user is logged in
            toggleLeftPanelView('add-observation');
        } else {
            alert('Please sign in first!');
        }
    }

    // sign out the user when clicked on sign out
    function signOut() {
        if ( !(document.getElementById('add-observation').classList.contains('d-none')) ) {
            let collapseState = document.getElementById('info').classList.toggle('leftCollapse');
            document.getElementById('info-close-btn').classList.toggle('info-btn-collapse');
            let btnImg = document.getElementById('leftPanelArrow');
            if(collapseState) {
              btnImg.src = './assets/imgs/open-arrow.svg';
            } else {
              btnImg.src = './assets/imgs/back-btn.svg';
            }
        };
        google.accounts.id.disableAutoSelect();
        document.getElementById('signInBtn').classList.toggle('d-none');
        document.getElementById('googleSignOutBtn').classList.toggle('d-none');
    }

    async function validateObservation (event) {
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
            let nameYear =  {
                method: 'DELETE',
                body: nameYearData
            };

            let sendData = await fetch('https://lgbtqspaces-api.herokuapp.com/api/add-venue', venueData);
            console.log("Observation has been confirmed. Added to the list of venues. Please refresh the page.");
        } catch(error) {
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

})();