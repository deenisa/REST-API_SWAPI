/**
 * Express is a minimal and flexible Node.js web application framework that provides a robust set
 * of features for web and mobile applications.
 * @see {@link https://expressjs.com/}
 */
const express = require('express');

/**
 * Axios is a promise-based HTTP client for the browser and Node.js. It is used to make HTTP requests
 * to external APIs.
 * @see {@link https://axios-http.com/}
 */
const axios = require('axios');

/**
 * The `sqlite3` module is used to work with SQLite databases in Node.js.
 * @see {@link https://github.com/mapbox/node-sqlite3}
 */
const sqlite3 = require('sqlite3').verbose();

// Create an instance of the Express application.
const app = express();

// Define the port number on which the server will listen.
const port = 3000;

// Connect to the SQLite3 database (analytics.db).
const db = new sqlite3.Database('analytics.db');

// Serialize the database to ensure queries run sequentially.
db.serialize(() => {
  // Create a table if it doesn't exist to store analytics data.
  db.run('CREATE TABLE IF NOT EXISTS analytics (id INTEGER PRIMARY KEY, endpoint TEXT, timestamp DATETIME)');
});

/**
 * Middleware function to log analytics data for each incoming request.
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {function} next - Next middleware function
 */
app.use((req, res, next) => {
  /**
   * Extract the path from the request object and insert a new row into the analytics table
   * with the endpoint and current timestamp.
   */
  const { path } = req;
  db.run('INSERT INTO analytics (endpoint, timestamp) VALUES (?, datetime("now"))', [path]);
  next();
});

/**
 * Function to transform SWAPI person data into a desired format.
 * @async
 * @function
 * @param {Object} person - SWAPI person data
 * @returns {Promise<Object>} - Transformed person data
 */
const transformPersonData = async (person) => {
  // Define the structure of the transformed person data.
  const personData = {
    id: person.url.split('/').slice(-2)[0],
    name: person.name,
    birth_year: person.birth_year,
    gender: person.gender,
    height: person.height,
    weight: person.mass,
    movies: [],
  };

  // Fetch movie data for each film URL associated with the person.
  for (const filmUrl of person.films) {
    const filmResponse = await axios.get(filmUrl);
    personData.movies.push({
      title: filmResponse.data.title,
      episode: filmResponse.data.episode_id,
      director: filmResponse.data.director,
      release_date: filmResponse.data.release_date,
    });
  }

  return personData;
};

/**
 * Endpoint to search Star Wars characters by name.
 * @async
 * @route {GET} /persons
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get('/persons', async (req, res) => {
  // Extract the search query from the request parameters.
  const searchQuery = req.query.q;

  try {
    if (!searchQuery) {
      // Handle the case when no search query is provided with a 400 Bad Request response.
      res.status(400).json({ error: 'Search query is required' });
    } else {
      // Fetch data from the external API (swapi.co).
      const response = await axios.get(`https://swapi.dev/api/people/?search=${searchQuery}`);
      const results = response.data.results;

      // Transform the fetched data into the desired format.
      const personList = await Promise.all(results.map(transformPersonData));

      // Send the transformed data as a JSON response.
      res.json(personList);
    }
  } catch (error) {
    console.error(error);
    // Handle errors with a 500 Internal Server Error response.
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Endpoint to retrieve a single person by ID.
 * @async
 * @route {GET} /persons/:id
 * @param {Object} req - Express request object with person ID as a parameter
 * @param {Object} res - Express response object
 */
app.get('/persons/:id', async (req, res) => {
  // Extract the person ID from the request parameters.
  const personId = req.params.id;

  try {
    // Fetch data from the external API (swapi.co) based on the person ID.
    const response = await axios.get(`https://swapi.dev/api/people/${personId}/`);
    const personData = await transformPersonData(response.data);

    // Send the transformed person data as a JSON response.
    res.json(personData);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // Handle the case when the person is not found with a 404 Not Found response.
      res.status(404).json({ error: 'Person not found' });
    } else {
      console.error(error);
      // Handle other errors with a 500 Internal Server Error response.
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

/**
 * Start the Express server and listen on the specified port.
 */
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

/**
 * Export the transformPersonData function and the Express app for external usage.
 * @module
 */
module.exports = {
  transformPersonData,
  app
};
