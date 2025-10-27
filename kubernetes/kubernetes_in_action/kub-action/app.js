// ───────────────────────────────────────────────────────────────
// EXAMPLE APPLICATION: Liveness Probe Demonstration
// ───────────────────────────────────────────────────────────────

const express = require('express');

const app = express();

// MAIN ROUTE: Responds with simple HTML
app.get('/', (req, res) => {
  res.send(`
    <h1>!Hello from this NodeJS app!</h1>
    <p>Try sending a request to /error and see what happens</p>
  `);
});

// ERROR ROUTE: Simulates container failure to test Liveness Probe
// When called, terminates the process (exit code 1 = error)
// Kubernetes detects this and automatically restarts the Pod
app.get('/error', (req, res) => {
  process.exit(1);
});

// SERVER: Listens on port 8080
// IMPORTANT: This port must match the targetPort in the Service
app.listen(8080);
