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
        let db_data = await displayData();
        // only on move of left slider first
        document.getElementById('input-left').addEventListener('change', function(e) {
            let left_data = filter_data_left(e, db_data);
            console.log(left_data);
        });

        // read data
        // readContents();
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

    // obtains all the current data in database
    async function displayData(){
        try {
            let readData = await fetch('https://lgbtqspaces-api.herokuapp.com/api/contents', {method: 'GET'});
            let data = await readData.json();
            return data;
        } catch(error) {
            console.log(error);
        }
    }

    function filter_data_left(e, data) {
        var resultData = [];
        // incoming slider input value
        let left_value = parseInt(e.target.value);
        // look through data
        for (let i = 0; i < data.length; i++) {
            // if data is more than left slider value
            if(left_value <= data[i].year) {
                console.log("added");
                resultData.push(data[i]);
            }
        };
       return resultData;
    }

    // converts json input  to geojson output
    function toGEOJSON(){
        //let feature_list = [];
        console.log("check");
        // for loop
        // for (let i = 0; i  < data.length; i++) {

        // }
        // let temp = {
        //     "type": "Feature",
        //     "geometry": {
        //         "type":"Point",
        //         "coordinates" : [lat,long]
        //     },
        //     "properties": {
        //         //everything else goes here
        //     }

        // }

        // add into feature_list
        // combine with geojson final format with feature collection and feature as feature list

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