import { Groq } from 'groq-sdk';
import OpenAI from 'openai';
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

const DEFAULT_MODEL = process.env.LLM_MODEL || 'llama-3.3-70b-versatile';

/**
 * Generates an assessment based on the user's top skills and resume text.
 * @param {Array<string>} skills - The skills to assess
 * @param {string} resumeText - The candidate's raw resume text
 * @returns {Promise<Object>} The generated test containing MCQs and CodingQuestions
 */
export const generateAssessment = async (skills, resumeText = '') => {
  if (!skills || skills.length === 0) {
    throw new Error('Skills array is required to generate an assessment.');
  }

  const { client, provider } = getClient();

  if (provider === 'mock') {
    logger.info('🤖 No valid LLM provider configured. Generating mock assessment.');
    return getMockAssessment();
  }

  let resumeCustomization = '';
  if (resumeText && resumeText.trim().length > 100) {
    resumeCustomization = `
Candidate's parsed resume details/text:
"""
${resumeText.substring(0, 3000)}
"""

Crucial Guideline: Tailor the MCQ questions and coding questions to match the candidate's specific background, projects, experiences, and technical skills listed in their resume above. The conceptual questions should relate to the specific technologies and concepts they have used in their projects or jobs (e.g. ask scenario-based questions from those projects, or core concepts related to their experience).
`;
  }

  const prompt = `
You are an expert technical interviewer and test generator for software engineering internships.
I need you to generate a comprehensive technical assessment based on the following skills: ${skills.join(', ')}.
${resumeCustomization}

The assessment must include:
1. 10 Multiple Choice Questions (MCQs) that test conceptual understanding, language quirks, and best practices across the provided skills.
2. 2 Coding Questions that require writing algorithms or implementing logic. These should be leetcode "easy" or "medium" difficulty.

Your response MUST be a raw JSON object exactly matching the following structure. Do NOT include any markdown formatting, explanation, or code blocks outside of the JSON. Ensure the JSON is valid and can be parsed programmatically.

{
  "mcqs": [
    {
      "id": "mcq_1",
      "question": "What is the primary purpose of the Virtual DOM in React?",
      "codeSnippet": "Optional code snippet if relevant, otherwise empty string",
      "options": {
        "A": "To directly manipulate the browser DOM",
        "B": "To improve performance by minimizing direct DOM updates",
        "C": "To style components efficiently",
        "D": "To handle state management"
      },
      "correctAnswer": "B",
      "explanation": "React uses a Virtual DOM to batch and optimize updates before applying them to the real DOM, which is expensive to modify.",
      "skill": "React",
      "difficulty": "medium",
      "timeLimit": 60
    }
  ],
  "codingQuestions": [
    {
      "id": "coding_1",
      "title": "Reverse a String",
      "description": "Write a function that reverses a given string.",
      "inputFormat": "A single string 's'.",
      "outputFormat": "The reversed string.",
      "constraints": ["1 <= s.length <= 10^5"],
      "sampleTestCases": [
        {
          "input": "hello",
          "output": "olleh",
          "explanation": "The reverse of 'hello' is 'olleh'."
        }
      ],
      "hiddenTestCases": [
        {
          "input": "racecar",
          "output": "racecar"
        }
      ],
      "expectedTimeComplexity": "O(N)",
      "expectedSpaceComplexity": "O(N) or O(1)",
      "tags": ["Strings", "Algorithms"],
      "points": 100,
      "timeLimit": 2,
      "memoryLimit": 256
    }
  ]
}

Ensure there are exactly 10 MCQs and 2 Coding Questions. Distribute the questions evenly across the provided skills.
`;

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: DEFAULT_MODEL,
      temperature: 0.2, // Low temperature for more deterministic JSON output
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from Groq');
    }

    const testData = JSON.parse(content);
    
    // Additional validation could be added here (e.g., using Zod)

    return testData;
  } catch (error) {
    logger.error('Error in testGenerator, falling back to mock assessment:', error);
    return getMockAssessment();
  }
};

const getMockAssessment = () => ({
  mcqs: [
    {
      id: "mcq_1",
      question: "What is the primary benefit of React's Virtual DOM?",
      codeSnippet: "",
      options: {
        A: "It allows direct styling of browser nodes",
        B: "It minimizes direct DOM updates to improve performance",
        C: "It replaces the need for a backend server",
        D: "It handles redux state management automatically"
      },
      correctAnswer: "B",
      explanation: "The Virtual DOM allows React to calculate UI differences and update the actual DOM in batches, reducing costly reflows.",
      skill: "React",
      difficulty: "easy",
      timeLimit: 60
    },
    {
      id: "mcq_2",
      question: "Which of the following is true about Node.js event-driven architecture?",
      codeSnippet: "",
      options: {
        A: "It is multi-threaded and processes requests in parallel",
        B: "It uses a single-threaded event loop for non-blocking I/O",
        C: "It requires a database connection to run",
        D: "It is primarily used for frontend execution"
      },
      correctAnswer: "B",
      explanation: "Node.js runs on a single thread and handles concurrent operations asynchronously via the libuv event loop.",
      skill: "Node.js",
      difficulty: "easy",
      timeLimit: 60
    },
    {
      id: "mcq_3",
      question: "What is MongoDB's primary data storage format?",
      codeSnippet: "",
      options: {
        A: "Tabular tables and columns",
        B: "BSON (Binary JSON) documents",
        C: "Plain text CSV files",
        D: "Relational foreign key tables"
      },
      correctAnswer: "B",
      explanation: "MongoDB stores data records as BSON documents, which is a binary representation of JSON-like documents.",
      skill: "MongoDB",
      difficulty: "easy",
      timeLimit: 60
    },
    {
      id: "mcq_4",
      question: "In JavaScript, what is the value of 'typeof null'?",
      codeSnippet: "console.log(typeof null);",
      options: {
        A: "'null'",
        B: "'undefined'",
        C: "'object'",
        D: "'number'"
      },
      correctAnswer: "C",
      explanation: "This is a long-standing quirk in JavaScript where null is classified as an object type.",
      skill: "JavaScript",
      difficulty: "medium",
      timeLimit: 60
    },
    {
      id: "mcq_5",
      question: "Which CSS layout method is best suited for 1-dimensional layouts?",
      codeSnippet: "",
      options: {
        A: "CSS Grid",
        B: "Flexbox",
        C: "Floats",
        D: "Table display"
      },
      correctAnswer: "B",
      explanation: "Flexbox is designed for 1-dimensional layouts (either columns or rows), whereas Grid is suited for 2-dimensional layouts.",
      skill: "CSS",
      difficulty: "easy",
      timeLimit: 60
    },
    {
      id: "mcq_6",
      question: "What does the 'useEffect' dependency array do in React?",
      codeSnippet: "useEffect(() => { ... }, [dep]);",
      options: {
        A: "It defines which state variables are exported",
        B: "It controls when the effect hook runs",
        C: "It declares local component variables",
        D: "It executes the cleanup function immediately"
      },
      correctAnswer: "B",
      explanation: "The effect runs on mount and whenever any dependency value in the array changes.",
      skill: "React",
      difficulty: "medium",
      timeLimit: 60
    },
    {
      id: "mcq_7",
      question: "How do you start a transaction in MongoDB?",
      codeSnippet: "",
      options: {
        A: "db.startTransaction()",
        B: "session.startTransaction()",
        C: "transaction.begin()",
        D: "db.beginTransaction()"
      },
      correctAnswer: "B",
      explanation: "In MongoDB, transactions are started on a client session object using session.startTransaction().",
      skill: "MongoDB",
      difficulty: "hard",
      timeLimit: 90
    },
    {
      id: "mcq_8",
      question: "Which status code represents 'Internal Server Error'?",
      codeSnippet: "",
      options: {
        A: "400",
        B: "404",
        C: "500",
        D: "503"
      },
      correctAnswer: "C",
      explanation: "500 is the generic HTTP status code for server-side exceptions and errors.",
      skill: "Node.js",
      difficulty: "easy",
      timeLimit: 60
    },
    {
      id: "mcq_9",
      question: "What is the purpose of the 'git merge' command?",
      codeSnippet: "",
      options: {
        A: "To delete a remote branch",
        B: "To combine development histories from different branches",
        C: "To rename local files",
        D: "To download commits from GitHub"
      },
      correctAnswer: "B",
      explanation: "git merge integrates changes from another branch into your current active branch.",
      skill: "Tools",
      difficulty: "easy",
      timeLimit: 60
    },
    {
      id: "mcq_10",
      question: "What is the runtime complexity of looking up a key in a Hash Map?",
      codeSnippet: "",
      options: {
        A: "O(1) average",
        B: "O(N) average",
        C: "O(log N) average",
        D: "O(N^2) average"
      },
      correctAnswer: "A",
      explanation: "A Hash Map provides O(1) constant time complexity for insertions and lookups on average.",
      skill: "Algorithms",
      difficulty: "medium",
      timeLimit: 60
    }
  ],
  codingQuestions: [
    {
      id: "coding_1",
      title: "Two Sum",
      description: "Given an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to target.",
      inputFormat: "An array of integers 'nums' and an integer 'target'.",
      outputFormat: "Two indices as an array.",
      constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
      sampleTestCases: [
        {
          input: "[2,7,11,15]\n9",
          output: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
        }
      ],
      hiddenTestCases: [
        {
          input: "[3,2,4]\n6",
          output: "[1,2]"
        }
      ],
      expectedTimeComplexity: "O(N)",
      expectedSpaceComplexity: "O(N)",
      tags: ["Arrays", "Hash Map"],
      points: 100,
      timeLimit: 2,
      memoryLimit: 256
    },
    {
      id: "coding_2",
      title: "Valid Parentheses",
      description: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
      inputFormat: "A string 's'.",
      outputFormat: "Boolean string 'true' or 'false'.",
      constraints: ["1 <= s.length <= 10^4"],
      sampleTestCases: [
        {
          input: "()[]{}",
          output: "true",
          explanation: "All brackets are closed in the correct order."
        }
      ],
      hiddenTestCases: [
        {
          input: "(]",
          output: "false"
        }
      ],
      expectedTimeComplexity: "O(N)",
      expectedSpaceComplexity: "O(N)",
      tags: ["Stack", "Strings"],
      points: 100,
      timeLimit: 2,
      memoryLimit: 256
    }
  ]
});
