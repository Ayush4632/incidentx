const bcrypt = require('bcrypt');
const UserModel = require('./backend/models/user.model');
const db = require('./backend/config/db');

async function test() {
  try {
    const hash = await bcrypt.hash('Admin@123', 10);
    console.log('Valid hash for Admin@123:', hash);
    
    console.log('Testing DB connection...');
    const users = await db.query('SELECT * FROM USER');
    console.log('Users in DB:', users[0]);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}
test();
