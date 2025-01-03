import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectMongo from 'connect-mongo';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import User from './models/user.js';

// Import routes
import routeIndex from './routes/index.js';
import routeTest from './routes/test.js';
import routeMessages from './routes/messages.js';
import routeUsers from './routes/users.js';

dotenv.config();

const app = express();

// Middleware for JSON parsing
app.use(express.json());

// Configure session middleware
app.use(
  session({
    store: connectMongo.create({
      mongoUrl: process.env.MONGO_URI,
      mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://klik-express.onrender.com/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log('Access Token:', accessToken);
      console.log('Profile:', profile);
      done(null, profile); // Pas dit aan indien nodig
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to database'))
  .catch((error) => console.error('Database connection error:', error));

// Routes
app.use('/', routeIndex);
app.use('/test', routeTest);
app.use('/messages', routeMessages);
app.use('/users', routeUsers);

// Google Authentication Routes
app.get('/auth/google', (req, res, next) => {
  const redirectUri = req.query.redirectUri || null;

  const authOptions = {
    scope: ['profile', 'email'],
    state: JSON.stringify({ redirectUri }), // Encode redirectUri in state
  };

  passport.authenticate('google', authOptions)(req, res, next);
});

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        throw new Error('User object is undefined after authentication.');
      }

      // Parse and validate the state parameter
      let redirectUri = 'exp://localhost:19000'; // Default fallback URI
      if (req.query.state) {
        try {
          const state = JSON.parse(req.query.state);
          redirectUri = state.redirectUri || redirectUri;
        } catch (error) {
          console.error('Failed to parse state parameter:', error);
        }
      }

      // Prepare user information
      const userInfo = {
        id: user._id,
        username: user.username,
        email: user.email,
      };

      const redirectUrl = `${redirectUri}?user=${encodeURIComponent(
        JSON.stringify(userInfo)
      )}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Er is een fout opgetreden:', err.stack);
  res.status(500).send('Er is een serverfout opgetreden!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});