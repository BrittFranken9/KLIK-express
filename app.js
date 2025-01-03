import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import routeIndex from './routes/index.js';
import routeTest from './routes/test.js';
import routeMessages from './routes/messages.js';
import routeUsers from './routes/users.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Verbinden met MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Database connected');
}).catch(err => {
  console.error('Database connection error:', err);
});

// Routes
app.use('/', routeIndex);
app.use('/test', routeTest);
app.use('/messages', routeMessages);
app.use('/users', routeUsers);

// Start de server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});