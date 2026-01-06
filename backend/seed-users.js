const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema (inline to avoid model conflicts)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['user', 'admin', 'verifier'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  authProvider: { type: String, default: 'local' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = [
      {
        name: 'Alekhya',
        email: 'alekhya@gmail.com',
        password: await bcrypt.hash('1234567890', 10),
        role: 'user',
        isVerified: true,
        status: 'active',
        authProvider: 'local'
      },
      {
        name: 'Admin',
        email: 'admin@gmail.com',
        password: await bcrypt.hash('1234567890', 10),
        role: 'admin',
        isVerified: true,
        status: 'active',
        authProvider: 'local'
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating...`);
        await User.updateOne({ email: userData.email }, userData);
      } else {
        await User.create(userData);
        console.log(`Created user: ${userData.email} (${userData.role})`);
      }
    }

    console.log('\n✅ Users seeded successfully!');
    console.log('\nCredentials:');
    console.log('1. alekhya@gmail.com / 1234567890 (user)');
    console.log('2. admin@gmail.com / 1234567890 (admin)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
