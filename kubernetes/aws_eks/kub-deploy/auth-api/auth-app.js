// ───────────────────────────────────────────────────────────────
// AUTH API: JWT Token Generation and Verification Service
// ───────────────────────────────────────────────────────────────
// This is an INTERNAL microservice for authentication
// - Generates JWT tokens for authenticated users
// - Verifies tokens for protected endpoints
// - Called by other services within the EKS cluster
// - Should NOT be exposed to the Internet (ClusterIP only)

const express = require('express');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth-routes');

const app = express();

// JSON PARSER: Parse request bodies as JSON
app.use(bodyParser.json());

// CORS: Allow cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ROUTES: Authentication endpoints (signup, login, verify-token)
app.use(authRoutes);

app.use((err, req, res, next) => {
  console.log(err);
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

// SERVER: Listen on port 3000
// This is the INTERNAL auth service (ClusterIP, not publicly accessible)
// Other services in the cluster call it via DNS: auth-service.default:3000
app.listen(3000);
