import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import Internship from './src/models/Internship.js';

const checkLinks = async () => {
  try {
    await connectDB();
    const interns = await Internship.find({}, 'title company applyLink').limit(15);
    console.log('--- SAMPLE APPLY LINKS ---');
    interns.forEach((it, idx) => {
      console.log(`${idx + 1}. Company: ${it.company} | Apply Link: "${it.applyLink}"`);
    });
    
    // Count how many are relative (don't start with http/https)
    const allInterns = await Internship.find({}, 'applyLink');
    let relativeCount = 0;
    allInterns.forEach(it => {
      if (it.applyLink && !it.applyLink.startsWith('http://') && !it.applyLink.startsWith('https://')) {
        relativeCount++;
      }
    });
    console.log(`\nTotal internships: ${allInterns.length}`);
    console.log(`Relative applyLinks: ${relativeCount}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkLinks();
