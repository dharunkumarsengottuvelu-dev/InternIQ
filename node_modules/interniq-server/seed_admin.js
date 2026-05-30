import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import User from './src/models/User.js';

const seedAdmin = async () => {
  try {
    await connectDB();

    console.log('Checking for existing admin...');
    const adminEmail = 'admin@interniq.ai';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      console.log('Seeding admin user...');
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: 'Password123!',
        role: 'admin',
        isEmailVerified: true
      });
      console.log('✅ Admin user created successfully (admin@interniq.ai / Password123!)');
    } else {
      console.log('Admin user already exists.');
    }

    console.log('Checking for existing recruiter...');
    const recruiterEmail = 'recruiter@interniq.ai';
    const existingRecruiter = await User.findOne({ email: recruiterEmail });

    if (!existingRecruiter) {
      console.log('Seeding recruiter user...');
      await User.create({
        name: 'Recruiter User',
        email: recruiterEmail,
        password: 'Password123!',
        role: 'recruiter',
        isEmailVerified: true
      });
      console.log('✅ Recruiter user created successfully (recruiter@interniq.ai / Password123!)');
    } else {
      console.log('Recruiter user already exists.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding admin/recruiter failed:', err);
    process.exit(1);
  }
};

seedAdmin();
