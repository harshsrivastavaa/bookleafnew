import 'dotenv/config';

import mongoose from 'mongoose';
import app from './app.js';

const port = Number(process.env.PORT) || 4000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookleaf_portal';

async function startServer() {
  try {
    await mongoose.connect(mongoUri);
    app.listen(port, () => {
      console.info(`BookLeaf API listening on port ${port}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exitCode = 1;
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
