import OpenAI from 'openai';
import logger from '../../utils/logger.js';
import Internship from '../../models/Internship.js';
import User from '../../models/User.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a vector embedding for a given text string.
 * @param {string} text - The input text
 * @returns {Promise<Array<number>>} The embedding vector
 */
export const generateEmbedding = async (text) => {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY is missing. Returning zeroed embedding array as fallback.');
    return new Array(1536).fill(0);
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });
    return response.data[0].embedding;
  } catch (error) {
    logger.error(`⚠️ OpenAI embedding failed (${error.message}). Falling back to zero-filled vector.`);
    return new Array(1536).fill(0);
  }
};

/**
 * Perform a vector search on Internships to find semantic matches for a given embedding.
 * Uses MongoDB Atlas Vector Search.
 * @param {Array<number>} embedding - The student's profile embedding
 * @param {number} limit - Number of results to return
 * @returns {Promise<Array<Object>>} Matching internships
 */
export const searchInternships = async (embedding, limit = 10) => {
  // Guard: no valid embedding → skip vector search
  if (!embedding || embedding.length === 0) {
    return Internship.find({ isActive: true }).sort({ createdAt: -1 }).limit(limit).lean();
  }

  // Guard: no OpenAI key → skip vector search
  if (!process.env.OPENAI_API_KEY) {
    return Internship.find({ isActive: true }).sort({ createdAt: -1 }).limit(limit).lean();
  }

  try {
    // Requires an Atlas Search index named "vector_index" on the "embedding" field.
    const results = await Internship.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: embedding,
          numCandidates: 100,
          limit: limit,
        }
      },
      {
        $match: { isActive: true } // Filter out inactive ones
      },
      {
        $project: {
          title: 1,
          company: 1,
          description: 1,
          requiredSkills: 1,
          location: 1,
          mode: 1,
          stipend: 1,
          applyLink: 1,
          duration: 1,
          eligibility: 1,
          openings: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);
    return results;
  } catch (error) {
    logger.error('Vector search failed. Falling back to latest internships.', error.message);
    return Internship.find({ isActive: true }).sort({ createdAt: -1 }).limit(limit).lean();
  }
};

