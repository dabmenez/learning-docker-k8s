// ───────────────────────────────────────────────────────────────
// USERS API: Main Entry Point for User Management
// ───────────────────────────────────────────────────────────────
// This service demonstrates:
// - Integration with MongoDB Atlas (external database)
// - CORS configuration for cross-origin requests
// - Error handling middleware
// - Connecting to the auth-service for authentication

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const userRoutes = require('./routes/user-routes');

const app = express();

// JSON PARSER: Parse request bodies as JSON
app.use(bodyParser.json());

// CORS: Allow cross-origin requests from frontend
// Configures headers to allow browsers to make requests from different origins
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ROUTES: User-related endpoints
app.use(userRoutes);

app.use((err, req, res, next) => {
  let code = 500;
  let message = 'Something went wrong.';
  if (err.code) {
    code = err.code;
  }

  if (err.message) {
    message = err.message;
  }
  res.status(code).json({ message: message });
});

// DATABASE: Connect to MongoDB Atlas (external managed database)
// MONGODB_CONNECTION_URI is set via env var in the Deployment
// This demonstrates using an external service (not in Kubernetes)
mongoose.connect(
  process.env.MONGODB_CONNECTION_URI,
  { useNewUrlParser: true },
  (err) => {
    if (err) {
      console.log('COULD NOT CONNECT TO MONGODB!');
    } else {
      // SERVER: Listen on port 3000
      // This port is exposed by the users-service LoadBalancer in EKS
      app.listen(3000);
    }
  }
);
