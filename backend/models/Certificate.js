const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Certificate', certificateSchema);
