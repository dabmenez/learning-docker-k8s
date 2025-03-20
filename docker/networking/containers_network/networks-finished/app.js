// Import required modules
const express = require('express'); // Web framework for Node.js
const bodyParser = require('body-parser'); // Middleware to parse incoming JSON data
const axios = require('axios').default; // HTTP client for making API requests
const mongoose = require('mongoose'); // MongoDB object modeling tool

// Import the Favorite model for database operations
const Favorite = require('./models/favorite');

// Create an Express application
const app = express();

// Use body-parser middleware to automatically parse JSON request bodies
app.use(bodyParser.json());

// GET route to retrieve all favorite items from the database
app.get('/favorites', async (req, res) => {
  // Fetch all documents from the 'favorites' collection in MongoDB
  const favorites = await Favorite.find();
  // Respond with the retrieved favorites as JSON
  res.status(200).json({
    favorites: favorites,
  });
});

// POST route to add a new favorite item
app.post('/favorites', async (req, res) => {
  // Extract data from the request body
  const favName = req.body.name;
  const favType = req.body.type;
  const favUrl = req.body.url;

  try {
    // Validate 'type' field: It should be either 'movie' or 'character'
    if (favType !== 'movie' && favType !== 'character') {
      throw new Error('"type" should be "movie" or "character"!');
    }
    
    // Check if the favorite already exists in the database
    const existingFav = await Favorite.findOne({ name: favName });
    if (existingFav) {
      throw new Error('Favorite exists already!');
    }
  } catch (error) {
    // Return an error response if validation fails
    return res.status(500).json({ message: error.message });
  }

  // Create a new Favorite object
  const favorite = new Favorite({
    name: favName,
    type: favType,
    url: favUrl,
  });

  try {
    // Save the favorite item to the database
    await favorite.save();
    // Respond with a success message and the saved favorite item
    res
      .status(201)
      .json({ message: 'Favorite saved!', favorite: favorite.toObject() });
  } catch (error) {
    // Return an error response if something goes wrong during saving
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET route to fetch a list of movies from the Star Wars API (SWAPI)
app.get('/movies', async (req, res) => {
  try {
    // Make an API request to SWAPI for movie data
    const response = await axios.get('https://swapi.dev/api/films');
    // Respond with the retrieved movies
    res.status(200).json({ movies: response.data });
  } catch (error) {
    // Handle any errors from the API request
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET route to fetch a list of people (characters) from the Star Wars API (SWAPI)
app.get('/people', async (req, res) => {
  try {
    // Make an API request to SWAPI for character data
    const response = await axios.get('https://swapi.dev/api/people');
    // Respond with the retrieved people data
    res.status(200).json({ people: response.data });
  } catch (error) {
    // Handle any errors from the API request
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// Connect to MongoDB database (named 'swfavorites') running inside a Docker container
mongoose.connect(
  'mongodb://mongodb:27017/swfavorites', // 'mongodb' is the hostname of the MongoDB container in the Docker network
  { useNewUrlParser: true }, // Use new URL parser for MongoDB connection
  (err) => {
    if (err) {
      console.log(err); // Log error if connection fails
    } else {
      app.listen(3000); // Start the Express server on port 3000 if the database connection is successful
    }
  }
);
