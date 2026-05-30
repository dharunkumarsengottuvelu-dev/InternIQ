import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Peak at 50 concurrent users
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

const BASE_URL = 'http://localhost:5000/api/v1';

export default function () {
  // Simulate a Health Check
  const res = http.get(`${BASE_URL}/health`);
  check(res, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Example: Hitting an unauthenticated route (or simulate fetching public internships)
  // const internshipsRes = http.get(`${BASE_URL}/admin/internships?page=1&limit=10`);
  // check(internshipsRes, { 'status is 200 or 401': (r) => r.status === 200 || r.status === 401 });

  sleep(1);
}
