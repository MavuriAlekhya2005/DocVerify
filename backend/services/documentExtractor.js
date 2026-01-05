/**
 * Document Extractor Service
 * Extracts and categorizes document data into primary (quick-read) and full details
 * Uses AI/ML for intelligent field detection and categorization
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const crypto = require('crypto');

// Primary fields - Quick access, suitable for blockchain/fast storage
const PRIMARY_FIELD_PATTERNS = {
  // Identity & Personal Info
  name: [
    /(?:name|full\s*name|holder|recipient|issued\s*to|awarded\s*to)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/gi,
    /(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi,
  ],
  dateOfBirth: [
    /(?:date\s*of\s*birth|dob|birth\s*date|born)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    /(?:date\s*of\s*birth|dob)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/gi,
  ],
  
  // Document Identifiers
  documentNumber: [
    /(?:certificate\s*(?:no|number|id)|document\s*(?:no|number|id)|reg(?:istration)?\s*(?:no|number)|serial\s*(?:no|number)|id\s*(?:no|number))[:\s#]*([A-Z0-9\-\/]+)/gi,
    /(?:no|number|#)[:\s]*([A-Z]{2,}\d+[A-Z0-9\-]*)/gi,
  ],
  
  // Dates
  issueDate: [
    /(?:issue\s*date|date\s*of\s*issue|dated|issued\s*on)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    /(?:issue\s*date|dated)[:\s]*(\d{1,2}\s+\w+\s+\d{4})/gi,
  ],
  expiryDate: [
    /(?:expiry\s*date|valid\s*(?:until|till|through)|expires?\s*on?)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    /(?:valid\s*(?:until|till))[:\s]*(\d{1,2}\s+\w+\s+\d{4})/gi,
  ],
  
  // Issuing Authority
  issuingAuthority: [
    /(?:issued\s*by|issuing\s*authority|authority|organization|institution|university|college)[:\s]*([A-Z][A-Za-z\s&,\.]+(?:University|College|Institute|Board|Council|Authority|Organization|Government|Ministry|Department))/gi,
  ],
  
  // Qualification/Purpose
  qualification: [
    /(?:degree|diploma|certificate|qualification|course|program(?:me)?)[:\s]*(?:in|of)?\s*([A-Z][A-Za-z\s\-&]+)/gi,
  ],
  
  // Grade/Result
  grade: [
    /(?:grade|result|score|percentage|cgpa|gpa|marks)[:\s]*([A-F][+-]?|\d+(?:\.\d+)?(?:\s*%)?(?:\s*\/\s*\d+)?)/gi,
    /(?:first\s*class|second\s*class|distinction|pass|merit)/gi,
  ],
};

// Document type detection patterns
const DOCUMENT_TYPE_PATTERNS = {
  degree: /(?:bachelor|master|doctor|phd|b\.?tech|m\.?tech|b\.?sc|m\.?sc|b\.?a|m\.?a|b\.?com|m\.?com|degree)/i,
  diploma: /(?:diploma|certificate\s+course|vocational)/i,
  certificate: /(?:certificate|certification|certified|completion)/i,
  license: /(?:license|licence|permit|registration)/i,
  identification: /(?:identity|identification|id\s*card|passport|driving)/i,
  academic: /(?:transcript|marksheet|grade\s*sheet|result)/i,
  professional: /(?:professional|experience|employment|work)/i,
  legal: /(?:legal|court|notary|affidavit|deed)/i,
};

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error('PDF extraction error:', error.message);
    return { text: '', pages: 0, info: {}, metadata: {} };
  }
}

/**
 * Extract text from image using OCR
 */
async function extractTextFromImage(filePath) {
  try {
    const result = await Tesseract.recognize(filePath, 'eng', {
      logger: () => {}, // Silent logger
    });
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words?.length || 0,
    };
  } catch (error) {
    console.error('OCR extraction error:', error.message);
    return { text: '', confidence: 0, words: 0 };
  }
}

/**
 * Detect document type based on content
 */
function detectDocumentType(text) {
  const lowerText = text.toLowerCase();
  
  for (const [type, pattern] of Object.entries(DOCUMENT_TYPE_PATTERNS)) {
    if (pattern.test(lowerText)) {
      return type;
    }
  }
  return 'general';
}

/**
 * Extract primary fields from text
 */
function extractPrimaryFields(text) {
  const extracted = {};
  
  for (const [field, patterns] of Object.entries(PRIMARY_FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match && match[1]) {
        extracted[field] = match[1].trim();
        break;
      } else if (match && !match[1]) {
        // For patterns without capture groups (like grade classifications)
        extracted[field] = match[0].trim();
        break;
      }
    }
  }
  
  return extracted;
}

/**
 * Extract all text-based details (full details)
 */
function extractFullDetails(text, pdfInfo = {}) {
  // Clean and structure the full text
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Extract key-value pairs
  const keyValuePairs = {};
  const keyValuePattern = /^([A-Za-z\s]+)[:\-]\s*(.+)$/;
  
  for (const line of lines) {
    const match = line.match(keyValuePattern);
    if (match) {
      const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
      keyValuePairs[key] = match[2].trim();
    }
  }
  
  // Extract dates found in document
  const datePattern = /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/gi;
  const dates = text.match(datePattern) || [];
  
  // Extract potential signatures/authorizations
  const signaturePattern = /(?:signed|authorized|approved|verified)\s*(?:by)?[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
  const signatures = [];
  let sigMatch;
  while ((sigMatch = signaturePattern.exec(text)) !== null) {
    signatures.push(sigMatch[1]);
  }
  
  return {
    rawText: text,
    structuredData: keyValuePairs,
    dates,
    signatures,
    lineCount: lines.length,
    wordCount: text.split(/\s+/).length,
    pdfMetadata: pdfInfo,
  };
}

/**
 * Generate content hash for integrity verification
 */
function generateContentHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

/**
 * Calculate confidence score for extraction
 */
function calculateConfidenceScore(primaryFields, fullDetails) {
  let score = 0;
  const weights = {
    name: 25,
    documentNumber: 20,
    issueDate: 15,
    issuingAuthority: 15,
    qualification: 10,
    expiryDate: 5,
    grade: 5,
    dateOfBirth: 5,
  };
  
  for (const [field, weight] of Object.entries(weights)) {
    if (primaryFields[field]) {
      score += weight;
    }
  }
  
  // Bonus for text quality
  if (fullDetails.wordCount > 50) score += 5;
  if (fullDetails.lineCount > 10) score += 5;
  
  return Math.min(score, 100);
}

/**
 * Main extraction function
 */
async function extractDocumentData(filePath, fileType) {
  let extractedText = { text: '' };
  
  // Extract text based on file type
  if (fileType === 'application/pdf') {
    extractedText = await extractTextFromPDF(filePath);
  } else if (fileType.startsWith('image/')) {
    extractedText = await extractTextFromImage(filePath);
  }
  
  const text = extractedText.text || '';
  
  // Detect document type
  const documentType = detectDocumentType(text);
  
  // Extract primary fields (for quick access / blockchain)
  const primaryFields = extractPrimaryFields(text);
  
  // Extract full details (for database storage)
  const fullDetails = extractFullDetails(text, extractedText.info || {});
  
  // Calculate extraction confidence
  const confidenceScore = calculateConfidenceScore(primaryFields, fullDetails);
  
  // Generate integrity hashes
  const primaryHash = generateContentHash(primaryFields);
  const fullHash = generateContentHash(fullDetails);
  
  return {
    // Primary Details - Quick Read (Blockchain-ready)
    primaryDetails: {
      documentType,
      fields: primaryFields,
      hash: primaryHash,
      extractedAt: new Date().toISOString(),
      confidenceScore,
    },
    
    // Full Details - Complete Data (Database/Cloud)
    fullDetails: {
      ...fullDetails,
      hash: fullHash,
      extractionMetadata: {
        textLength: text.length,
        pages: extractedText.pages || 1,
        ocrConfidence: extractedText.confidence || null,
      },
    },
    
    // Summary for verification display
    verificationSummary: {
      documentType,
      holderName: primaryFields.name || 'Not detected',
      documentNumber: primaryFields.documentNumber || 'Not detected',
      issueDate: primaryFields.issueDate || 'Not detected',
      issuingAuthority: primaryFields.issuingAuthority || 'Not detected',
      qualification: primaryFields.qualification || null,
      grade: primaryFields.grade || null,
      validUntil: primaryFields.expiryDate || 'Not specified',
      confidenceScore,
      integrityHash: primaryHash,
    },
  };
}

/**
 * Validate document integrity
 */
function validateIntegrity(storedHash, currentData) {
  const currentHash = generateContentHash(currentData);
  return storedHash === currentHash;
}

module.exports = {
  extractDocumentData,
  validateIntegrity,
  generateContentHash,
  extractTextFromPDF,
  extractTextFromImage,
  detectDocumentType,
};
