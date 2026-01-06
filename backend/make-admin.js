const mongoose = require('mongoose');
require('dotenv').config();

const email = process.argv[2] || 'admin@gmail.com';

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $set: { role: 'admin' } }
    );
    
    if (result.matchedCount === 0) {
      console.log(`No user found with email: ${email}`);
    } else if (result.modifiedCount > 0) {
      console.log(`Successfully updated ${email} to admin role!`);
    } else {
      console.log(`User ${email} is already an admin.`);
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
