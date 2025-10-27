// ───────────────────────────────────────────────────────────────
// STORY APPLICATION: Demonstrating Persistent Storage
// ───────────────────────────────────────────────────────────────
// This application reads and writes to a file mounted as a volume,
// demonstrating how persistent volumes survive Pod restarts

const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// FILE PATH: Constructs path using environment variable from ConfigMap
// The STORY_FOLDER env var comes from the ConfigMap and defines
// where data should be stored (the mounted volume path)
const filePath = path.join(__dirname, process.env.STORY_FOLDER, 'text.txt');

app.use(bodyParser.json());

// GET /story: Reads and returns the content of the persistent file
// This demonstrates reading from a mounted volume that survives
// Pod restarts and rescheduling
app.get('/story', (req, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to open file.' });
    }
    res.status(200).json({ story: data.toString() });
  });
});

// POST /story: Appends new text to the persistent file
// Data written here will persist across Pod restarts,
// demonstrating persistent volume functionality
app.post('/story', (req, res) => {
  const newText = req.body.text;
  if (newText.trim().length === 0) {
    return res.status(422).json({ message: 'Text must not be empty!' });
  }
  fs.appendFile(filePath, newText + '\n', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Storing the text failed.' });
    }
    res.status(201).json({ message: 'Text was stored!' });
  });
});

// GET /error: Simulates application failure for testing liveness probes
app.get('/error', () => {
  process.exit(1);
});

// SERVER: Listens on port 3000
// This port is exposed by the Service (targetPort in service.yaml)
app.listen(3000);
