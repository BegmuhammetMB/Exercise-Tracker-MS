const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// In-memory data stores
let users = [];
let exercises = [];
let userIdCounter = 1;

// Root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST to create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username || typeof username !== 'string' || username.trim() === '') {
    return res.json({ error: 'Invalid username' });
  }
  const user = {
    username: username.trim(),
    _id: (userIdCounter++).toString()
  };
  users.push(user);
  res.json(user);
});

// GET all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// POST to add an exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  // Validate user
  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.json({ error: 'User not found' });
  }

  // Validate inputs
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.json({ error: 'Invalid description' });
  }
  const durationNum = parseInt(duration);
  if (isNaN(durationNum) || durationNum <= 0) {
    return res.json({ error: 'Invalid duration' });
  }

  // Handle date
  let exerciseDate;
  if (!date) {
    exerciseDate = new Date();
  } else {
    exerciseDate = new Date(date);
    if (isNaN(exerciseDate.getTime())) {
      return res.json({ error: 'Invalid date' });
    }
  }

  // Create exercise
  const exercise = {
    userId: _id,
    description: description.trim(),
    duration: durationNum,
    date: exerciseDate.toDateString()
  };
  exercises.push(exercise);

  // Return user object with exercise fields
  res.json({
    username: user.username,
    _id: user._id,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  });
});

// GET user exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  // Validate user
  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.json({ error: 'User not found' });
  }

  // Filter exercises for the user
  let userExercises = exercises.filter(e => e.userId === _id);

  // Apply from and to date filters
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      userExercises = userExercises.filter(e => new Date(e.date) >= fromDate);
    }
  }
  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      userExercises = userExercises.filter(e => new Date(e.date) <= toDate);
    }
  }

  // Apply limit
  if (limit) {
    const limitNum = parseInt(limit);
    if (!isNaN(limitNum) && limitNum > 0) {
      userExercises = userExercises.slice(0, limitNum);
    }
  }

  // Return log response
  res.json({
    username: user.username,
    _id: user._id,
    count: userExercises.length,
    log: userExercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date
    }))
  });
});

// Start server
const listener = app.listen(process.env.PORT || 7000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});