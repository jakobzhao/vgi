// lgbtqspaces API
// Utilizes the lgbtqspaces API to be deployed by Heroku to be able to
// connect with the database
"use strict";
(function() {
    window.addEventListener("load", init);

    // init function
    // added init to async (test for bugs!)
    async function init() {
        // popup to indicate that user needs to be logged in, in order to perform functions
        //let buttonValue = document.getElementsByClassName('btn btn-primary').value;
        // if user selects create button
        // first prompt signin
        // then allow event listener
        // user asycn functions

        document.querySelector("#submit-button").addEventListener('click', newUser);
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

    // status checks
    function checkStatus(response) {
        if (response.ok) {
          return response;
        } else {
          throw Error("Error in request: " + response.statusText);
        }
    }

})();