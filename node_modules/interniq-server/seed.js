import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import Internship from './src/models/Internship.js';
import { generateEmbedding } from './src/services/embeddings/vectorService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedInternships = async () => {
  try {
    await connectDB();
    
    console.log('Clearing old internships...');
    await Internship.deleteMany({});

    console.log('Reading original_internships.json...');
    const rawData = fs.readFileSync(path.join(__dirname, 'original_internships.json'), 'utf8');
    const internshipsData = JSON.parse(rawData);

    const dummyData = internshipsData.map(item => {
      const newItem = { ...item };
      if (item._id && item._id.$oid) {
        newItem._id = new mongoose.Types.ObjectId(item._id.$oid);
      } else {
        delete newItem._id;
      }
      if (newItem.mode) {
        newItem.mode = newItem.mode.toLowerCase();
      }
      return newItem;
    });

    console.log('Inserting internships...');
    const inserted = await Internship.insertMany(dummyData);

    console.log(`Inserted ${inserted.length} internships. Generating embeddings in parallel batches...`);

    // Generate embeddings in chunks of 15 in parallel
    const batchSize = 15;
    for (let i = 0; i < inserted.length; i += batchSize) {
      const batch = inserted.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(inserted.length / batchSize)}...`);
      await Promise.all(batch.map(async (internship) => {
        try {
          const embedText = `${internship.title} ${internship.company} ${internship.description} ${internship.requiredSkills.join(' ')} ${internship.domain.join(' ')}`;
          const embedding = await generateEmbedding(embedText);
          await Internship.findByIdAndUpdate(internship._id, { embedding });
        } catch (err) {
          console.error(`Failed to embed ${internship.title}:`, err.message);
        }
      }));
    }

    console.log('Seed complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedInternships();
