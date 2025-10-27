// ───────────────────────────────────────────────────────────────
// TASKS API: Task Management with Authentication
// ───────────────────────────────────────────────────────────────
// This service demonstrates:
// - JWT token verification via middleware
// - MongoDB Atlas integration for task storage
// - Inter-service communication (calls auth-service)
// - Protected endpoints requiring authentication

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const taskRoutes = require('./routes/task-routes');
const verifyUser = require('./middleware/user-auth');

const app = express();

// JSON PARSER: Parse request bodies as JSON
app.use(bodyParser.json());

// CORS: Allow cross-origin requests from frontend
// Note: Includes 'Authorization' header for JWT tokens
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
});

// PROTECTED ROUTES: All task routes require authentication
// The verifyUser middleware validates JWT tokens by calling auth-service
app.use(verifyUser, taskRoutes);

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

// DATABASE: Connect to external MongoDB Atlas
// MONGODB_CONNECTION_URI is set via env var in the Deployment
mongoose.connect(
  process.env.MONGODB_CONNECTION_URI,
  { useNewUrlParser: true },
  (err) => {
    if (err) {
      console.log('COULD NOT CONNECT TO MONGODB!');
    } else {
      // SERVER: Listen on port 3000
      // This port is exposed by the tasks-service LoadBalancer in EKS
      app.listen(3000);
    }
  }
);
