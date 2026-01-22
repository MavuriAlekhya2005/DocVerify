const mongoose = require('mongoose');

// Primary Details Schema - Quick access data (blockchain-ready)
const primaryDetailsSchema = new mongoose.Schema({
  documentType: { type: String, default: 'general' },
  templateId: { type: String }, // Template used for issued documents
  fields: { type: mongoose.Schema.Types.Mixed, default: {} }, // Flexible fields for different document types
  hash: { type: String, required: true }, // Integrity hash
  extractedAt: { type: Date, default: Date.now },
  confidenceScore: { type: Number, default: 0 },
}, { _id: false });

// Full Details Schema - Complete extracted data (database/cloud storage)
const fullDetailsSchema = new mongoose.Schema({
  rawText: String,
  structuredData: { type: Map, of: String },
  dates: [String],
  signatures: [String],
  lineCount: Number,
  wordCount: Number,
  pdfMetadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  hash: { type: String, required: true },
  extractionMetadata: {
    textLength: Number,
    pages: Number,
    ocrConfidence: Number,
  },
}, { _id: false });

// Verification Summary Schema - Pre-computed for quick display
const verificationSummarySchema = new mongoose.Schema({
  documentType: String,
  holderName: { type: String, default: 'Not detected' },
  documentNumber: { type: String, default: 'Not detected' },
  issueDate: { type: String, default: 'Not detected' },
  issuingAuthority: { type: String, default: 'Not detected' },
  qualification: String,
  grade: String,
  validUntil: { type: String, default: 'Not specified' },
  confidenceScore: Number,
  integrityHash: String,
}, { _id: false });

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    default: 'Untitled Certificate',
  },
  documentHash: {
    type: String,
    required: true,
  },
  accessKey: {
    type: String,
    required: true,
  },
  qrCode: {
    type: String, // Base64 encoded QR code image
  },
  originalFilename: {
    type: String,
  },
  fileType: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  filePath: {
    type: String,
  },
  previewUrl: {
    type: String, // URL to preview image (for WYSIWYG documents)
  },
  
  // NEW: Extracted document data (two-tier storage)
  primaryDetails: primaryDetailsSchema,    // Quick-read data (blockchain-suitable)
  fullDetails: fullDetailsSchema,          // Complete data (database/cloud)
  verificationSummary: verificationSummarySchema, // Pre-computed verification display
  
  // NEW: Extraction status
  extractionStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  extractionError: String,
  
  // NEW: Access tracking
  verificationCount: { type: Number, default: 0 },
  fullAccessCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  lastVerifiedAt: Date,
  lastFullAccessAt: Date,
  
  // Document issuer tracking
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster lookups
certificateSchema.index({ 'primaryDetails.hash': 1 });
certificateSchema.index({ 'verificationSummary.holderName': 'text', 'verificationSummary.documentNumber': 'text' });

// Update timestamp on save
certificateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
