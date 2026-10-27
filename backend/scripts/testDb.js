const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load config.env
const envPath = path.join(__dirname, '..', 'config.env');
dotenv.config({ path: envPath });

const dbUri = process.env.DATABASE;

if (!dbUri) {
  console.error('❌ Error: DATABASE environment variable is not defined in backend/config.env');
  process.exit(1);
}

// Mask credentials for display
const maskedUri = dbUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:********@');
console.log(`🔍 Testing MongoDB connection...`);
console.log(`🌐 Target: ${maskedUri}`);

const startTime = Date.now();

mongoose
  .connect(dbUri, { serverSelectionTimeoutMS: 5000 })
  .then((con) => {
    const elapsed = Date.now() - startTime;
    console.log(`\n========================================`);
    console.log(`✅ MONGODB ATLAS CONNECTION SUCCESSFUL!`);
    console.log(`========================================`);
    console.log(`• Host:      ${con.connection.host}`);
    console.log(`• Port:      ${con.connection.port || 'Default / Replica Set'}`);
    console.log(`• Database:  ${con.connection.name}`);
    console.log(`• Status:    Connected (ReadyState: ${con.connection.readyState})`);
    console.log(`• Latency:   ${elapsed}ms`);
    console.log(`========================================\n`);
    process.exit(0);
  })
  .catch((err) => {
    const elapsed = Date.now() - startTime;
    console.error(`\n========================================`);
    console.error(`❌ MONGODB CONNECTION FAILED!`);
    console.error(`========================================`);
    console.error(`• Error:     ${err.message}`);
    console.error(`• Latency:   ${elapsed}ms`);
    console.error(`\n💡 Troubleshooting Checklist:`);
    console.error(` 1. Check Network Access in Atlas: Ensure '0.0.0.0/0' (Allow Access from Anywhere) is active.`);
    console.error(` 2. Verify Database User: Ensure the password does not contain unescaped special characters.`);
    console.error(` 3. Check Connection String: Ensure the database name (e.g. /apexmart) is in the URI.`);
    console.error(`========================================\n`);
    process.exit(1);
  });
