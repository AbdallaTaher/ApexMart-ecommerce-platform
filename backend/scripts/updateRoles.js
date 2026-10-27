const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

const updateRoles = async () => {
  await mongoose.connect(process.env.DATABASE);
  const db = mongoose.connection.db;
  await db.collection('users').updateOne({ email: 'seller@apexmart.com' }, { $set: { role: 'seller' } });
  await db.collection('users').updateOne({ email: 'admin@apexmart.com' }, { $set: { role: 'admin' } });
  console.log('Roles promoted successfully!');
  await mongoose.disconnect();
};

updateRoles().catch(console.error);
