const app = require('./server'); // This starts the server on port 3000/fallback

async function test() {
  // Wait for server to start
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Testing Admin Login...');
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
    });
    const data = await res.json();
    console.log('Admin Login status:', res.status, 'Response:', data);
  } catch (err) {
    console.error('Admin Login Request Error:', err);
  }

  console.log('Testing Registration...');
  try {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newuser1', email: 'newuser1@test.com', password: 'Newuser@123' })
    });
    const data = await res.json();
    console.log('Registration status:', res.status, 'Response:', data);
  } catch (err) {
    console.error('Registration Request Error:', err);
  }
  
  process.exit();
}

test();
