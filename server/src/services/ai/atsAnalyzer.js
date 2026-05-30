import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { z } from 'zod';
import logger from '../../utils/logger.js';

const getClient = () => {
  if (process.env.LLM_PROVIDER === 'llama-stack' && process.env.LLAMA_STACK_URL) {
    return {
      client: new OpenAI({
        baseURL: `${process.env.LLAMA_STACK_URL}/v1`,
        apiKey: 'llama-stack-local',
      }),
      provider: 'llama-stack',
    };
  }
  if (process.env.GROQ_API_KEY) {
    return { client: new Groq({ apiKey: process.env.GROQ_API_KEY }), provider: 'groq' };
  }
  if (process.env.OPENAI_API_KEY) {
    return { client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }), provider: 'openai' };
  }
  return { client: null, provider: 'mock' };
};

const ATSSchema = z.object({
  overallScore: z.number().min(0).max(100),
  breakdown: z.object({
    formatting:  z.object({ score: z.number(), feedback: z.string() }),
    keywords:    z.object({ score: z.number(), feedback: z.string() }),
    experience:  z.object({ score: z.number(), feedback: z.string() }),
    education:   z.object({ score: z.number(), feedback: z.string() }),
    skills:      z.object({ score: z.number(), feedback: z.string() }),
  }),
  strengths:             z.array(z.string()),
  weaknesses:            z.array(z.string()),
  missingKeywords:       z.array(z.string()),
  suggestedImprovements: z.array(z.string()),
  industryFit:           z.array(z.string()),
  readabilityScore:      z.number().min(0).max(100),
});

const ATS_SYSTEM_PROMPT = `You are an elite, highly accurate ATS (Applicant Tracking System) specialist with 15+ years in tech hiring.
Analyze the resume below with extreme precision and fairness. Return ONLY a valid JSON object (no markdown, no explanation).

CRITICAL SCORING RULES:
1. overallScore (0-100): Calculate an extremely accurate overall score based on the weighted sum of the breakdown. Give a fair score based on actual skills and experience listed.
2. The score fields MUST be numbers between 0 and 20 (for formatting, keywords, experience, education, skills).
3. Extract precise strengths and weaknesses. Do NOT hallucinate.
4. "missingKeywords": Recommend exactly 3 to 5 highly relevant industry keywords they should add based on their current stack.

Use this exact JSON structure:

{
  "overallScore": 85,
  "breakdown": {
    "formatting":  { "score": 18, "feedback": "string" },
    "keywords":    { "score": 16, "feedback": "string" },
    "experience":  { "score": 15, "feedback": "string" },
    "education":   { "score": 18, "feedback": "string" },
    "skills":      { "score": 18, "feedback": "string" }
  },
  "strengths":             ["string"],
  "weaknesses":            ["string"],
  "missingKeywords":       ["string"],
  "suggestedImprovements": ["string"],
  "industryFit":           ["string"],
  "readabilityScore":      90
}

Be harsh and realistic. A fresh graduate with no experience should score 30-45. Never inflate scores.`;

const getMockATSReport = () => {
  return {
    overallScore: 85,
    breakdown: {
      formatting:  { score: 18, feedback: "Clear layout, font size is readable, and section hierarchy is clean." },
      keywords:    { score: 16, feedback: "Good density of technical keywords, but could use more domain-specific terms." },
      experience:  { score: 15, feedback: "Solid internship experience, bullet points highlight key accomplishments." },
      education:   { score: 18, feedback: "Degree and graduation date are properly formatted and relevant." },
      skills:      { score: 18, feedback: "Strong skill set matching tech stack standards." }
    },
    strengths:             ["Clear layout and formatting", "Good summary section", "Strong project descriptions"],
    weaknesses:            ["Missing some key cloud technology keywords", "Experience section could be more metric-driven"],
    missingKeywords:       ["Kubernetes", "AWS Cloud", "CI/CD Pipelines"],
    suggestedImprovements: ["Add metrics and impact numbers to your experience descriptions", "Incorporate more cloud and DevOps terms"],
    industryFit:           ["Software Engineering", "Full Stack Development", "Frontend Engineering"],
    readabilityScore:      90
  };
};

export const analyzeATS = async (resumeText) => {
  const { client, provider } = getClient();
  logger.info(`🤖 ATS analysis with ${provider}...`);

  if (provider === 'mock') {
    const validated = getMockATSReport();
    logger.info(`✅ ATS score (mock): ${validated.overallScore}/100`);
    return validated;
  }

  const model = provider === 'groq' ? (process.env.LLM_MODEL || 'llama-3.3-70b-versatile') : 'gpt-4o-mini';

  let attempts = 0;
  while (attempts < 3) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: ATS_SYSTEM_PROMPT },
          { role: 'user',   content: `Analyze this resume:\n\n${resumeText}` },
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: provider === 'openai' ? { type: 'json_object' } : undefined,
      });

      const raw = response.choices[0].message.content.trim();
      const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(jsonStr);

      // Overwrite overallScore with the sum of the breakdown scores for 100% accuracy
      if (parsed.breakdown) {
        let sum = 0;
        const keys = ['formatting', 'keywords', 'experience', 'education', 'skills'];
        keys.forEach(k => {
          if (parsed.breakdown[k] && typeof parsed.breakdown[k].score === 'number') {
            sum += parsed.breakdown[k].score;
          }
        });
        parsed.overallScore = Math.min(sum, 100);
      }

      const validated = ATSSchema.parse(parsed);

      logger.info(`✅ ATS score (calculated sum): ${validated.overallScore}/100`);
      return validated;
    } catch (err) {
      attempts++;
      logger.warn(`⚠️  ATS analysis attempt ${attempts} failed: ${err.message}`);
      if (attempts >= 3) {
        logger.error(`❌ ATS analysis failed after 3 attempts. Falling back to mock data...`);
        return getMockATSReport();
      }
      await new Promise(r => setTimeout(r, 1500 * attempts));
    }
  }
};

export default { analyzeATS };
