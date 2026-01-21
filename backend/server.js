const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const Certificate = require('./models/Certificate');
const User = require('./models/User');
const OTP = require('./models/OTP');
const { extractDocumentData, validateIntegrity } = require('./services/documentExtractor');
const { generateOTP, sendOTPEmail } = require('./services/emailService');
const { uploadBase64ToCloudinary, uploadFileToCloudinary, isCloudinaryConfigured, deleteFromCloudinary } = require('./services/cloudinaryService');
const blockchainService = require('./services/blockchainService');
const cacheService = require('./services/cacheService');
const aiService = require('./services/aiService');

const app = express();

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'docverify-secret-key-change-in-production';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// Initialize Redis cache service
cacheService.initialize().then(() => {
  console.log('Cache service initialized');
}).catch(err => {
  console.log('Cache service running in memory-only mode');
});


// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Helper: Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper: Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper: Generate certificate ID
const generateCertificateId = () => `DOC-${uuidv4().split('-')[0].toUpperCase()}`;

// Helper: Generate access key
const generateAccessKey = () => crypto.randomBytes(8).toString('hex').toUpperCase();

// Helper: Generate document hash
const generateHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

// ==================== OTP ROUTES ====================

// POST /api/otp/send - Send OTP to email
app.post('/api/otp/send', async (req, res) => {
  try {
    const { email, purpose = 'registration' } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check rate limiting - max 3 OTPs per email per 10 minutes
    const recentOTPs = await OTP.countDocuments({
      email: email.toLowerCase(),
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
    });

    if (recentOTPs >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please wait 10 minutes.'
      });
    }

    // For registration, check if email is already registered
    if (purpose === 'registration') {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This email is already registered'
        });
      }
    }

    // For login/password-reset, check if user exists
    if (purpose === 'login' || purpose === 'password-reset') {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email'
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Delete any existing OTPs for this email and purpose
    await OTP.deleteMany({ email: email.toLowerCase(), purpose });

    // Save new OTP
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      purpose,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // Send OTP email
    await sendOTPEmail(email, otp, purpose);

    res.json({
      success: true,
      message: 'OTP sent successfully to your email',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP. Please check your email configuration.' 
    });
  }
});

// POST /api/otp/verify - Verify OTP
app.post('/api/otp/verify', async (req, res) => {
  try {
    const { email, otp, purpose = 'registration' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      purpose,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new one.'
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`
      });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    res.json({
      success: true,
      message: 'OTP verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== AUTH ROUTES ====================

// POST /api/auth/register - Register new user (with OTP verification)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, organization, otp } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    // Verify OTP if provided
    if (otp) {
      const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        purpose: 'registration',
        verified: true,
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'Please verify your email with OTP first'
        });
      }

      // Delete the used OTP
      await OTP.deleteOne({ _id: otpRecord._id });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'user',
      organization: organization || '',
      isVerified: !!otp, // Mark as verified if OTP was provided
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login - Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/reset-password - Reset password with OTP
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate required fields
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find and verify the OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'password-reset',
      verified: true,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your OTP first'
      });
    }

    // Find the user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/me - Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== GOOGLE OAUTH ROUTES ====================

// GET /api/auth/google - Redirect to Google OAuth
app.get('/api/auth/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&access_type=offline` +
    `&prompt=consent`;
  
  res.redirect(googleAuthUrl);
});

// GET /api/auth/google/callback - Handle Google OAuth callback
app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
      return res.redirect('http://localhost:5173/login?error=No authorization code received');
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      console.error('Token error:', tokens);
      return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(tokens.error_description || tokens.error)}`);
    }
    
    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    
    const googleUser = await userInfoResponse.json();
    
    if (!googleUser.email) {
      return res.redirect('http://localhost:5173/login?error=Could not get email from Google');
    }
    
    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { googleId: googleUser.id },
        { email: googleUser.email.toLowerCase() }
      ]
    });
    
    if (user) {
      // Update existing user with Google info if not already set
      if (!user.googleId) {
        user.googleId = googleUser.id;
        user.authProvider = 'google';
      }
      if (!user.avatar && googleUser.picture) {
        user.avatar = googleUser.picture;
      }
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email.toLowerCase(),
        googleId: googleUser.id,
        avatar: googleUser.picture,
        authProvider: 'google',
        isVerified: true,
        role: 'user',
      });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Redirect to frontend with token
    const frontendUrl = `http://localhost:5173/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user.toJSON()))}`;
    res.redirect(frontendUrl);
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('Authentication failed')}`);
  }
});

// POST /api/auth/google/token - Exchange Google ID token for JWT (for frontend SDK)
app.post('/api/auth/google/token', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }
    
    // Verify the Google ID token
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const payload = await response.json();
    
    if (payload.error) {
      return res.status(401).json({ success: false, message: 'Invalid Google token' });
    }
    
    // Verify the token is for our app
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ success: false, message: 'Token not intended for this app' });
    }
    
    const { sub: googleId, email, name, picture } = payload;
    
    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email: email.toLowerCase() }
      ]
    });
    
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
        avatar: picture,
        authProvider: 'google',
        isVerified: true,
        role: 'user',
      });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error('Google token verification error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
});

// ==================== GITHUB OAUTH ROUTES ====================

// GET /api/auth/github - Redirect to GitHub OAuth
app.get('/api/auth/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback';
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent('user:email read:user')}`;
  
  res.redirect(githubAuthUrl);
});

// GET /api/auth/github/callback - Handle GitHub OAuth callback
app.get('/api/auth/github/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
      return res.redirect('http://localhost:5173/login?error=No authorization code received');
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        redirect_uri: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      console.error('GitHub token error:', tokens);
      return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(tokens.error_description || tokens.error)}`);
    }
    
    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${tokens.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DocVerify-App'
      },
    });
    
    const githubUser = await userResponse.json();
    
    // Get user's primary email if not public
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: { 
          Authorization: `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DocVerify-App'
        },
      });
      const emails = await emailsResponse.json();
      const primaryEmail = emails.find(e => e.primary && e.verified);
      email = primaryEmail ? primaryEmail.email : (emails[0] ? emails[0].email : null);
    }
    
    if (!email) {
      return res.redirect('http://localhost:5173/login?error=Could not get email from GitHub');
    }
    
    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { githubId: githubUser.id.toString() },
        { email: email.toLowerCase() }
      ]
    });
    
    if (user) {
      // Update existing user with GitHub info if not already set
      if (!user.githubId) {
        user.githubId = githubUser.id.toString();
        if (!user.authProvider) user.authProvider = 'github';
      }
      if (!user.avatar && githubUser.avatar_url) {
        user.avatar = githubUser.avatar_url;
      }
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name: githubUser.name || githubUser.login,
        email: email.toLowerCase(),
        githubId: githubUser.id.toString(),
        avatar: githubUser.avatar_url,
        authProvider: 'github',
        isVerified: true,
        role: 'user',
      });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Redirect to frontend with token
    const frontendUrl = `http://localhost:5173/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user.toJSON()))}`;
    res.redirect(frontendUrl);
    
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('Authentication failed')}`);
  }
});

// ==================== DOCUMENT ROUTES ====================

// POST /api/upload - Upload document and generate certificate with AI extraction
app.post('/api/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = path.join(uploadsDir, req.file.filename);
    const { title } = req.body;

    // Generate certificate data
    const certificateId = generateCertificateId();
    const accessKey = generateAccessKey();
    const documentHash = generateHash(filePath);

    // Generate QR code with certificate ID and access key
    const qrData = JSON.stringify({ certificateId, accessKey });
    const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    // Extract document data using AI/ML
    let extractedData = null;
    let extractionStatus = 'pending';
    let extractionError = null;

    try {
      extractedData = await extractDocumentData(filePath, req.file.mimetype);
      extractionStatus = 'completed';
      console.log(`Document extraction completed for ${certificateId} with confidence: ${extractedData.verificationSummary.confidenceScore}%`);
    } catch (extractError) {
      console.error('Extraction error:', extractError.message);
      extractionStatus = 'failed';
      extractionError = extractError.message;
      // Create minimal extracted data structure
      extractedData = {
        primaryDetails: {
          documentType: 'unknown',
          fields: {},
          hash: crypto.createHash('sha256').update('{}').digest('hex'),
          extractedAt: new Date().toISOString(),
          confidenceScore: 0,
        },
        fullDetails: {
          rawText: '',
          structuredData: {},
          dates: [],
          signatures: [],
          lineCount: 0,
          wordCount: 0,
          pdfMetadata: {},
          hash: crypto.createHash('sha256').update('{}').digest('hex'),
          extractionMetadata: { textLength: 0, pages: 0, ocrConfidence: 0 },
        },
        verificationSummary: {
          documentType: 'unknown',
          holderName: 'Extraction failed',
          documentNumber: 'N/A',
          issueDate: 'N/A',
          issuingAuthority: 'N/A',
          confidenceScore: 0,
          integrityHash: documentHash,
        },
      };
    }

    // Save to database with extracted data
    const certificate = await Certificate.create({
      certificateId,
      title: title || extractedData.verificationSummary.qualification || 'Untitled Certificate',
      documentHash,
      accessKey,
      qrCode,
      originalFilename: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.filename,
      // Extracted data (two-tier storage)
      primaryDetails: extractedData.primaryDetails,
      fullDetails: extractedData.fullDetails,
      verificationSummary: extractedData.verificationSummary,
      extractionStatus,
      extractionError,
    });

    res.status(201).json({
      success: true,
      data: {
        certificateId: certificate.certificateId,
        title: certificate.title,
        documentHash: certificate.documentHash,
        accessKey: certificate.accessKey,
        qrCode: certificate.qrCode,
        createdAt: certificate.createdAt,
        // Include extraction info
        extraction: {
          status: extractionStatus,
          confidenceScore: extractedData.verificationSummary.confidenceScore,
          documentType: extractedData.primaryDetails.documentType,
          detectedFields: Object.keys(extractedData.primaryDetails.fields).length,
        },
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/certificates - Get all certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .select('-qrCode -filePath')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/certificates/:id - Get single certificate
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.json({ success: true, data: certificate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/verify - Verify certificate with tiered access (with caching)
app.post('/api/verify', cacheService.rateLimitMiddleware('verify', 100, 60), async (req, res) => {
  try {
    const { certificateId, accessKey } = req.body;

    if (!certificateId) {
      return res.status(400).json({ success: false, message: 'Certificate ID required' });
    }

    // Check cache for partial verification (no access key)
    if (!accessKey) {
      const cached = await cacheService.getCachedVerification(certificateId);
      if (cached) {
        return res.json({ ...cached, cached: true });
      }
    }

    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      return res.status(404).json({ success: false, status: 'invalid', message: 'Certificate not found' });
    }

    // Update verification count
    certificate.verificationCount += 1;
    certificate.lastVerifiedAt = new Date();

    // PARTIAL ACCESS - Basic verification (no access key required)
    // Returns primary details suitable for quick verification / blockchain lookup
    const response = {
      success: true,
      status: 'valid',
      accessLevel: 'partial',
      data: {
        certificateId: certificate.certificateId,
        title: certificate.title,
        documentHash: certificate.documentHash,
        createdAt: certificate.createdAt,
        // Primary details for quick read
        verificationSummary: certificate.verificationSummary,
        primaryDetails: {
          documentType: certificate.primaryDetails?.documentType,
          confidenceScore: certificate.primaryDetails?.confidenceScore,
          integrityHash: certificate.primaryDetails?.hash,
          // Limited fields for partial access
          fields: {
            holderName: certificate.primaryDetails?.fields?.name || certificate.verificationSummary?.holderName,
            documentNumber: certificate.primaryDetails?.fields?.documentNumber || certificate.verificationSummary?.documentNumber,
            issuingAuthority: certificate.primaryDetails?.fields?.issuingAuthority || certificate.verificationSummary?.issuingAuthority,
          },
        },
        extractionStatus: certificate.extractionStatus,
        verificationCount: certificate.verificationCount,
      },
    };

    // FULL ACCESS - Complete details (requires access key)
    if (accessKey && accessKey === certificate.accessKey) {
      certificate.fullAccessCount += 1;
      certificate.lastFullAccessAt = new Date();
      
      response.accessLevel = 'full';
      response.data.qrCode = certificate.qrCode;
      response.data.fullAccess = true;
      
      // Include complete primary details
      response.data.primaryDetails = certificate.primaryDetails;
      
      // Include full details from database
      response.data.fullDetails = {
        structuredData: certificate.fullDetails?.structuredData,
        dates: certificate.fullDetails?.dates,
        signatures: certificate.fullDetails?.signatures,
        wordCount: certificate.fullDetails?.wordCount,
        lineCount: certificate.fullDetails?.lineCount,
        extractionMetadata: certificate.fullDetails?.extractionMetadata,
        integrityHash: certificate.fullDetails?.hash,
      };
      
      // Include file info for download
      response.data.fileInfo = {
        originalFilename: certificate.originalFilename,
        fileType: certificate.fileType,
        fileSize: certificate.fileSize,
        downloadAvailable: !!certificate.filePath && fs.existsSync(path.join(uploadsDir, certificate.filePath)),
      };
      
      // Access statistics
      response.data.accessStats = {
        verificationCount: certificate.verificationCount,
        fullAccessCount: certificate.fullAccessCount,
        downloadCount: certificate.downloadCount,
        lastVerifiedAt: certificate.lastVerifiedAt,
        lastFullAccessAt: certificate.lastFullAccessAt,
      };
    }

    await certificate.save();
    
    // Cache partial verification result (not full access)
    if (!accessKey) {
      await cacheService.cacheVerification(certificateId, response, 300);
    }
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/download/:id - Download original document (requires access key)
app.get('/api/download/:id', async (req, res) => {
  try {
    const { accessKey } = req.query;
    const certificate = await Certificate.findOne({ certificateId: req.params.id });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    if (!accessKey || accessKey !== certificate.accessKey) {
      return res.status(403).json({ success: false, message: 'Valid access key required for download' });
    }

    const filePath = path.join(uploadsDir, certificate.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document file not found' });
    }

    // Update download count
    certificate.downloadCount += 1;
    await certificate.save();

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.originalFilename}"`);
    res.setHeader('Content-Type', certificate.fileType);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/verify/quick/:id - Quick verification (primary details only, no access key)
app.get('/api/verify/quick/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findOne(
      { certificateId: req.params.id },
      'certificateId title documentHash verificationSummary primaryDetails.documentType primaryDetails.confidenceScore primaryDetails.hash extractionStatus createdAt'
    );

    if (!certificate) {
      return res.status(404).json({ success: false, status: 'invalid', message: 'Certificate not found' });
    }

    // Increment verification count
    await Certificate.updateOne(
      { certificateId: req.params.id },
      { $inc: { verificationCount: 1 }, lastVerifiedAt: new Date() }
    );

    res.json({
      success: true,
      status: 'valid',
      accessLevel: 'quick',
      data: {
        certificateId: certificate.certificateId,
        title: certificate.title,
        documentHash: certificate.documentHash,
        verificationSummary: certificate.verificationSummary,
        documentType: certificate.primaryDetails?.documentType,
        confidenceScore: certificate.primaryDetails?.confidenceScore,
        integrityHash: certificate.primaryDetails?.hash,
        extractionStatus: certificate.extractionStatus,
        createdAt: certificate.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  const cacheStats = await cacheService.getStats();
  res.json({ 
    success: true, 
    message: 'DocVerify API running',
    services: {
      cache: cacheStats.isRedisConnected ? 'redis' : 'memory',
      ai: aiService.checkAvailability() ? 'openai' : 'fallback',
      blockchain: blockchainService.isAvailable() ? 'connected' : 'disconnected',
    }
  });
});

// ==================== AI EXTRACTION ROUTES ====================

// POST /api/ai/extract - Extract fields from document text using AI
app.post('/api/ai/extract', authenticateToken, cacheService.rateLimitMiddleware('ai-extract', 20, 60), async (req, res) => {
  try {
    const { text, documentType, filePath: docFilePath } = req.body;

    if (!text && !docFilePath) {
      return res.status(400).json({ success: false, message: 'Text or file path required' });
    }

    let textToProcess = text;
    
    // If file path provided, read and extract text
    if (docFilePath && !text) {
      const fullPath = path.join(uploadsDir, docFilePath);
      if (fs.existsSync(fullPath)) {
        const extractedData = await extractDocumentData(fullPath, 'application/pdf');
        textToProcess = extractedData.fullDetails?.rawText || '';
      }
    }

    const result = await aiService.extractFields(textToProcess, documentType);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI extraction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/ai/suggest - Get field suggestions based on partial input
app.post('/api/ai/suggest', authenticateToken, cacheService.rateLimitMiddleware('ai-suggest', 50, 60), async (req, res) => {
  try {
    const { fieldName, partialValue, context } = req.body;

    if (!fieldName || !partialValue) {
      return res.status(400).json({ success: false, message: 'Field name and partial value required' });
    }

    const suggestions = await aiService.getFieldSuggestions(fieldName, partialValue, context);
    
    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/ai/validate - Validate and enhance extracted data
app.post('/api/ai/validate', authenticateToken, async (req, res) => {
  try {
    const { fields, documentType } = req.body;

    if (!fields) {
      return res.status(400).json({ success: false, message: 'Fields data required' });
    }

    const result = await aiService.validateAndEnhance(fields, documentType);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/ai/document-types - Get supported document types and their fields
app.get('/api/ai/document-types', (req, res) => {
  const types = aiService.getSupportedDocumentTypes();
  res.json({
    success: true,
    data: types,
  });
});

// GET /api/ai/fields/:type - Get recommended fields for a document type
app.get('/api/ai/fields/:type', (req, res) => {
  const fields = aiService.getRecommendedFields(req.params.type);
  res.json({
    success: true,
    data: fields,
  });
});

// POST /api/ai/summary - Generate document summary
app.post('/api/ai/summary', authenticateToken, cacheService.rateLimitMiddleware('ai-summary', 10, 60), async (req, res) => {
  try {
    const { text, documentType } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Text required' });
    }

    const summary = await aiService.generateSummary(text, documentType);
    
    res.json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/ai/status - Get AI service status
app.get('/api/ai/status', (req, res) => {
  res.json({
    success: true,
    data: {
      available: aiService.checkAvailability(),
      provider: aiService.checkAvailability() ? 'OpenAI' : 'Fallback (Regex)',
      model: aiService.checkAvailability() ? process.env.OPENAI_MODEL || 'gpt-3.5-turbo' : 'N/A',
    },
  });
});

// ==================== CACHE ROUTES ====================

// GET /api/cache/stats - Get cache statistics (admin only)
app.get('/api/cache/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const stats = await cacheService.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/cache/invalidate/:type/:id - Invalidate specific cache (admin only)
app.delete('/api/cache/invalidate/:type/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { type, id } = req.params;
    
    switch (type) {
      case 'verification':
        await cacheService.invalidateVerification(id);
        break;
      case 'document':
        await cacheService.invalidateDocument(id);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid cache type' });
    }

    res.json({
      success: true,
      message: `Cache invalidated for ${type}:${id}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== GAS ESTIMATION ROUTES ====================

// GET /api/blockchain/gas/prices - Get current gas prices
app.get('/api/blockchain/gas/prices', async (req, res) => {
  try {
    const prices = await blockchainService.getGasPrices();
    res.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/blockchain/gas/estimate - Estimate gas for an operation
app.post('/api/blockchain/gas/estimate', authenticateToken, async (req, res) => {
  try {
    const { operation, documentHash, documentId, documentHashes, batchId } = req.body;

    if (!operation) {
      return res.status(400).json({ success: false, message: 'Operation type required' });
    }

    const report = await blockchainService.getGasEstimationReport(operation, {
      documentHash,
      documentId,
      documentHashes,
      batchId,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/blockchain/wallet - Get wallet balance
app.get('/api/blockchain/wallet', authenticateToken, async (req, res) => {
  try {
    const balance = await blockchainService.getWalletBalance();
    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ENHANCED ANALYTICS ROUTES ====================

// GET /api/analytics/detailed - Get detailed analytics (admin only)
app.get('/api/analytics/detailed', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // Check cache first
    const cached = await cacheService.getCachedAnalytics('detailed');
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Get basic counts
    const [totalCertificates, totalUsers] = await Promise.all([
      Certificate.countDocuments(),
      User.countDocuments(),
    ]);

    // Get verification stats
    const verificationStats = await Certificate.aggregate([
      {
        $group: {
          _id: null,
          totalVerifications: { $sum: '$verificationCount' },
          totalFullAccess: { $sum: '$fullAccessCount' },
          totalDownloads: { $sum: '$downloadCount' },
          avgConfidence: { $avg: '$primaryDetails.confidenceScore' },
        }
      }
    ]);

    // Get certificates by extraction status
    const statusCounts = await Certificate.aggregate([
      { $group: { _id: '$extractionStatus', count: { $sum: 1 } } }
    ]);

    // Get certificates by document type
    const typeDistribution = await Certificate.aggregate([
      { $group: { _id: '$primaryDetails.documentType', count: { $sum: 1 } } }
    ]);

    // Get user role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get hourly activity (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourlyActivity = await Certificate.aggregate([
      { $match: { createdAt: { $gte: last24Hours } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          documents: { $sum: 1 },
          verifications: { $sum: '$verificationCount' },
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get daily activity (last 30 days)
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyActivity = await Certificate.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          documents: { $sum: 1 },
          verifications: { $sum: '$verificationCount' },
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get monthly trends (last 12 months)
    const last12Months = new Date();
    last12Months.setMonth(last12Months.getMonth() - 12);
    const monthlyTrends = await Certificate.aggregate([
      { $match: { createdAt: { $gte: last12Months } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          documents: { $sum: 1 },
          verifications: { $sum: '$verificationCount' },
          downloads: { $sum: '$downloadCount' },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top verified documents
    const topVerified = await Certificate.find()
      .sort({ verificationCount: -1 })
      .limit(10)
      .select('certificateId title verificationCount createdAt primaryDetails.documentType');

    // Get recent activity
    const recentDocuments = await Certificate.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('certificateId title createdAt primaryDetails.documentType extractionStatus');

    // Get average processing metrics
    const processingMetrics = await Certificate.aggregate([
      {
        $group: {
          _id: null,
          avgWordCount: { $avg: '$fullDetails.wordCount' },
          avgLineCount: { $avg: '$fullDetails.lineCount' },
          totalWithOCR: {
            $sum: { $cond: [{ $gt: ['$fullDetails.extractionMetadata.ocrConfidence', 0] }, 1, 0] }
          },
        }
      }
    ]);

    // Get blockchain stats
    const blockchainStats = await blockchainService.getStats();

    // Compile analytics data
    const analyticsData = {
      overview: {
        totalCertificates,
        totalUsers,
        totalVerifications: verificationStats[0]?.totalVerifications || 0,
        totalFullAccess: verificationStats[0]?.totalFullAccess || 0,
        totalDownloads: verificationStats[0]?.totalDownloads || 0,
        avgConfidenceScore: Math.round(verificationStats[0]?.avgConfidence || 0),
      },
      distributions: {
        byStatus: statusCounts.reduce((acc, s) => ({ ...acc, [s._id || 'unknown']: s.count }), {}),
        byType: typeDistribution.map(t => ({ type: t._id || 'unknown', count: t.count })),
        byUserRole: roleDistribution.reduce((acc, r) => ({ ...acc, [r._id || 'user']: r.count }), {}),
      },
      activity: {
        hourly: hourlyActivity.map(h => ({ hour: h._id, ...h })),
        daily: dailyActivity,
        monthly: monthlyTrends.map(m => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          documents: m.documents,
          verifications: m.verifications,
          downloads: m.downloads,
        })),
      },
      topPerformers: {
        mostVerified: topVerified,
        recentDocuments,
      },
      processing: {
        avgWordCount: Math.round(processingMetrics[0]?.avgWordCount || 0),
        avgLineCount: Math.round(processingMetrics[0]?.avgLineCount || 0),
        ocrProcessedCount: processingMetrics[0]?.totalWithOCR || 0,
      },
      blockchain: blockchainStats,
      services: {
        ai: aiService.checkAvailability() ? 'active' : 'fallback',
        cache: cacheService.isAvailable() ? 'redis' : 'memory',
        blockchain: blockchainService.isAvailable() ? 'connected' : 'disconnected',
      },
      generatedAt: new Date().toISOString(),
    };

    // Cache for 5 minutes
    await cacheService.cacheAnalytics('detailed', analyticsData, 300);

    res.json({
      success: true,
      data: analyticsData,
      cached: false,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/realtime - Get real-time metrics
app.get('/api/analytics/realtime', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // Get last hour stats
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);

    const [recentDocs, veryRecentDocs] = await Promise.all([
      Certificate.countDocuments({ createdAt: { $gte: lastHour } }),
      Certificate.countDocuments({ createdAt: { $gte: last5Minutes } }),
    ]);

    const recentVerifications = await Certificate.aggregate([
      { $match: { lastVerifiedAt: { $gte: lastHour } } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        lastHour: {
          newDocuments: recentDocs,
          verifications: recentVerifications[0]?.count || 0,
        },
        last5Minutes: {
          newDocuments: veryRecentDocs,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/stats - Get dashboard statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalCertificates = await Certificate.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Get verification stats
    const verificationStats = await Certificate.aggregate([
      {
        $group: {
          _id: null,
          totalVerifications: { $sum: '$verificationCount' },
          totalFullAccess: { $sum: '$fullAccessCount' },
          totalDownloads: { $sum: '$downloadCount' },
        }
      }
    ]);
    
    // Get certificates by extraction status
    const statusCounts = await Certificate.aggregate([
      {
        $group: {
          _id: '$extractionStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get certificates created in last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentCertificates = await Certificate.countDocuments({
      createdAt: { $gte: last7Days }
    });
    
    // Get monthly data for charts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = await Certificate.aggregate([
      {
        $match: { createdAt: { $gte: sixMonthsAgo } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          certificates: { $sum: 1 },
          verifications: { $sum: '$verificationCount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Get document type distribution
    const typeDistribution = await Certificate.aggregate([
      {
        $group: {
          _id: '$primaryDetails.documentType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalCertificates,
        totalUsers,
        totalVerifications: verificationStats[0]?.totalVerifications || 0,
        totalFullAccess: verificationStats[0]?.totalFullAccess || 0,
        totalDownloads: verificationStats[0]?.totalDownloads || 0,
        recentCertificates,
        statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s._id || 'unknown']: s.count }), {}),
        monthlyData: monthlyData.map(m => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          certificates: m.certificates,
          verifications: m.verifications
        })),
        typeDistribution: typeDistribution.map(t => ({
          type: t._id || 'unknown',
          count: t.count
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/certificates/issue - Issue a new certificate (admin)
app.post('/api/certificates/issue', authenticateToken, async (req, res) => {
  try {
    const { recipientName, recipientEmail, documentType, documentTitle, issueDate, expiryDate, description, grade } = req.body;
    
    // Validate required fields
    if (!recipientName || !documentTitle) {
      return res.status(400).json({ success: false, message: 'Recipient name and document title are required' });
    }
    
    // Generate certificate data
    const certificateId = generateCertificateId();
    const accessKey = generateAccessKey();
    const documentHash = crypto.createHash('sha256')
      .update(JSON.stringify({ recipientName, documentTitle, issueDate, description }))
      .digest('hex');
    
    // Generate QR code
    const qrData = JSON.stringify({ certificateId, accessKey });
    const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    
    // Create certificate
    const certificate = await Certificate.create({
      certificateId,
      title: documentTitle,
      documentHash,
      accessKey,
      qrCode,
      originalFilename: `${documentTitle}.pdf`,
      fileType: 'application/pdf',
      extractionStatus: 'completed',
      primaryDetails: {
        documentType: documentType || 'certificate',
        fields: {
          name: recipientName,
          documentNumber: certificateId,
          issueDate: issueDate || new Date().toISOString().split('T')[0],
          expiryDate: expiryDate || null,
          issuingAuthority: req.user?.email || 'DocVerify Admin',
          qualification: documentTitle,
          grade: grade || null,
        },
        hash: documentHash,
        extractedAt: new Date(),
        confidenceScore: 100,
      },
      fullDetails: {
        rawText: description || '',
        structuredData: new Map([
          ['recipientName', recipientName],
          ['recipientEmail', recipientEmail || ''],
          ['documentType', documentType || 'certificate'],
          ['grade', grade || ''],
        ]),
        dates: [issueDate, expiryDate].filter(Boolean),
        signatures: [],
        lineCount: 1,
        wordCount: description?.split(' ').length || 0,
        hash: documentHash,
        extractionMetadata: { textLength: description?.length || 0, pages: 1, ocrConfidence: 100 },
      },
      verificationSummary: {
        documentType: documentType || 'certificate',
        holderName: recipientName,
        documentNumber: certificateId,
        issueDate: issueDate || new Date().toISOString().split('T')[0],
        issuingAuthority: req.user?.email || 'DocVerify Admin',
        qualification: documentTitle,
        grade: grade || null,
        validUntil: expiryDate || 'Not specified',
        confidenceScore: 100,
        integrityHash: documentHash,
      },
    });
    
    res.status(201).json({
      success: true,
      data: {
        certificateId: certificate.certificateId,
        accessKey: certificate.accessKey,
        documentHash: certificate.documentHash,
        qrCode: certificate.qrCode,
        title: certificate.title,
        recipientName,
        recipientEmail,
        createdAt: certificate.createdAt,
      }
    });
  } catch (error) {
    console.error('Issue certificate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/certificates/:id - Delete/revoke a certificate
app.delete('/api/certificates/:id', authenticateToken, async (req, res) => {
  try {
    const certificate = await Certificate.findOneAndDelete({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    
    // Delete the file if exists
    if (certificate.filePath) {
      const filePath = path.join(uploadsDir, certificate.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== USER DOCUMENT ISSUANCE ROUTES ====================

// POST /api/documents/issue - Issue a document (any authenticated user)
app.post('/api/documents/issue', authenticateToken, async (req, res) => {
  try {
    const { documentId, accessKey, documentType, templateId, formData, codeType } = req.body;
    
    // Validate required fields
    if (!documentId || !accessKey || !documentType || !templateId || !formData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Document ID, access key, type, template, and form data are required' 
      });
    }
    
    // Generate document hash from form data
    const documentHash = crypto.createHash('sha256')
      .update(JSON.stringify(formData))
      .digest('hex');
    
    // Generate QR code
    const qrData = JSON.stringify({ 
      documentId, 
      type: documentType,
      url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${documentId}`
    });
    const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    
    // Determine document title based on type
    let title = 'Untitled Document';
    if (documentType === 'student_id') {
      title = `Student ID - ${formData.studentName || 'Unknown'}`;
    } else if (documentType === 'bill') {
      title = `Invoice ${formData.billNumber || documentId}`;
    } else if (documentType === 'certificate') {
      title = formData.certificateTitle || 'Certificate';
    }
    
    // Create the certificate/document record
    const certificate = await Certificate.create({
      certificateId: documentId,
      title,
      documentHash,
      accessKey,
      qrCode,
      originalFilename: `${documentId}.pdf`,
      fileType: 'application/pdf',
      extractionStatus: 'completed',
      issuedBy: req.user.id,
      primaryDetails: {
        documentType,
        templateId,
        fields: formData,
        hash: documentHash,
        extractedAt: new Date(),
        confidenceScore: 100,
      },
      fullDetails: {
        rawText: JSON.stringify(formData),
        structuredData: new Map(Object.entries(formData)),
        dates: [],
        signatures: [],
        lineCount: 1,
        wordCount: Object.keys(formData).length,
        hash: documentHash,
        extractionMetadata: { 
          textLength: JSON.stringify(formData).length, 
          pages: 1, 
          ocrConfidence: 100,
          templateId,
          codeType: codeType || 'qr',
        },
      },
      verificationSummary: {
        documentType,
        holderName: formData.studentName || formData.recipientName || formData.customerName || 'Not specified',
        documentNumber: documentId,
        issueDate: new Date().toISOString().split('T')[0],
        issuingAuthority: req.user.email,
        confidenceScore: 100,
        integrityHash: documentHash,
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Document issued successfully',
      data: {
        documentId: certificate.certificateId,
        accessKey: certificate.accessKey,
        documentHash: certificate.documentHash,
        qrCode: certificate.qrCode,
        title: certificate.title,
        verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${documentId}`,
        createdAt: certificate.createdAt,
      }
    });
  } catch (error) {
    console.error('Issue document error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/documents/bulk-issue - Bulk issue documents (any authenticated user)
app.post('/api/documents/bulk-issue', authenticateToken, async (req, res) => {
  try {
    const { documents } = req.body;
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Documents array is required' 
      });
    }
    
    // Limit bulk issuance to 100 documents at a time
    if (documents.length > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum 100 documents can be issued at once' 
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const doc of documents) {
      try {
        const { documentId, accessKey, documentType, templateId, formData, codeType } = doc;
        
        // Generate document hash
        const documentHash = crypto.createHash('sha256')
          .update(JSON.stringify(formData))
          .digest('hex');
        
        // Generate QR code
        const qrData = JSON.stringify({ 
          documentId, 
          type: documentType,
          url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${documentId}`
        });
        const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
        
        // Determine title
        let title = 'Untitled Document';
        if (documentType === 'student_id') {
          title = `Student ID - ${formData.studentName || 'Unknown'}`;
        } else if (documentType === 'bill') {
          title = `Invoice ${formData.billNumber || documentId}`;
        } else if (documentType === 'certificate') {
          title = formData.certificateTitle || 'Certificate';
        }
        
        // Create certificate
        const certificate = await Certificate.create({
          certificateId: documentId,
          title,
          documentHash,
          accessKey,
          qrCode,
          originalFilename: `${documentId}.pdf`,
          fileType: 'application/pdf',
          extractionStatus: 'completed',
          issuedBy: req.user.id,
          primaryDetails: {
            documentType,
            templateId,
            fields: formData,
            hash: documentHash,
            extractedAt: new Date(),
            confidenceScore: 100,
          },
          fullDetails: {
            rawText: JSON.stringify(formData),
            structuredData: new Map(Object.entries(formData)),
            dates: [],
            signatures: [],
            lineCount: 1,
            wordCount: Object.keys(formData).length,
            hash: documentHash,
            extractionMetadata: { 
              textLength: JSON.stringify(formData).length, 
              pages: 1, 
              ocrConfidence: 100,
              templateId,
              codeType: codeType || 'qr',
            },
          },
          verificationSummary: {
            documentType,
            holderName: formData.studentName || formData.recipientName || formData.customerName || 'Not specified',
            documentNumber: documentId,
            issueDate: new Date().toISOString().split('T')[0],
            issuingAuthority: req.user.email,
            confidenceScore: 100,
            integrityHash: documentHash,
          },
        });
        
        results.push({
          documentId: certificate.certificateId,
          accessKey: certificate.accessKey,
          title: certificate.title,
          success: true,
        });
      } catch (err) {
        errors.push({
          documentId: doc.documentId,
          error: err.message,
          success: false,
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Issued ${results.length} documents with ${errors.length} errors`,
      data: {
        issued: results.length,
        failed: errors.length,
        results,
        errors,
      }
    });
  } catch (error) {
    console.error('Bulk issue error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/documents/wysiwyg - Save a WYSIWYG document created in the editor
app.post('/api/documents/wysiwyg', authenticateToken, async (req, res) => {
  try {
    const { canvasData, preview, documentType, templateId, templateName } = req.body;
    
    // Validate required fields
    if (!canvasData || !preview) {
      return res.status(400).json({ 
        success: false, 
        message: 'Canvas data and preview image are required' 
      });
    }
    
    // Generate unique IDs
    const documentId = generateCertificateId();
    const accessKey = generateAccessKey();
    
    // Generate document hash from canvas data
    const documentHash = crypto.createHash('sha256')
      .update(JSON.stringify(canvasData))
      .digest('hex');
    
    // Upload preview image to Cloudinary (if configured)
    let previewUrl = preview;
    if (isCloudinaryConfigured()) {
      try {
        const cloudinaryResult = await uploadBase64ToCloudinary(preview);
        previewUrl = cloudinaryResult.secure_url || cloudinaryResult.url;
      } catch (uploadErr) {
        console.log('Cloudinary upload failed, using base64 preview');
      }
    }
    
    // Generate QR code
    const qrData = JSON.stringify({ 
      documentId, 
      type: documentType,
      url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${documentId}`
    });
    const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    
    // Extract text content from canvas objects for search/indexing
    const textContent = [];
    if (canvasData.objects) {
      canvasData.objects.forEach(obj => {
        if (obj.type === 'i-text' || obj.type === 'text') {
          textContent.push(obj.text || '');
        }
      });
    }
    
    // Determine title from template or canvas content
    let title = templateName || 'WYSIWYG Document';
    const recipientText = textContent.find(t => t !== 'CERTIFICATE' && t.length > 3 && !t.includes('certify'));
    if (recipientText) {
      title = `${templateName || 'Document'} - ${recipientText}`;
    }
    
    // Create the document record
    const certificate = await Certificate.create({
      certificateId: documentId,
      title,
      documentHash,
      accessKey,
      qrCode,
      previewUrl,
      originalFilename: `${documentId}.canvas`,
      fileType: 'application/json',
      extractionStatus: 'completed',
      issuedBy: req.user.id,
      primaryDetails: {
        documentType: documentType || 'certificate',
        templateId: templateId || 'custom',
        fields: {
          createdWith: 'WYSIWYG Editor',
          templateName: templateName || 'Custom',
          objectCount: canvasData.objects?.length || 0,
        },
        hash: documentHash,
        extractedAt: new Date(),
        confidenceScore: 100,
      },
      fullDetails: {
        rawText: textContent.join('\n'),
        canvasData: JSON.stringify(canvasData),
        structuredData: new Map([
          ['documentType', documentType || 'certificate'],
          ['templateName', templateName || 'Custom'],
          ['editorVersion', '1.0'],
        ]),
        dates: [],
        signatures: [],
        lineCount: textContent.length,
        wordCount: textContent.join(' ').split(' ').filter(w => w).length,
        hash: documentHash,
        extractionMetadata: { 
          canvasWidth: canvasData.width,
          canvasHeight: canvasData.height,
          objectCount: canvasData.objects?.length || 0,
          createdWith: 'WYSIWYG Editor',
        },
      },
      verificationSummary: {
        documentType: documentType || 'certificate',
        holderName: recipientText || 'Not specified',
        documentNumber: documentId,
        issueDate: new Date().toISOString().split('T')[0],
        issuingAuthority: req.user.email,
        confidenceScore: 100,
        integrityHash: documentHash,
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Document saved successfully',
      data: {
        documentId: certificate.certificateId,
        accessKey: certificate.accessKey,
        documentHash: certificate.documentHash,
        qrCode: certificate.qrCode,
        previewUrl,
        title: certificate.title,
        verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${documentId}`,
        createdAt: certificate.createdAt,
      }
    });
  } catch (error) {
    console.error('WYSIWYG save error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/documents/issued - Get documents issued by current user
app.get('/api/documents/issued', authenticateToken, async (req, res) => {
  try {
    const certificates = await Certificate.find({ issuedBy: req.user.id })
      .select('-qrCode -filePath -fullDetails')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ADMIN USER MANAGEMENT ROUTES ====================

// GET /api/admin/users - Get all users (admin only)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:id/role - Update user role
app.put('/api/admin/users/:id/role', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const { role } = req.body;
    if (!['user', 'verifier', 'admin', 'institution'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:id/status - Update user status
app.put('/api/admin/users/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete user
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== PROFILE ROUTES ====================

// PUT /api/auth/profile - Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, organization, avatar } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (organization) updateData.organization = organization;
    if (avatar) updateData.avatar = avatar;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/change-password - Change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if user has a password (OAuth users might not)
    if (user.password) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/disconnect/:provider - Disconnect OAuth provider
app.post('/api/auth/disconnect/:provider', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Ensure user has a password or another auth method before disconnecting
    if (!user.password && !user.googleId && !user.githubId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot disconnect the only authentication method. Set a password first.' 
      });
    }
    
    if (provider === 'google') {
      user.googleId = undefined;
      if (user.authProvider === 'google') user.authProvider = 'local';
    } else if (provider === 'github') {
      user.githubId = undefined;
      if (user.authProvider === 'github') user.authProvider = 'local';
    }
    
    await user.save();
    res.json({ success: true, message: `${provider} disconnected` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DocVerify API - Document Verification with AI Extraction & Blockchain',
    version: '3.0.0',
    endpoints: {
      upload: 'POST /api/upload - Upload & extract document data',
      certificates: 'GET /api/certificates - List all certificates',
      certificate: 'GET /api/certificates/:id - Get single certificate',
      verify: 'POST /api/verify - Verify with tiered access (partial/full)',
      quickVerify: 'GET /api/verify/quick/:id - Quick verification (primary details)',
      download: 'GET /api/download/:id?accessKey=KEY - Download document (full access)',
      wysiwyg: 'POST /api/documents/wysiwyg - Create document from WYSIWYG editor',
      blockchain: 'GET /api/blockchain/status - Blockchain service status',
      health: 'GET /api/health',
    },
    accessLevels: {
      quick: 'Primary details only - fast verification',
      partial: 'Verification summary without access key',
      full: 'Complete details + download with access key',
    },
    blockchain: {
      enabled: blockchainService.isAvailable(),
      network: 'Hardhat Local / Polygon Amoy',
    },
  });
});

// ==================== WYSIWYG DOCUMENT ROUTES ====================

// POST /api/documents/wysiwyg - Create document from WYSIWYG editor
app.post('/api/documents/wysiwyg', authenticateToken, async (req, res) => {
  try {
    const { documentId, documentType, canvasData, fields, accessKey } = req.body;
    
    if (!documentId || !canvasData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Document ID and canvas data are required' 
      });
    }
    
    // Generate document hash from canvas data
    const documentHash = crypto.createHash('sha256')
      .update(JSON.stringify(canvasData))
      .digest('hex');
    
    // Generate QR code
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${documentId}`;
    const qrData = JSON.stringify({ 
      documentId, 
      type: documentType,
      url: verifyUrl
    });
    const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    
    // Determine title from fields
    let title = 'Untitled Document';
    if (fields?.recipientName?.value) {
      title = `Certificate - ${fields.recipientName.value}`;
    } else if (fields?.courseName?.value) {
      title = fields.courseName.value;
    }
    
    // Create certificate record
    const certificate = await Certificate.create({
      certificateId: documentId,
      title,
      documentHash,
      accessKey: accessKey || crypto.randomBytes(6).toString('hex').toUpperCase(),
      qrCode,
      originalFilename: `${documentId}.json`,
      fileType: 'application/json',
      extractionStatus: 'completed',
      issuedBy: req.user.id,
      primaryDetails: {
        documentType: documentType || 'certificate',
        fields: Object.fromEntries(
          Object.entries(fields || {}).map(([k, v]) => [k, v.value || ''])
        ),
        hash: documentHash,
        extractedAt: new Date(),
        confidenceScore: 100,
      },
      fullDetails: {
        rawText: JSON.stringify(fields),
        structuredData: new Map(
          Object.entries(fields || {}).map(([k, v]) => [k, v.value || ''])
        ),
        canvasData: canvasData,
        dates: [],
        signatures: [],
        hash: documentHash,
        extractionMetadata: { 
          source: 'wysiwyg',
          editor: 'fabric.js',
        },
      },
      verificationSummary: {
        documentType: documentType || 'certificate',
        holderName: fields?.recipientName?.value || 'Not specified',
        documentNumber: documentId,
        issueDate: fields?.issueDate?.value || new Date().toISOString().split('T')[0],
        issuingAuthority: req.user.email,
        confidenceScore: 100,
        integrityHash: documentHash,
      },
    });
    
    // Register on blockchain if available
    let blockchainResult = null;
    if (blockchainService.isAvailable()) {
      try {
        blockchainResult = await blockchainService.registerDocument(
          '0x' + documentHash,
          documentId
        );
        console.log('Document registered on blockchain:', blockchainResult);
      } catch (blockchainError) {
        console.error('Blockchain registration failed:', blockchainError.message);
        // Don't fail the request, just log the error
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      data: {
        documentId: certificate.certificateId,
        accessKey: certificate.accessKey,
        documentHash: certificate.documentHash,
        qrCode: certificate.qrCode,
        title: certificate.title,
        verifyUrl,
        createdAt: certificate.createdAt,
        blockchain: blockchainResult,
      }
    });
  } catch (error) {
    console.error('Create WYSIWYG document error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/documents/wysiwyg/:id - Get WYSIWYG document for editing
app.get('/api/documents/wysiwyg/:id', authenticateToken, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ 
      certificateId: req.params.id,
      issuedBy: req.user.id 
    });
    
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    res.json({
      success: true,
      data: {
        documentId: certificate.certificateId,
        documentType: certificate.primaryDetails?.documentType,
        canvasData: certificate.fullDetails?.canvasData,
        fields: certificate.primaryDetails?.fields,
        title: certificate.title,
        createdAt: certificate.createdAt,
        updatedAt: certificate.updatedAt,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/documents/wysiwyg/:id - Update WYSIWYG document
app.put('/api/documents/wysiwyg/:id', authenticateToken, async (req, res) => {
  try {
    const { canvasData, fields } = req.body;
    
    const certificate = await Certificate.findOne({ 
      certificateId: req.params.id,
      issuedBy: req.user.id 
    });
    
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    // Update document hash
    const newDocumentHash = crypto.createHash('sha256')
      .update(JSON.stringify(canvasData))
      .digest('hex');
    
    // Update certificate
    certificate.documentHash = newDocumentHash;
    certificate.fullDetails.canvasData = canvasData;
    certificate.primaryDetails.fields = Object.fromEntries(
      Object.entries(fields || {}).map(([k, v]) => [k, v.value || ''])
    );
    certificate.primaryDetails.hash = newDocumentHash;
    certificate.fullDetails.hash = newDocumentHash;
    certificate.verificationSummary.integrityHash = newDocumentHash;
    certificate.updatedAt = new Date();
    
    await certificate.save();
    
    res.json({
      success: true,
      message: 'Document updated successfully',
      data: {
        documentId: certificate.certificateId,
        documentHash: certificate.documentHash,
        updatedAt: certificate.updatedAt,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== BLOCKCHAIN ROUTES ====================

// GET /api/blockchain/status - Get blockchain service status
app.get('/api/blockchain/status', async (req, res) => {
  try {
    const stats = await blockchainService.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/blockchain/verify/:id - Verify document on blockchain
app.get('/api/blockchain/verify/:id', async (req, res) => {
  try {
    const result = await blockchainService.verifyByDocumentId(req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/blockchain/transaction/:id - Get blockchain transaction for document
app.get('/api/blockchain/transaction/:id', async (req, res) => {
  try {
    // Get certificate to find document hash
    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    const result = await blockchainService.verifyDocument('0x' + certificate.documentHash);
    res.json({
      success: true,
      data: {
        documentId: certificate.certificateId,
        documentHash: certificate.documentHash,
        blockchain: result,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Keep the server alive and handle errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
