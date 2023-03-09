"use strict";

(function () {

    window.addEventListener("load", init);

    // init function
    // added init to async (test for bugs!)
    async function init() {
        let submitButton = document.getElementById("user-submit");
        submitButton.addEventListener('click', async function(event) {
            event.preventDefault();
            await checkResponse();
        })
    }

    async function checkResponse() {
        let inputButton = document.getElementById('agreement-input');
        if(!inputButton.checked) {
            //display small
            let small = document.getElementById('error-text');
            small.classList.remove('d-none');
            small.textContent = 'Please agree to our terms and conditions.';
            return;
        } else if (!grecaptcha.getResponse()){
            let small = document.getElementById('error-text');
            small.classList.remove('d-none');
            small.textContent = 'Please complete the reCaptcha verification.';
            return;
        } else {
          //send response
            if(! (document.getElementById('error-text').classList.contains('d-none'))) {
                document.getElementById('error-text').classList.add('d-none');
            }
            let data = await getData();
            let element = document.getElementById('data-pass');
            let showContent = document.getElementById('show-content');
            let agreementForm = document.getElementById('agreement-form');
            let statement = document.getElementById('statement');
            showContent.classList.remove('d-none');
            statement.classList.add('d-none');
            agreementForm.classList.add('d-none');
            element.textContent = data.password;
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
