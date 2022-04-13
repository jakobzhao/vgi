// This document provides the connection to the database!

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();


// database configurations on the local machine
const connectionString = process.env.DATABASE_URL;

// postgres://{user}:{password}@{hostname}:{port}/{database-name}

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('connect', () => {
    console.log("Database connection success!");
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};