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
        const data = new URLSearchParams();
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

    function signOut() {
        var auth2 = gapi.auth2.getAuthInstance();
        if(gapi.auth2.getAuthInstance().isSignedIn.get()) {
            auth2.signOut().then(function () {
                console.log('User has signed out.');
            });
        };
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