// ───────────────────────────────────────────────────────────────
// TASKS API: Task Management Service with Authentication
// ───────────────────────────────────────────────────────────────
// This service demonstrates:
// 1. Calling an internal auth-service for token verification
// 2. Using persistent volumes for data storage
// 3. Service-to-service communication via DNS

const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// FILE PATH: Constructed using environment variable from Deployment
// Points to a persistent volume where tasks are stored
const filePath = path.join(__dirname, process.env.TASKS_FOLDER, 'tasks.txt');

const app = express();

app.use(bodyParser.json());

// CORS: Allow cross-origin requests from frontend
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
})

// MIDDLEWARE: Extract and verify authentication token
// This demonstrates calling the internal auth-service via Service DNS
const extractAndVerifyToken = async (headers) => {
  if (!headers.authorization) {
    throw new Error('No token provided.');
  }
  const token = headers.authorization.split(' ')[1]; // expects Bearer TOKEN

  // CALL AUTH-SERVICE: Verify token with internal auth service
  // AUTH_ADDRESS is set via env var in the Deployment (auth-service.default)
  // This is how microservices communicate within Kubernetes
  const response = await axios.get(`http://${process.env.AUTH_ADDRESS}/verify-token/` + token);
  return response.data.uid;
};

app.get('/tasks', async (req, res) => {
  try {
    const uid = await extractAndVerifyToken(req.headers); // we don't really need the uid
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: 'Loading the tasks failed.' });
      }
      const strData = data.toString();
      const entries = strData.split('TASK_SPLIT');
      entries.pop(); // remove last, empty entry
      console.log(entries);
      const tasks = entries.map((json) => JSON.parse(json));
      res.status(200).json({ message: 'Tasks loaded.', tasks: tasks });
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: err.message || 'Failed to load tasks.' });
  }
});

app.post('/tasks', async (req, res) => {
  try {
    const uid = await extractAndVerifyToken(req.headers); // we don't really need the uid
    const text = req.body.text;
    const title = req.body.title;
    const task = { title, text };
    const jsonTask = JSON.stringify(task);
    fs.appendFile(filePath, jsonTask + 'TASK_SPLIT', (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: 'Storing the task failed.' });
      }
      res.status(201).json({ message: 'Task stored.', createdTask: task });
    });
  } catch (err) {
    return res.status(401).json({ message: 'Could not verify token.' });
  }
});

// SERVER: Listen on port 8000
// This port is exposed by the tasks-service
app.listen(8000);
