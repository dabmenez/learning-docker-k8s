// ───────────────────────────────────────────────────────────────
// AUTH API: Internal Authentication Service
// ───────────────────────────────────────────────────────────────
// This is an INTERNAL service called by other services within the cluster
// It handles token generation, verification, and password hashing
// Should NOT be exposed to the Internet (ClusterIP only)

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

// GET /verify-token/:token: Verify authentication token
// Called by other services to validate tokens
app.get('/verify-token/:token', (req, res) => {
  const token = req.params.token;

  // Dummy verification (in production, use JWT or similar)
  if (token === 'abc') {
    return res.status(200).json({ message: 'Valid token.', uid: 'u1' });
  }
  res.status(401).json({ message: 'Token invalid.' });
});

// GET /token/:hashedPassword/:enteredPassword: Generate auth token
// Validates password and returns a token
app.get('/token/:hashedPassword/:enteredPassword', (req, res) => {
  const hashedPassword = req.params.hashedPassword;
  const enteredPassword = req.params.enteredPassword;

  // Dummy password verification
  if (hashedPassword === enteredPassword + '_hash') {
    const token = 'abc';
    return res.status(200).json({ message: 'Token created.', token: token });
  }
  res.status(401).json({ message: 'Passwords do not match.' });
});

// GET /hashed-password/:password: Generate password hash
// Called by users-service during signup to hash passwords
app.get('/hashed-password/:password', (req, res) => {
  const enteredPassword = req.params.password;
  // Dummy hashing (in production, use bcrypt or similar)
  const hashedPassword = enteredPassword + '_hash';
  res.status(200).json({ hashedPassword: hashedPassword });
});

// SERVER: Listen on port 80
// This is the INTERNAL auth service (ClusterIP, not publicly accessible)
app.listen(80);
