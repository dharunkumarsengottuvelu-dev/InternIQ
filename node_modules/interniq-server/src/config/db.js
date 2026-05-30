import mongoose from 'mongoose';
import logger from '../utils/logger.js';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('✅ MongoDB reconnected');
    });
  } catch (err) {
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

export const healthCheck = () => ({
  status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
  state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
});

export default connectDB;
