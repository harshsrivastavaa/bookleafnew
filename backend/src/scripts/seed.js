import 'dotenv/config';
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { runSeed } from '../services/seed.service.js';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookleaf_portal';

async function main() {
  try {
    await mongoose.connect(mongoUri);
    await runSeed();
  } catch (error) {
    console.error('Database seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
