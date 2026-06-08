const express = require('express');
const mongoose = require('mongoose'); // Re-triggering reload
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const repoRoutes = require('./routes/repoRoutes');
const chatRoutes = require('./routes/chatRoutes');

const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/repo', repoRoutes);
app.use('/api/chat', chatRoutes);

// Database Connection
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
