const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('./passport');
const authRouter = require('./auth');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0',() => {
  console.log('Listening on Port ' + port);
 });

app.use(bodyParser.json());
app.use(cors());


// Creates a list of allowed domains
let allowedOrigins = ['http://localhost:3000', 'http://testsite.com'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb://localhost:27017/myDatabase', { useNewUrlParser: true, useUnifiedTopology: true });

// Import Mongoose models
const { Movie, User } = require('./models');

// Passport Configuration
require('./passport');

// Initialize Passport
app.use(passport.initialize());

// Define routes
app.use('/auth', authRouter);

// Handle POST request to create a new user
app.post('/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
  
});

// Existing /movies and /users routes
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json({ movies });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

const topMovies = [
  {
    title: 'Treasure Planet',
    director: 'John Musker, Ron Clements',
    year: 2002,
  },
  {
    title: 'Star Wars: Episode III - Revenge of the Sith',
    director: 'George Lucas',
    year: 2005,
  },
  {
    title: 'Spider-Man: No Way Home',
    director: 'Jon Watts',
    year: 2021,
  },
];

app.get('/topmovies', (req, res) => {
  res.json({ movies: topMovies });
});

app.get('/', (req, res) => {
  res.send('Welcome to my movie app!');
});

// Define the login route
app.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    // If authentication is successful, generate and return a JWT token
    const token = generateJWTToken(user);
    return res.json({ token });
  })(req, res, next);
});

function generateJWTToken(user) {
  const payload = {
    sub: user._id,
    username: user.username,
  };
  return jwt.sign(payload, 'hG7zPwIVrs', { expiresIn: '1h' });
}

// Error handling middleware and starting the server
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
