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
const Certificate = require('./models/Certificate');

const app = express();

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
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Helper: Generate certificate ID
const generateCertificateId = () => `DOC-${uuidv4().split('-')[0].toUpperCase()}`;

// Helper: Generate access key
const generateAccessKey = () => crypto.randomBytes(8).toString('hex').toUpperCase();

// Helper: Generate document hash
const generateHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

// POST /api/upload - Upload document and generate certificate
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

    // Save to database
    const certificate = await Certificate.create({
      certificateId,
      title: title || 'Untitled Certificate',
      documentHash,
      accessKey,
      qrCode,
      originalFilename: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.filename,
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

// POST /api/verify - Verify certificate with access key
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

    // Basic info always returned
    const response = {
      success: true,
      status: 'valid',
      data: {
        certificateId: certificate.certificateId,
        title: certificate.title,
        documentHash: certificate.documentHash,
        createdAt: certificate.createdAt,
      },
    };

    // Full access with correct access key
    if (accessKey && accessKey === certificate.accessKey) {
      response.data.qrCode = certificate.qrCode;
      response.data.fullAccess = true;
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DocVerify API running' });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DocVerify API',
    endpoints: {
      upload: 'POST /api/upload',
      certificates: 'GET /api/certificates',
      certificate: 'GET /api/certificates/:id',
      verify: 'POST /api/verify',
      health: 'GET /api/health',
    },
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
