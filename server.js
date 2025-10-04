const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
require('./config/cloudinary');

// Import playlist scheduler
const PlaylistScheduler = require('./utils/scheduler'); 

const app = express();
const PORT = process.env.PORT || 3001;
console.log("API_SECRET_KEY:", process.env.API_SECRET_KEY);

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : true,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/conekt-ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cities', require('./routes/cities'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/trucks', require('./routes/trucks'));
app.use('/api/hardware', require('./routes/hardware'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

let playlistScheduler = null;
try {
  playlistScheduler = new PlaylistScheduler();
  console.log('🎵 Playlist scheduler initialized');
} catch (error) {
  console.error('❌ Failed to initialize playlist scheduler:', error);
}

// Make scheduler available globally
global.playlistScheduler = playlistScheduler;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log scheduler status
  if (playlistScheduler) {
    console.log('✅ Playlist scheduler initialized and running');
    console.log('⏰ Tasks running: playlist refresh, daily generation, morning checks');
  }
});

module.exports = { app, playlistScheduler };
