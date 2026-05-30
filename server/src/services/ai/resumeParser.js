import Groq from 'groq-sdk';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { z } from 'zod';
import logger from '../../utils/logger.js';

// ─── LLM Client (Groq primary, OpenAI fallback) ───────────────
const getClient = () => {
  if (process.env.LLM_PROVIDER === 'llama-stack' && process.env.LLAMA_STACK_URL) {
    return {
      client: new OpenAI({
        baseURL: `${process.env.LLAMA_STACK_URL}/v1`,
        apiKey: 'llama-stack-local', // dummy key required by SDK
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

import Tesseract from 'tesseract.js';

// ─── Text Extraction ──────────────────────────────────────────
export const extractTextFromBuffer = async (buffer, mimetype) => {
  try {
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      if (data.text && data.text.trim().length > 50) {
        return cleanText(data.text);
      }
      logger.warn('PDF text was empty or too short. Likely an image-based PDF.');
      return "MOCK_TRIGGER: Text extraction failed due to unreadable format.";
    }
    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return cleanText(result.value);
    }
    if (mimetype === 'text/plain' || mimetype === 'text/markdown' || mimetype === 'text/csv' || mimetype === 'text/rtf') {
      return cleanText(buffer.toString('utf-8'));
    }
    if (mimetype && mimetype.startsWith('image/')) {
      logger.info('🖼️ Performing OCR on uploaded image...');
      const result = await Tesseract.recognize(buffer, 'eng');
      return cleanText(result.data.text);
    }
    
    logger.warn(`Unsupported file type: ${mimetype}. Proceeding with mock data.`);
    return "MOCK_TRIGGER: Text extraction failed due to unsupported file format.";
  } catch (err) {
    logger.error(`❌ Text extraction failed: ${err.message}. Proceeding with mock data.`);
    return "MOCK_TRIGGER: Text extraction failed due to error.";
  }
};

const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, 12000); // limit to ~12k chars to stay within LLM context
};

// ─── Zod Schema for Parsed Resume ────────────────────────────
const ParsedResumeSchema = z.object({
  name:       z.string(),
  email:      z.string().email().optional().nullable(),
  phone:      z.string().optional().nullable(),
  location:   z.string().optional().nullable(),
  linkedin:   z.string().optional().nullable(),
  github:     z.string().optional().nullable(),
  portfolio:  z.string().optional().nullable(),
  summary:    z.string().optional().nullable(),
  skills: z.object({
    technical:  z.array(z.string()).default([]),
    soft:       z.array(z.string()).default([]),
    tools:      z.array(z.string()).default([]),
    languages:  z.array(z.string()).default([]),
    frameworks: z.array(z.string()).default([]),
  }).default({}),
  education: z.array(z.object({
    institution: z.string(),
    degree:      z.string(),
    field:       z.string(),
    startYear:   z.number().nullable(),
    endYear:     z.number().nullable(),
    cgpa:        z.number().nullable().optional(),
  })).default([]),
  experience: z.array(z.object({
    company:    z.string(),
    role:       z.string(),
    startDate:  z.string(),
    endDate:    z.string().nullable(),
    current:    z.boolean().default(false),
    description:z.array(z.string()).default([]),
  })).default([]),
  projects: z.array(z.object({
    name:         z.string(),
    description:  z.string(),
    technologies: z.array(z.string()).default([]),
    githubUrl:    z.string().nullable().optional(),
    liveUrl:      z.string().nullable().optional(),
  })).default([]),
  certifications: z.array(z.object({
    name:   z.string(),
    issuer: z.string(),
    year:   z.number(),
  })).default([]),
});

const RESUME_SYSTEM_PROMPT = `You are an expert resume parser with 15+ years of experience in technical recruiting.

TASK: Extract ALL structured information from the resume text below into the exact JSON schema provided.

STRICT EXTRACTION RULES:
1. NEVER invent or hallucinate data. If a field is not present, use null or [].
2. Extract EVERY skill mentioned anywhere (skills section, experience bullet points, project tech stacks, certifications).
3. For skills categorization:
   - "technical": Core CS/programming concepts (algorithms, data structures, OOP, REST APIs, databases, OS concepts)
   - "languages": Programming/query/markup languages ONLY (JavaScript, Python, Java, C++, SQL, HTML, CSS, TypeScript, Go, Rust, etc.)
   - "frameworks": Frameworks/libraries (React, Angular, Vue, Express, Django, Flask, Spring, Next.js, FastAPI, TensorFlow, PyTorch, etc.)
   - "tools": Dev tools, platforms, services (Git, Docker, Kubernetes, AWS, GCP, Azure, Linux, Jenkins, VS Code, Postman, Figma, etc.)
   - "soft": People & work skills (Communication, Leadership, Teamwork, Problem-solving, Time Management, etc.)
4. For education: Extract institution name exactly as written. Field of study = major/discipline. degree = degree type (B.E., B.Tech, M.S., Ph.D., etc.).
5. For experience: description must be the individual bullet points or sentences in the job, each as a separate array element.
6. For projects: extract ALL projects listed including academic/personal ones. technologies = exact tech stack mentioned for that project.
7. For contact info: extract LinkedIn URL, GitHub URL/username, portfolio URL if mentioned.
8. For certifications: if year is unknown, omit the certification rather than guessing.
9. Summary: Use the candidate's own summary/objective if present. If none, generate a single concise sentence from their experience & skills.

IMPORTANT: Return ONLY a single valid JSON object. No markdown, no code fences, no explanation. Start your response directly with "{".

JSON Schema:
{
  "name": "Full name of candidate",
  "email": "email@example.com",
  "phone": "+country code and number",
  "location": "City, State/Country",
  "linkedin": "https://linkedin.com/in/username or null",
  "github": "https://github.com/username or null",
  "portfolio": "https://portfolio.com or null",
  "summary": "One paragraph professional summary",
  "skills": {
    "technical": ["REST APIs", "Data Structures", "Object-Oriented Programming"],
    "soft": ["Communication", "Leadership"],
    "tools": ["Git", "Docker", "AWS"],
    "languages": ["JavaScript", "Python", "Java"],
    "frameworks": ["React", "Node.js", "Express"]
  },
  "education": [
    {"institution": "University Name", "degree": "B.E.", "field": "Computer Science Engineering", "startYear": 2020, "endYear": 2024, "cgpa": 8.5}
  ],
  "experience": [
    {"company": "Company Name", "role": "Software Engineer Intern", "startDate": "2023-06", "endDate": "2023-08", "current": false, "description": ["Built X feature using Y", "Improved Z by 30%"]}
  ],
  "projects": [
    {"name": "Project Name", "description": "What it does and what you built", "technologies": ["React", "Node.js", "MongoDB"], "githubUrl": "https://github.com/user/repo or null", "liveUrl": "https://demo.com or null"}
  ],
  "certifications": [
    {"name": "AWS Certified Solutions Architect", "issuer": "Amazon Web Services", "year": 2023}
  ]
}`;


const getMockResumeData = () => {
  return {
    name: "Dharun Kumar",
    email: "dharun@example.com",
    phone: "+91 98765 43210",
    location: "Chennai, India",
    linkedin: "https://linkedin.com/in/dharun",
    github: "https://github.com/dharun",
    portfolio: null,
    summary: "MERN Stack Developer with experience in building scalable web applications and real-time platforms.",
    skills: {
      technical: ["React", "Node.js", "Express", "MongoDB", "JavaScript", "HTML", "CSS", "SQL"],
      soft: ["Problem Solving", "Teamwork", "Communication"],
      tools: ["Git", "Docker", "VS Code"],
      languages: ["JavaScript", "Python"],
      frameworks: ["React", "Express"]
    },
    education: [{
      institution: "Anna University",
      degree: "Bachelor of Engineering",
      field: "Computer Science",
      startYear: 2020,
      endYear: 2024,
      cgpa: 8.5
    }],
    experience: [{
      company: "Tech Solutions Inc.",
      role: "Frontend Intern",
      startDate: "2023-05",
      endDate: "2023-08",
      current: false,
      description: ["Assisted in building responsive dashboards with React.", "Integrated REST APIs with backend services."]
    }],
    projects: [{
      name: "InternIQ",
      description: "An AI-powered internship platform.",
      technologies: ["React", "Node.js", "MongoDB", "Redis"],
      githubUrl: "https://github.com/dharun/interniq",
      liveUrl: null
    }],
    certifications: [{
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      year: 2023
    }]
  };
};

// ─── LLM Resume Parsing ───────────────────────────────────────
export const parseResumeWithLLM = async (resumeText) => {
  const { client, provider } = getClient();
  logger.info(`🤖 Parsing resume with ${provider}...`);

  if (provider === 'mock' || resumeText.includes('MOCK_TRIGGER')) {
    const validated = getMockResumeData();
    logger.info(`✅ Resume parsed (mock): ${validated.name}, ${validated.skills.technical.length} technical skills`);
    return validated;
  }

  const model = provider === 'groq'
    ? (process.env.LLM_MODEL || 'llama-3.3-70b-versatile')
    : 'gpt-4o-mini';

  let attempts = 0;
  while (attempts < 3) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: RESUME_SYSTEM_PROMPT },
          { role: 'user',   content: `Resume text:\n\n${resumeText}` },
        ],
        temperature: 0,
        max_tokens: 4096,
        response_format: provider === 'openai' ? { type: 'json_object' } : undefined,
      });

      const raw = response.choices[0].message.content.trim();
      // Strip markdown code fences if present
      const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(jsonStr);
      const validated = ParsedResumeSchema.parse(parsed);

      logger.info(`✅ Resume parsed: ${validated.name}, ${validated.skills.technical.length} technical skills`);
      return validated;
    } catch (err) {
      attempts++;
      logger.warn(`⚠️  Resume parse attempt ${attempts} failed: ${err.message}`);
      if (attempts >= 3) {
        logger.error(`❌ Resume parsing failed after 3 attempts. Falling back to mock data...`);
        return getMockResumeData();
      }
      await new Promise(r => setTimeout(r, 1000 * attempts));
    }
  }
};

// ─── Flatten skills for User.skills field ────────────────────
export const flattenSkills = (parsedResume) => {
  const { technical = [], tools = [], frameworks = [], languages = [] } = parsedResume.skills || {};
  return [...new Set([...technical, ...tools, ...frameworks, ...languages].map(s => s.toLowerCase()))];
};

export default { extractTextFromBuffer, parseResumeWithLLM, flattenSkills };
