import { searchInternships } from '../embeddings/vectorService.js';
import Internship from '../../models/Internship.js';
import User from '../../models/User.js';
import { Groq } from 'groq-sdk';
import logger from '../../utils/logger.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'mock_key',
});

/**
 * Fallback: fetch active internships matching user skills or just latest ones.
 * Used when the user has no profile embedding or vector search is unavailable.
 */
const getSkillBasedFallback = async (user, limit = 10) => {
  const userSkills = user.skills || [];

  if (userSkills.length > 0) {
    // Try to find internships that require at least one of the user's skills
    const matched = await Internship.find({
      isActive: true,
      requiredSkills: { $in: userSkills },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (matched.length > 0) {
      return matched.map(i => ({
        ...i,
        matchReason: `Matched based on your skills: ${userSkills.slice(0, 3).join(', ')}.`,
      }));
    }
  }

  // Final fallback: just return latest active internships
  const latest = await Internship.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return latest.map(i => ({
    ...i,
    matchReason: 'Top recent internship on the platform.',
  }));
};

/**
 * Get personalized internship recommendations for a student.
 * 1. Fetch student's profile embedding.
 * 2. Vector search the top 10 matches (if embedding exists).
 * 3. Use LLM to re-rank the top matches based on specific skills and test scores.
 * @param {string} userId - The ID of the user
 */
export const getRecommendations = async (userId) => {
  const user = await User.findById(userId).select('+profileEmbedding');
  if (!user) throw new Error('User not found');

  // ── No embedding: use skill-based / latest fallback ──────────────────
  const hasEmbedding = user.profileEmbedding && user.profileEmbedding.length > 0;
  if (!hasEmbedding) {
    logger.warn(`User ${userId} has no embedding. Returning skill/latest fallback.`);
    return await getSkillBasedFallback(user, 10);
  }

  // ── Vector Search (Semantic Match) ───────────────────────────────────
  let candidateInternships = [];
  try {
    candidateInternships = await searchInternships(user.profileEmbedding, 10);
  } catch (err) {
    logger.error('Vector search threw an exception, using fallback:', err.message);
  }

  // If vector search returned nothing, fall back to skill-based
  if (!candidateInternships || candidateInternships.length === 0) {
    logger.warn(`Vector search returned 0 results for user ${userId}. Using skill fallback.`);
    return await getSkillBasedFallback(user, 10);
  }

  // ── LLM Re-ranking (Contextual Match) ────────────────────────────────
  const prompt = `
You are an expert technical recruiter matching a candidate to internships.
Candidate Profile:
- Skills: ${(user.skills || []).join(', ') || 'Not specified'}
- ATS Score: ${user.atsScore || 'N/A'}/100
- Assessment (MCQ) Score: ${user.mcqScore || 'N/A'}/100
- Assessment (Coding) Score: ${user.codingScore || 'N/A'}/100

Candidate Preferences:
- Preferred Domain: ${user.preferences?.domain?.join(', ') || 'Any'}
- Preferred Mode: ${user.preferences?.internshipType || 'Any'}

Here are the top semantic matches from our database:
${JSON.stringify(candidateInternships.map(i => ({
  id: i._id,
  title: i.title,
  company: i.company,
  skills: i.requiredSkills,
})), null, 2)}

Task: Rank these internships from best fit (1) to worst fit (${candidateInternships.length}). Consider the candidate's skills and scores. Higher coding scores mean they are better suited for technically demanding roles.

Return ONLY a raw JSON object with this exact structure:
{
  "rankedIds": ["<id1>", "<id2>", ...],
  "reasoning": {
    "<id1>": "Short explanation of why this is the #1 match.",
    "<id2>": "Short explanation..."
  }
}
Do NOT wrap the JSON in markdown blocks.
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    const rankingData = JSON.parse(content);

    // Sort candidateInternships based on rankedIds and inject reasoning
    const finalRecommendations = rankingData.rankedIds.map(id => {
      const internship = candidateInternships.find(i => i._id.toString() === id);
      if (internship) {
        internship.matchReason = rankingData.reasoning[id] || 'Matched based on profile alignment.';
      }
      return internship;
    }).filter(Boolean);

    // Append any that weren't ranked by the LLM (safety net)
    for (const internship of candidateInternships) {
      if (!finalRecommendations.find(r => r._id.toString() === internship._id.toString())) {
        internship.matchReason = 'Semantic match fallback.';
        finalRecommendations.push(internship);
      }
    }

    return finalRecommendations;
  } catch (error) {
    logger.error('LLM re-ranking failed. Returning vector search results:', error.message);
    return candidateInternships.map(i => ({
      ...i,
      matchReason: 'Matched based on your resume profile.',
    }));
  }
};
