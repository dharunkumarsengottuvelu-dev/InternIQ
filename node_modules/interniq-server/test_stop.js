import axios from 'axios';

async function testStop() {
  const email = `test_student_${Date.now()}@test.com`;
  const password = 'Password123!';
  const name = 'Test Student';

  try {
    console.log('1. Registering test user...');
    const regRes = await axios.post('http://localhost:5000/api/v1/auth/register', {
      name,
      email,
      password,
      role: 'student'
    });
    const { accessToken } = regRes.data.data;
    console.log('Registered successfully! Access Token obtained.');

    console.log('2. Hitting stop analysis endpoint...');
    const stopRes = await axios.post('http://localhost:5000/api/v1/resume/stop', {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    console.log('Response Status:', stopRes.status);
    console.log('Response Data:', JSON.stringify(stopRes.data, null, 2));

  } catch (err) {
    console.error('Request failed!');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error Message:', err.message);
    }
  }
}

testStop();
