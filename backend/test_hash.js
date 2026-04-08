const bcrypt = require('bcrypt');

async function test() {
  const hash = '$2b$10$/.qIXVp6QzrSN8RHJFiq3eeb2ETuDTXD/Jm1W6qbNGMHHVODG11vm';
  const match1 = await bcrypt.compare('Admin@123', hash);
  const match2 = await bcrypt.compare('User@123', hash);
  console.log('Matches Admin@123:', match1);
  console.log('Matches User@123:', match2);
}
test();
