import axios from 'axios';

async function testLogin() {
  console.log('Sending login request to http://localhost:5000/api/v1/auth/login...');
  try {
    const res = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@interniq.ai',
      password: 'Password123!'
    });
    console.log('Login Response Status:', res.status);
    console.log('Login Response Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Login Request Failed!');
    if (err.response) {
      console.error('Status Code:', err.response.status);
      console.error('Response Headers:', err.response.headers);
      console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error Message:', err.message);
    }
  }
}

testLogin();
