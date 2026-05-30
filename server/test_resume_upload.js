import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const testUpload = async () => {
  try {
    // 1. Register a test user
    const email = `test_${Date.now()}@example.com`;
    const password = 'Password123!';
    console.log(`Registering ${email}...`);
    
    await axios.post('http://localhost:5000/api/v1/auth/register', {
      name: 'Test User',
      email,
      password
    });
    
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email,
      password
    });
    
    const token = loginRes.data.data.accessToken;
    console.log('Got token:', token.substring(0, 20) + '...');
    
    // 2. Create a dummy PDF file
    const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Title (Dummy PDF)\n>>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000010 00000 n \ntrailer\n<<\n/Size 2\n/Root 1 0 R\n>>\nstartxref\n49\n%%EOF\n');
    fs.writeFileSync('dummy.pdf', dummyPdf);
    
    // 3. Upload the file
    console.log('Uploading file...');
    const formData = new FormData();
    formData.append('resume', fs.createReadStream('dummy.pdf'), {
      filename: 'dummy.pdf',
      contentType: 'application/pdf'
    });
    
    const uploadRes = await axios.post('http://localhost:5000/api/v1/resume/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Upload response:', uploadRes.data);
    
  } catch (err) {
    if (err.response) {
      console.error('Server responded with:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
};

testUpload();
