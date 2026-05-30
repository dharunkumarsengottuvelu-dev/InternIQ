import 'dotenv/config';
import mongoose from 'mongoose';
import Test from './src/models/Test.js';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const test = await Test.findOne({});
  if (test) {
    console.log('MCQ Question keys in Mongoose doc:');
    const firstMcq = test.mcqs[0];
    console.log('JSON structure:', JSON.stringify(firstMcq));
    console.log('firstMcq.id:', firstMcq.id);
    console.log('firstMcq.question:', firstMcq.question);
    console.log('firstMcq._id:', firstMcq._id);
    console.log('raw object keys:', Object.keys(firstMcq.toObject()));
  } else {
    console.log('No tests found.');
  }
  await mongoose.disconnect();
}

check().catch(console.error);
