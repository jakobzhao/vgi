// lgbtqspaces API
// Utilizes the lgbtqspaces API to be deployed by Heroku to be able to
// connect with the database
// CURRENT STATUS: testing locally through ngrok links

"use strict";
(function() {
    window.addEventListener("load", init);

    // init function
    function init() {
        // popup to indicate that user needs to be logged in, in order to perform functions
        //let buttonValue = document.getElementsByClassName('btn btn-primary').value;
        // if user selects create button
        // first prompt signin
        // then allow event listener
        // user asycn functions

        document.querySelector("#submit-button").addEventListener('click', newUser);
        // read data

    };

    // function promptLogin(event){
    //     event.preventDefault();
    //     $("#myModal").modal('show');
    //     document.querySelector("#submit-button").addEventListener('click', newUser);

    // };

    // create new user function
    function newUser(event) {
        event.preventDefault();

        // Organize form data
        const data = new URLSearchParams();
        data.append("location", document.getElementById('location').value);
        data.append("address", document.getElementById('address').value);
        data.append("city", document.getElementById('city').value);
        data.append("state", document.getElementById('state').value);
        data.append("type", document.getElementById('type').value);
        data.append("year", document.getElementById('submit-year').value);

        // fetch address currently from given site hosted through ngrok
        fetch('https://4cadc62d185c.ngrok.io/api/user', {method: 'POST', body: data})
            .then(checkStatus)
            .then(response => response.text())
            .then(responseMessage)
            //.catch(handleError);
    }

    function responseMessage() {
        console.log("User has been added to the database.");
    }

    // delete specified user
    //function deleteUser() {
        // get ID from form insert data
        // use id to match with api function call
        // fetch
        // console.log status update
    //}

    // status checks
    function checkStatus(response) {
        if (response.ok) {
          return response;
        } else {
          throw Error("Error in request: " + response.statusText);
        }
    }

})();