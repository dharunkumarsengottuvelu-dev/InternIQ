import fs from 'fs';

const extractJSON = () => {
  const path = 'C:\\Users\\KaaviyaDharun\\.gemini\\antigravity-ide\\brain\\7843e6f0-576c-4b4f-b44c-f02c41ac5c0b\\.system_generated\\logs\\transcript.jsonl';
  const content = fs.readFileSync(path, 'utf8');
  const firstLine = content.split('\n')[0];
  const obj = JSON.parse(firstLine);
  
  // Find the JSON block inside the USER_REQUEST
  const requestText = obj.content;
  const jsonStart = requestText.indexOf('[');
  const jsonEnd = requestText.lastIndexOf(']') + 1;
  
  if (jsonStart !== -1 && jsonEnd !== -1) {
    const jsonStr = requestText.substring(jsonStart, jsonEnd);
    fs.writeFileSync('original_internships.json', jsonStr);
    console.log('Successfully extracted original_internships.json');
  } else {
    console.log('Could not find JSON array in user request.');
  }
};

extractJSON();
