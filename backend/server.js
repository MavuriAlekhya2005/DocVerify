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
const { extractDocumentData, validateIntegrity } = require('./services/documentExtractor');

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
  destination: (req, file, cb) => cb(null, uploadsDir),
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
