import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import plotRoutes from './routes/plots.js';
import complianceRoutes from './routes/compliance.js';
import documentRoutes from './routes/documents.js';
import activityRoutes from './routes/activity.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/researchhub';

app.use(cors());
app.use(express.json());

// Health check — always available, even before DB connects
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Connect to MongoDB first, then register routes and start listening
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ Connected to MongoDB');

    // Routes — only registered after DB is ready
    app.use('/api/auth', authRoutes);
    app.use('/api/plots', plotRoutes);
    app.use('/api/compliance', complianceRoutes);
    app.use('/api/documents', documentRoutes);
    app.use('/api/activity', activityRoutes);
    app.use('/api/chat', chatRoutes);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('Make sure MongoDB is running. Try: mongod --dbpath <your-data-path>');
    process.exit(1);
  });
