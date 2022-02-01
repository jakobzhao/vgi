const db = require("../config/database");

// [DEVELOPING]
exports.createObservation = async (req, res) => {
    let { location, address, city, state, type, year } = req.body;
    // check if user is in database
    // const {result} = await db.query('SELECT * FROM test_observation WHERE ' +
    //                                 'name == name AND address == address AND ...')
    // if length of result is 0 then add new result
    // else display that there is already a location that is already submitted in the database

    // can write js code here that connects with the html to retrieve form responses
    let { rows } = await db.query(
        "INSERT INTO test_observation(location, address, city, state, type, year) VALUES ($1, $2, $3, $4, $5, $6)",
        [location, address, city, state, type, year]
    );

    res.status(200).send({
        message: "User and message added successfully!",
        body: {
            user: {location, address, city, state, type, year}
        },
    });
};

// /**
//  * Observations: Obtains all information in tblObservation that corresponds to the selected city
//  * @param {url} req: request form URL data passed from frontend
//  * @return res: query response of all information in database (200 if success)
//  */
exports.observations = async (req, res) => {
    let city = req.params.city;
    // Response database query:
    // SELECT * FROM "tblObservation" WHERE city = 'Seattle'
    let response = await db.query('SELECT * FROM "tblObservation" ' +
                                    'WHERE city = ' + " '" + city + "' ");
    res.status(200).send(response.rows);
};

// /**
//  * Venues: Obtains all information in tblVenue that corresponds to the user-selected city
//  * @param {url} req - request form URL data passed from frontend
//  * @return res - query response of all information in the database (200 if success)
//  */
exports.venues = async (req,res) => {
    let city = req.params.city;
    // Database query:
    // SELECT * FROM "tblVenue" WHERE city = 'Seattle'

    // year might have to change for future if becomes dynamic
    let response = await db.query('SELECT * FROM "tblVenue" v, "tblVenueSlice" s ' +
                                    'WHERE v.vid = s.vid and s.year = 2005 and city = ' + " '" + city + "' ");
    res.status(200).send(response.rows);
};

// /**
//  * Venue Slice: Obtains all information from venue slice table
//  * @param {*} req- API requeset from frontend
//  * @param {*} res- all rows in venue table
//  */
exports.venueSlice = async (req, res) => {
    let city = req.params.city;
    // database query:
    let response = await db.query('SELECT * FROM "tblVenueSlice" ' + 'WHERE city = ' + " '" + city + "' ");
    res.status(200).send(response.rows);
}


// /**
//  * Code List: Obtains all information in codelist table (containing Damron Codes that cover certain years)
//  * @param req - API request from frontend
//  * @param res - codelist information
//  */
exports.allCodes = async(req, res) => {
    let response = await db.query('SELECT * FROM codelist');
    res.status(200).send(response.rows);
};

// /**
//  * Comments/Reviews: Obtains all reviews/comments of a specific location (obtained through using vid)
//  * @param {url} req: request URL data from user selected venue/location
//  * @param {*} res: all comments of the corresponding location (vid)
//  */
exports.getComment = async (req, res) => {
    let locationId = req.params.id;
    let response = await db.query('SELECT * FROM "tblReview" ' + 'WHERE vid = ' + locationId);
    res.status(200).send(response.rows);
};

// /**
//  * Insert Comment/Review: Inserts user insert data of review into tblReview in the database
//  * @param {form} req - form body that contains user selected information
//  * @param {status} res - confirmation that comment has been added into the review table
//  */
exports.addComment = async(req, res) => {
    let {vid, review} = req.body;
    let currTime = new Date().toISOString();
    let {reviewRows} = await db.query(
        'INSERT INTO "tbl Review"(vid, content, reviewdate) VALUES ($1, $2, $3)',
        [vid, review, currTime]
    )

    res.status(200).send({
        message: "comment added into review table!",
        body: {
            review: {vid, review, currTime}
        }
    })
};

// [CURRENTLY INACTIVE]
// insert values into new venue
exports.addToVenue = async (req, res) => {
    // const userId = parseInt(req.query.id);
    // const { user_name, email, user_message} = req.body;
    try {
        let {state, city, year, type, name, address, unit, loc_notes, temp_notes, notes, latitude, longitude, codelist, geocoder, createdby} = req.body;
        codelist = "{" + codelist + "}";
        // add to venue table
        let {venueRows} = await db.query(
            'INSERT INTO venue_test(state, city, year, type, name, address, unit, loc_notes, temp_notes, notes, latitude, longitude, codelist, geocoder, createdby) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)',
            [state, city, year, type, name, address, unit, loc_notes, temp_notes, notes, latitude, longitude, codelist, geocoder, createdby]
        );

        res.status(200).send({
            message: "observation added to venue!",
            body: {
                venue: {state, city, year, type, name, address, unit, loc_notes, temp_notes, notes, latitude, longitude, codelist, geocoder, createdby}
            }
        });
        // add to venue
        // send status to check
    } catch (err) {
        console.log(err);
    };
};

// [CURRENTLY INACTIVE]
exports.deleteObservation = async (req, res) => {
    try {
        let {name, year} = req.body;
        await db.query(
            "DELETE FROM observation_test WHERE name = $1 AND year = $2",
            [name, year]
        );

        res.status(200).send({
            message: "Observation deleted from observation table.",
            body: {
                observation: {name, year}
            }
        })
    } catch (err) {
        console.log(err);
    }
};