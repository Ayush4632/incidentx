require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'incidentx'
  });

  console.log('\n=== ALL REGISTERED USERS ===\n');
  const [users] = await c.query('SELECT userID, username, email, role, registrationDate FROM `USER`');
  users.forEach(u => {
    console.log('  ID: ' + u.userID + ' | Username: ' + u.username + ' | Email: ' + u.email + ' | Role: ' + u.role + ' | Registered: ' + u.registrationDate);
  });

  console.log('\n=== ALL INCIDENTS ===\n');
  const [incidents] = await c.query('SELECT incidentID, incidentType, severity, status FROM INCIDENT');
  incidents.forEach(i => {
    console.log('  #' + i.incidentID + ' | Type: ' + i.incidentType + ' | Severity: ' + i.severity + ' | Status: ' + i.status);
  });

  console.log('\nTotal Users: ' + users.length);
  console.log('Total Incidents: ' + incidents.length);

  await c.end();
})();
