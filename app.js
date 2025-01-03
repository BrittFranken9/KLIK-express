import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import User from './models/user.js';
import testRoute from './routes/test.js';
import indexRoute from './routes/index.js';
import messagesRoute from './routes/messages.js';
import userRoute from './routes/users.js';
import mongoStore from 'connect-mongo';

dotenv.config();

const app = express();

app.use(express.json());

// Configure session middleware
app.use(
  session({
    store: mongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
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
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email: email,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
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
    done(error, null);
  }
});

mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to database'));

// Google Authentication Routes
// Step 1: Initiate Google OAuth
app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'], // Required scopes
  })
);

app.use('/', indexRoute);
app.use('/test', testRoute);
app.use('/messages', messagesRoute);
app.use('/users', userRoute);


// Step 2: Handle Google OAuth callback
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    try {
      const user = req.user;
      const fallbackUri = 'exp://localhost:19000';

      // Define user info to return
      const userInfo = {
        id: user._id,
        username: user.username,
        email: user.email,
      };

      // Redirect to the application with user info
      const redirectUri = req.query.redirectUri || fallbackUri;
      const redirectUrl = `${redirectUri}?user=${encodeURIComponent(
        JSON.stringify(userInfo)
      )}`;
      res.redirect(redirectUrl);
    } catch (err) {
      console.error('Error in callback processing:', err);
      res.redirect('/');
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
