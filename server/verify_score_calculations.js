import 'dotenv/config';
import User from './src/models/User.js';
import { analyzeATS } from './src/services/ai/atsAnalyzer.js';
import assert from 'assert';

async function testScoreCalculations() {
  console.log('🧪 Starting Score Calculation Tests...');

  // 1. Test ATS score matching the sum of breakdown scores
  console.log('\n--- Test 1: ATS Score Sum Calculation ---');
  const report = await analyzeATS('mock resume text');
  console.log('Generated ATS Report:', JSON.stringify(report, null, 2));

  const calculatedSum = 
    report.breakdown.formatting.score +
    report.breakdown.keywords.score +
    report.breakdown.experience.score +
    report.breakdown.education.score +
    report.breakdown.skills.score;

  console.log(`Calculated sum of breakdown scores: ${calculatedSum}`);
  console.log(`Report overallScore: ${report.overallScore}`);
  assert.strictEqual(report.overallScore, calculatedSum, 'ATS overallScore must be the exact sum of category breakdown scores!');
  console.log('✅ Test 1 Passed: ATS overallScore matches the sum of the breakdowns.');

  // 2. Test User overall score calculation logic
  console.log('\n--- Test 2: User.calculateOverallScore() Formula ---');
  const mockUser = new User({
    name: 'Test Candidate',
    email: 'candidate@interniq.ai',
    atsScore: 80,
    mcqScore: 70,
    codingScore: 90
  });

  const expectedOverallScore = Math.round(80 * 0.3 + 70 * 0.3 + 90 * 0.4); // 24 + 21 + 36 = 81
  const calculatedOverall = mockUser.calculateOverallScore();
  console.log(`Expected overall score: ${expectedOverallScore}`);
  console.log(`Calculated overall score: ${calculatedOverall}`);
  assert.strictEqual(calculatedOverall, expectedOverallScore, 'User overall score calculation formula mismatched!');
  console.log('✅ Test 2 Passed: User overall score matches mathematical formula expectations.');

  console.log('\n🎉 All Score Calculation Tests Passed Successfully!');
  process.exit(0);
}

testScoreCalculations().catch(err => {
  console.error('❌ Tests failed:', err);
  process.exit(1);
});
