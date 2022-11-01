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
            if(! (document.getElementById('error-text').classList.contains('d-none'))) {
                document.getElementById('error-text').classList.add('d-none');
            }
            let data = await getData();
            let element = document.getElementById('data-pass');
            let showContent = document.getElementById('show-content');
            showContent.classList.remove('d-none');
            element.textContent = data.password;
        } else {
            if(! (document.getElementById('show-content').classList.contains('d-none'))) {
                document.getElementById('show-content').classList.add('d-none');
            }
            //display small
            let small = document.getElementById('error-text');
            small.classList.remove('d-none');
            small.textContent = 'Please agree to our terms and conditions.';
        }
    }

    async function getData() {
        try {
            let data = await fetch('https://lgbtqspaces-api.herokuapp.com/api/send-login-information', {method: 'GET'});
            let dataJSON = await data.json();
            return dataJSON[0];
        } catch (err) {
            console.log(err);
        }
    }
})();
