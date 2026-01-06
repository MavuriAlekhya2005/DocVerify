require('dotenv').config();
const { sendOTPEmail, generateOTP } = require('./services/emailService');

async function testOTP() {
  const email = 'mavurialekhya@gmail.com';
  const otp = generateOTP();
  
  console.log('Generated OTP:', otp);
  console.log('Sending to:', email);
  
  try {
    await sendOTPEmail(email, otp, 'registration');
    console.log('✓ OTP sent successfully! Check your email.');
  } catch (error) {
    console.error('✗ Failed to send OTP:', error.message);
  }
}

testOTP();
