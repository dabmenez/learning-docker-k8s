// ───────────────────────────────────────────────────────────────
// USERS API: Main Entry Point for the Application
// ───────────────────────────────────────────────────────────────
// This service demonstrates microservices networking by calling
// the internal auth-service using Service DNS names

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();

app.use(bodyParser.json());

// POST /signup: Create a new user account
// This demonstrates calling an internal service (auth) via DNS
app.post('/signup', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Input validation
  if (
    !password ||
    password.trim().length === 0 ||
    !email ||
    email.trim().length === 0
  ) {
    return res
      .status(422)
      .json({ message: 'An email and password needs to be specified!' });
  }

  try {
    // INTER-SERVICE CALL: Calling auth-service via DNS
    // AUTH_ADDRESS is set via env var in the Deployment
    // This demonstrates how microservices communicate within the cluster
    const hashedPW = await axios.get(`http://${process.env.AUTH_ADDRESS}/hashed-password/` + password);
    console.log(hashedPW, email);
    res.status(201).json({ message: 'User created!' });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: 'Creating the user failed - please try again later.' });
  }
});

// POST /login: Authenticate and get a token
// Demonstrates token-based authentication with internal auth-service
app.post('/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (
    !password ||
    password.trim().length === 0 ||
    !email ||
    email.trim().length === 0
  ) {
    return res
      .status(422)
      .json({ message: 'An email and password needs to be specified!' });
  }

  // Dummy password hashing (in production, this would query a database)
  const hashedPassword = password + '_hash';
  
  // CALL AUTH-SERVICE: Request authentication token
  // AUTH_SERVICE_SERVICE_HOST is auto-injected by Kubernetes
  // Note: This uses the Service DNS name for internal communication
  const response = await axios.get(
    `http://${process.env.AUTH_SERVICE_SERVICE_HOST}/token/` + hashedPassword + '/' + password
  );
  
  if (response.status === 200) {
    return res.status(200).json({ token: response.data.token });
  }
  return res.status(response.status).json({ message: 'Logging in failed!' });
});

// SERVER: Listen on port 8080
// This port is exposed by the users-service LoadBalancer
app.listen(8080);
