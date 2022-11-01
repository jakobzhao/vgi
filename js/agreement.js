"use strict";

(function () {

    window.addEventListener("load", init);

    // init function
    // added init to async (test for bugs!)
    async function init() {
        let submitButton = document.getElementById("user-response");
        submitButton.addEventListener('click', async function(event) {
            await checkResponse();
        })
    }
    
    async function checkResponse() {
        let inputButton = document.getElementById('agreement-input');
        if(inputButton.checked) {
            //send response
            let data = await fetch('https://lgbtqspaces-api.herokuapp.com/api/send-login-information');
            console.log(data);
        } else {
            //display small
            let small = document.getElementById('error-text');
            small.textContent = 'Please agree to our terms and conditions.';
        }
    }
})();
