import mongoose from 'mongoose';

app.use(express.json());

const mongoose = require('mongoose');

mongoose.connect('mongodb://your-database-uri');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});