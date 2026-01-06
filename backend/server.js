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

const app = express();

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'docverify-secret-key-change-in-production';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));


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

// POST /api/verify - Verify certificate with tiered access
app.post('/api/verify', async (req, res) => {
  try {
    const { certificateId, accessKey } = req.body;

    if (!certificateId) {
      return res.status(400).json({ success: false, message: 'Certificate ID required' });
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
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DocVerify API running' });
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

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DocVerify API - Document Verification with AI Extraction',
    version: '2.0.0',
    endpoints: {
      upload: 'POST /api/upload - Upload & extract document data',
      certificates: 'GET /api/certificates - List all certificates',
      certificate: 'GET /api/certificates/:id - Get single certificate',
      verify: 'POST /api/verify - Verify with tiered access (partial/full)',
      quickVerify: 'GET /api/verify/quick/:id - Quick verification (primary details)',
      download: 'GET /api/download/:id?accessKey=KEY - Download document (full access)',
      health: 'GET /api/health',
    },
    accessLevels: {
      quick: 'Primary details only - fast verification',
      partial: 'Verification summary without access key',
      full: 'Complete details + download with access key',
    },
  });
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
