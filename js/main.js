// lgbtqspaces API
// Utilizes the lgbtqspaces API to be deployed by Heroku to be able to
// connect with the database
"use strict";
(function() {
    window.addEventListener("load", init);

    // init function
    // added init to async (test for bugs!)
    async function init() {
        document.querySelector('#addObservationBtn').addEventListener('click', isLoggedIn);
        document.querySelector("#submit-button").addEventListener('click', newUser);
        document.getElementById('googleSignOutBtn').addEventListener('click', () => {
            signOut();
        });

        document.getElementById('submit-edit').addEventListener('click', (e) => {
            // code to check if the submit validation is already in the database
            // if not then validate observation
            validateObservation(e);
        })
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

    // isLoggedIn()
    // Checks if user is logged in already, on button clicked to add observation.
    async function isLoggedIn() {
        try {
            document.getElementById('observation').classList.add('hidden');
            if(gapi.auth2.getAuthInstance().isSignedIn.get()) {
                // show modal
                document.getElementById('observation').classList.remove('hidden');
                console.log("signed in!");
                document.getElementById('googleSignOutBtn').addEventListener('click', () =>{
                    signOut();
                })
            } else {
                // create a simple modal to notify user have to sign in to add observation
                console.log("have to sign in to add observation");
                // prompt google login window screen
                await gapi.auth2.getAuthInstance().signIn();
                // show modal
                document.getElementById('observation').classList.remove('hidden');
            }

        } catch(err) {
            // hide observation if user is not able to log-in
            $('#observation').modal('hide');
            console.log(err);
        }
    }

    // sign out the user when clicked on sign out
    function signOut() {
        var auth2 = gapi.auth2.getAuthInstance();
        if(gapi.auth2.getAuthInstance().isSignedIn.get()) {
            auth2.signOut().then(function () {
                console.log('User has signed out.');
            });
        };
    }

    async function validateObservation (event) {
        event.preventDefault();
        // Obtain data from user input
        let data = new URLSearchParams();
        data.append("state", document.getElementById('state-edit').value);
        data.append("city", document.getElementById('city-edit').value);
        data.append("year", document.getElementById('year-edit').value);
        data.append("type", document.getElementById('type-edit').value);
        data.append("name", document.getElementById('observed-name-edit').value);
        data.append("address", document.getElementById('address-edit').value);
        data.append("unit", "");
        data.append("loc_notes", "");
        data.append("temp_notes", "");
        data.append("notes", document.getElementById('notes-edit').value);
        data.append("latitude", document.getElementById('lat-edit').value);
        data.append("longitude", document.getElementById('long-edit').value);
        data.append("codelist", document.getElementById('codelist-edit').value);
        data.append("geocoder", "mapbox");
        data.append("createdBy", "9");
        // POST fetch request
        let settings = {
            method: 'POST',
            body: data
        }

        try {
            let sendData = await fetch('https://lgbtqspaces-api.herokuapp.com/api/observationtovenue', settings);
            console.log("Observation has been confirmed. Added to the list of venues.");
        } catch(error) {
            checkStatus(error);
        }
    }

    // status checks
    function checkStatus(response) {
        if (response.ok) {
          return response;
        } else {
          throw Error("Error in request: " + response.statusText);
        }
    }

})();