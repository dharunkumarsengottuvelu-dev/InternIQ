import { Groq } from 'groq-sdk';
import logger from '../../utils/logger.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'mock_key',
});

const DEFAULT_MODEL = process.env.LLM_MODEL || 'llama3-70b-8192';

/**
 * Evaluates the quality of submitted code using an LLM.
 * @param {Object} question - The original coding question
 * @param {string} code - The student's submitted code
 * @param {string} language - The language used
 * @returns {Promise<Object>} An object containing the score and feedback
 */
export const evaluateCodeQuality = async (question, code, language) => {
  const prompt = `
You are an expert software engineer and technical interviewer.
Evaluate the following student's code submission for a coding problem.

Problem Title: ${question.title}
Problem Description: ${question.description}
Expected Time Complexity: ${question.expectedTimeComplexity}
Expected Space Complexity: ${question.expectedSpaceComplexity}

Student's Code (${language}):
\`\`\`${language}
${code}
\`\`\`

Analyze the code for:
1. Correctness (does it look like it solves the problem?)
2. Time & Space Complexity (does it meet the expected constraints?)
3. Readability & Clean Code practices
4. Edge case handling

Provide your response strictly as a raw JSON object with the following structure:
{
  "score": <number between 0 and 100>,
  "feedback": {
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."],
    "complexityAnalysis": "...",
    "generalAdvice": "..."
  }
}
Do NOT include markdown formatting.
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: DEFAULT_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from Groq');
    }

    const evaluation = JSON.parse(content);
    return evaluation;
  } catch (error) {
    logger.error('Error in codeEvaluator:', error);
    // Fallback if LLM fails
    return {
      score: 50,
      feedback: {
        strengths: ['Code was submitted'],
        weaknesses: ['Failed to analyze automatically'],
        complexityAnalysis: 'N/A',
        generalAdvice: 'Review code manually',
      },
    };
  }
};
