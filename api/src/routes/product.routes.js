// All of our routers, and functionabilities that we are going to perform
// add user, delete user, names, etc...

const router = require('express-promise-router')();
const productController = require('../controllers/product.controller');

// function to enable user login

// create new observation!
router.post('/user_observation', productController.createObservation);

// get contents in the observations within city only
router.get('/observations/:city', productController.observations);

// get contents in the venue table within city only
router.get('/venues/:city', productController.venues);

// get contents in the venue slice table within city query only
router.get('/venueSlice/:city', productController.venueSlice);

// add new venue
router.post('/add-venue', productController.addToVenue);

// remove observation from observation table
router.delete('/deleteObservation', productController.deleteObservation);

// get all comments from comment table
router.get('/comment/:id', productController.getComment);

// create new comment
router.post('/add-comment', productController.addComment);

router.get('/all-codes', productController.allCodes);

module.exports = router;