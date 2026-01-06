const nodemailer = require('nodemailer');

// Create transporter - Configure with your email provider
const createTransporter = () => {
  // For Gmail, you need to use App Password (not your regular password)
  // For other providers, update the configuration accordingly
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password for Gmail
    },
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose = 'registration') => {
  const transporter = createTransporter();

  const subjects = {
    'registration': 'Verify Your Email - DocVerify',
    'login': 'Login Verification Code - DocVerify',
    'password-reset': 'Reset Your Password - DocVerify',
  };

  const messages = {
    'registration': 'Complete your registration by entering this verification code:',
    'login': 'Use this code to log in to your account:',
    'password-reset': 'Use this code to reset your password:',
  };

  const mailOptions = {
    from: {
      name: 'DocVerify',
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: subjects[purpose] || subjects['registration'],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DocVerify - Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0e1a;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Main Card -->
          <div style="background: linear-gradient(145deg, #111827 0%, #0f172a 50%, #1e1b4b 100%); border-radius: 24px; padding: 0; border: 1px solid rgba(99, 102, 241, 0.2); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            
            <!-- Header with gradient -->
            <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #10b981 100%); padding: 40px 40px 60px 40px; text-align: center; position: relative;">
              <!-- Logo SVG -->
              <div style="margin-bottom: 15px;">
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="15" width="50" height="70" rx="5" fill="white" opacity="0.9"/>
                  <rect x="40" y="20" width="50" height="70" rx="5" fill="white" opacity="0.7"/>
                  <circle cx="65" cy="55" r="20" fill="none" stroke="#10b981" stroke-width="4"/>
                  <path d="M58 55 L63 60 L73 50" stroke="#10b981" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="18" y="35" width="25" height="3" rx="1" fill="#6366f1"/>
                  <rect x="18" y="42" width="20" height="3" rx="1" fill="#6366f1"/>
                  <rect x="18" y="49" width="22" height="3" rx="1" fill="#6366f1"/>
                </svg>
              </div>
              <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">DocVerify</h1>
              <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">Secure Document Verification Platform</p>
            </div>
            
            <!-- Content Area -->
            <div style="padding: 40px; margin-top: -30px;">
              <!-- White content box -->
              <div style="background: #ffffff; border-radius: 16px; padding: 35px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                
                <!-- Icon -->
                <div style="text-align: center; margin-bottom: 25px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border-radius: 50%; padding: 15px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <!-- Title -->
                <h2 style="color: #1e293b; font-size: 22px; margin: 0 0 10px 0; text-align: center; font-weight: 600;">Verification Code</h2>
                
                <!-- Message -->
                <p style="color: #64748b; font-size: 15px; margin: 0 0 30px 0; text-align: center; line-height: 1.6;">
                  ${messages[purpose] || messages['registration']}
                </p>
                
                <!-- OTP Box -->
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 16px; padding: 25px; text-align: center; margin-bottom: 25px;">
                  <div style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #6366f1; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);">
                    ${otp}
                  </div>
                </div>
                
                <!-- Timer -->
                <div style="text-align: center; margin-bottom: 20px;">
                  <span style="display: inline-flex; align-items: center; gap: 8px; background: #ecfdf5; color: #059669; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 20px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" stroke="#059669" stroke-width="2"/>
                      <path d="M12 7V12L15 15" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Expires in 5 minutes
                  </span>
                </div>
                
                <!-- Divider -->
                <div style="height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent); margin: 25px 0;"></div>
                
                <!-- Security Tips -->
                <div style="background: #fef2f2; border-radius: 12px; padding: 15px; border-left: 4px solid #ef4444;">
                  <p style="color: #991b1b; font-size: 13px; margin: 0; display: flex; align-items: flex-start; gap: 8px;">
                    <span style="font-size: 16px;">🔒</span>
                    <span><strong>Security tip:</strong> Never share this code with anyone. DocVerify will never ask for your OTP via call or message.</span>
                  </p>
                </div>
              </div>
              
              <!-- Footer inside card -->
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #64748b; font-size: 13px; margin: 0 0 15px 0;">
                  Need help? <a href="#" style="color: #6366f1; text-decoration: none; font-weight: 600;">Contact Support</a>
                </p>
                <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 20px;">
                  <a href="#" style="color: #94a3b8; text-decoration: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                  </a>
                  <a href="#" style="color: #94a3b8; text-decoration: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </a>
                  <a href="#" style="color: #94a3b8; text-decoration: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </a>
                </div>
              </div>
            </div>
            
            <!-- Bottom accent bar -->
            <div style="height: 4px; background: linear-gradient(90deg, #6366f1, #818cf8, #10b981, #34d399);"></div>
          </div>
          
          <!-- Outside footer -->
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #475569; font-size: 12px; margin: 0 0 5px 0;">
              © ${new Date().getFullYear()} DocVerify. All rights reserved.
            </p>
            <p style="color: #64748b; font-size: 11px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
};
