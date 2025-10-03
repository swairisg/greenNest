// app.js
require('dotenv').config(); // load .env exactly once

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// temporary minimal users router to prevent crash
const { Router } = require('express');
const router = Router();
router.get('/', (_req, res) => {
  res.json({ message: 'Users route healthy' });
});

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const qualityRoutes = require('./Routes/qualityControl/qualityControlRoute');
app.use('/quality', qualityRoutes);

// routes
app.get('/', (_req, res) => res.send('Hello from backend'));

// connect DB then start server
const PORT = Number(process.env.PORT) || 5001; 
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing in .env');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Mongo connection error:', err);
    process.exit(1);
  });
