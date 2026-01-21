/**
 * AI Service - LLM/NLP Integration for DocVerify
 * Provides intelligent field extraction, auto-suggestions, and smart data entry
 * Uses Groq (free) - OpenAI compatible API
 */

const crypto = require('crypto');
const cacheService = require('./cacheService');

// Groq configuration (OpenAI-compatible)
let groq = null;
try {
  const Groq = require('groq-sdk');
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    console.log('✅ AI Service: Groq configured (Free tier)');
  }
} catch (error) {
  console.log('⚠️  AI Service: Groq not available, using fallback extraction');
}

// Document type definitions for smart field detection
const DOCUMENT_SCHEMAS = {
  certificate: {
    name: 'Certificate',
    requiredFields: ['recipientName', 'certificateTitle', 'issuingOrganization', 'issueDate'],
    optionalFields: ['description', 'grade', 'courseHours', 'expiryDate', 'signatoryName', 'signatoryTitle'],
    promptContext: 'This is a certificate or credential document.',
  },
  student_id: {
    name: 'Student ID Card',
    requiredFields: ['studentName', 'studentId', 'institution', 'course', 'validFrom', 'validUntil'],
    optionalFields: ['department', 'dateOfBirth', 'bloodGroup', 'address', 'phone', 'email'],
    promptContext: 'This is a student identification card.',
  },
  bill: {
    name: 'Bill/Invoice',
    requiredFields: ['billNumber', 'billDate', 'companyName', 'customerName', 'totalAmount'],
    optionalFields: ['dueDate', 'companyAddress', 'customerAddress', 'items', 'taxRate', 'discount'],
    promptContext: 'This is a bill or invoice document.',
  },
  degree: {
    name: 'Academic Degree',
    requiredFields: ['holderName', 'degreeName', 'institution', 'graduationDate'],
    optionalFields: ['major', 'minor', 'gpa', 'honors', 'registrationNumber'],
    promptContext: 'This is an academic degree or diploma.',
  },
  license: {
    name: 'License/Permit',
    requiredFields: ['holderName', 'licenseNumber', 'issuingAuthority', 'issueDate', 'expiryDate'],
    optionalFields: ['licenseType', 'category', 'restrictions', 'address'],
    promptContext: 'This is a license or permit document.',
  },
  general: {
    name: 'General Document',
    requiredFields: ['documentTitle', 'primaryName'],
    optionalFields: ['documentNumber', 'issueDate', 'issuingAuthority', 'description'],
    promptContext: 'This is a general document.',
  },
};

// Field label mappings for user-friendly display
const FIELD_LABELS = {
  recipientName: 'Recipient Name',
  certificateTitle: 'Certificate Title',
  issuingOrganization: 'Issuing Organization',
  issueDate: 'Issue Date',
  expiryDate: 'Expiry Date',
  description: 'Description',
  grade: 'Grade/Score',
  courseHours: 'Course Hours',
  signatoryName: 'Signatory Name',
  signatoryTitle: 'Signatory Title',
  studentName: 'Student Name',
  studentId: 'Student ID',
  institution: 'Institution',
  course: 'Course/Program',
  department: 'Department',
  validFrom: 'Valid From',
  validUntil: 'Valid Until',
  dateOfBirth: 'Date of Birth',
  bloodGroup: 'Blood Group',
  address: 'Address',
  phone: 'Phone',
  email: 'Email',
  billNumber: 'Bill/Invoice Number',
  billDate: 'Bill Date',
  dueDate: 'Due Date',
  companyName: 'Company Name',
  companyAddress: 'Company Address',
  customerName: 'Customer Name',
  customerAddress: 'Customer Address',
  totalAmount: 'Total Amount',
  items: 'Line Items',
  taxRate: 'Tax Rate',
  discount: 'Discount',
  holderName: 'Holder Name',
  degreeName: 'Degree Name',
  graduationDate: 'Graduation Date',
  major: 'Major',
  minor: 'Minor',
  gpa: 'GPA',
  honors: 'Honors',
  registrationNumber: 'Registration Number',
  licenseNumber: 'License Number',
  licenseType: 'License Type',
  issuingAuthority: 'Issuing Authority',
  category: 'Category',
  restrictions: 'Restrictions',
  documentTitle: 'Document Title',
  primaryName: 'Primary Name',
  documentNumber: 'Document Number',
};

class AIService {
  constructor() {
    this.isAvailable = !!groq;
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.maxTokens = parseInt(process.env.GROQ_MAX_TOKENS) || 1500;
  }

  /**
   * Check if AI service is available
   */
  checkAvailability() {
    return this.isAvailable;
  }

  /**
   * Generate content hash for caching
   */
  _generateContentHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Detect document type using AI
   */
  async detectDocumentType(text) {
    // Check cache first
    const contentHash = this._generateContentHash(`type:${text.substring(0, 500)}`);
    const cached = await cacheService.getCachedAIExtraction(contentHash);
    if (cached) return cached;

    if (!this.isAvailable) {
      return this._fallbackDetectType(text);
    }

    try {
      const response = await groq.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a document classification expert. Classify the document into one of these types: certificate, student_id, bill, degree, license, general. Respond with just the type name, nothing else.`,
          },
          {
            role: 'user',
            content: `Classify this document:\n\n${text.substring(0, 2000)}`,
          },
        ],
        max_tokens: 20,
        temperature: 0.1,
      });

      const detectedType = response.choices[0].message.content.trim().toLowerCase();
      const validType = DOCUMENT_SCHEMAS[detectedType] ? detectedType : 'general';
      
      // Cache result
      await cacheService.cacheAIExtraction(contentHash, validType, 3600);
      
      return validType;
    } catch (error) {
      console.error('AI document type detection error:', error.message);
      return this._fallbackDetectType(text);
    }
  }

  /**
   * Fallback document type detection (regex-based)
   */
  _fallbackDetectType(text) {
    const lowerText = text.toLowerCase();
    
    if (/student\s*(id|identification|card)/i.test(lowerText)) return 'student_id';
    if (/invoice|bill\s*(no|number)|payment\s*due/i.test(lowerText)) return 'bill';
    if (/bachelor|master|doctor|phd|degree|diploma|graduated/i.test(lowerText)) return 'degree';
    if (/license|permit|authorized\s*to|valid\s*(until|through)/i.test(lowerText)) return 'license';
    if (/certificate|certify|certification|awarded|completed/i.test(lowerText)) return 'certificate';
    
    return 'general';
  }

  /**
   * Extract fields from document using AI
   */
  async extractFields(text, documentType = null) {
    // Detect type if not provided
    if (!documentType) {
      documentType = await this.detectDocumentType(text);
    }

    // Check cache
    const contentHash = this._generateContentHash(`extract:${documentType}:${text}`);
    const cached = await cacheService.getCachedAIExtraction(contentHash);
    if (cached) return cached;

    const schema = DOCUMENT_SCHEMAS[documentType] || DOCUMENT_SCHEMAS.general;
    const allFields = [...schema.requiredFields, ...schema.optionalFields];

    if (!this.isAvailable) {
      return this._fallbackExtractFields(text, documentType, allFields);
    }

    try {
      const fieldDescriptions = allFields.map(f => `${f}: ${FIELD_LABELS[f] || f}`).join('\n');
      
      const response = await groq.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a document data extraction expert. ${schema.promptContext}
Extract the following fields from the document. Return a valid JSON object with field names as keys and extracted values.
If a field is not found, use null. Be precise and extract exact values as they appear.

Fields to extract:
${fieldDescriptions}

Important:
- For dates, use the format found in the document
- For names, extract the full name as written
- For amounts, include currency symbols if present
- For IDs/numbers, extract the complete identifier`,
          },
          {
            role: 'user',
            content: `Extract data from this document:\n\n${text.substring(0, 3000)}`,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const extractedData = JSON.parse(response.choices[0].message.content);
      
      const result = {
        documentType,
        schema: schema.name,
        fields: this._normalizeExtractedFields(extractedData, allFields),
        confidence: this._calculateConfidence(extractedData, schema.requiredFields),
        suggestions: this._generateSuggestions(extractedData, schema),
        aiProcessed: true,
      };

      // Cache result
      await cacheService.cacheAIExtraction(contentHash, result, 3600);
      
      return result;
    } catch (error) {
      console.error('AI field extraction error:', error.message);
      return this._fallbackExtractFields(text, documentType, allFields);
    }
  }

  /**
   * Normalize extracted fields
   */
  _normalizeExtractedFields(data, expectedFields) {
    const normalized = {};
    
    for (const field of expectedFields) {
      const value = data[field];
      normalized[field] = {
        value: value || null,
        label: FIELD_LABELS[field] || field,
        extracted: value !== null && value !== undefined && value !== '',
      };
    }
    
    return normalized;
  }

  /**
   * Calculate extraction confidence
   */
  _calculateConfidence(data, requiredFields) {
    const extracted = requiredFields.filter(f => data[f] && data[f] !== '').length;
    return Math.round((extracted / requiredFields.length) * 100);
  }

  /**
   * Generate suggestions for missing fields
   */
  _generateSuggestions(data, schema) {
    const suggestions = [];
    
    for (const field of schema.requiredFields) {
      if (!data[field] || data[field] === '') {
        suggestions.push({
          field,
          label: FIELD_LABELS[field] || field,
          message: `${FIELD_LABELS[field] || field} could not be detected. Please enter manually.`,
          priority: 'high',
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Fallback field extraction (regex-based)
   */
  _fallbackExtractFields(text, documentType, fields) {
    const patterns = {
      recipientName: /(?:name|recipient|awarded\s*to|certify\s*that)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
      studentName: /(?:name|student)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
      holderName: /(?:name|holder)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
      customerName: /(?:customer|client|bill\s*to)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
      certificateTitle: /(?:certificate\s*(?:of|in|for)?|title)[:\s]*([A-Za-z\s]+)/i,
      institution: /(?:university|college|institute|school|institution)[:\s]*([A-Za-z\s]+)/i,
      issuingOrganization: /(?:issued\s*by|organization|authority)[:\s]*([A-Za-z\s]+)/i,
      issueDate: /(?:date|issued|dated)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2}\s+\w+\s+\d{4})/i,
      expiryDate: /(?:expiry|expires?|valid\s*(?:until|through))[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      studentId: /(?:student\s*id|roll\s*(?:no|number)|reg(?:istration)?)[:\s#]*([A-Z0-9\-]+)/i,
      billNumber: /(?:invoice|bill)\s*(?:no|number|#)[:\s]*([A-Z0-9\-]+)/i,
      licenseNumber: /(?:license|permit)\s*(?:no|number|#)[:\s]*([A-Z0-9\-]+)/i,
      totalAmount: /(?:total|amount|due)[:\s]*[$₹€£]?\s*([\d,]+\.?\d*)/i,
      grade: /(?:grade|score|result)[:\s]*([A-F][+-]?|\d+(?:\.\d+)?%?)/i,
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      phone: /(?:phone|tel|mobile)[:\s]*([+\d\s\-()]{10,})/i,
    };

    const extractedData = {};
    
    for (const field of fields) {
      if (patterns[field]) {
        const match = text.match(patterns[field]);
        extractedData[field] = match ? match[1].trim() : null;
      } else {
        extractedData[field] = null;
      }
    }

    const schema = DOCUMENT_SCHEMAS[documentType] || DOCUMENT_SCHEMAS.general;
    
    return {
      documentType,
      schema: schema.name,
      fields: this._normalizeExtractedFields(extractedData, fields),
      confidence: this._calculateConfidence(extractedData, schema.requiredFields),
      suggestions: this._generateSuggestions(extractedData, schema),
      aiProcessed: false,
    };
  }

  /**
   * Get smart field suggestions based on partial input
   */
  async getFieldSuggestions(fieldName, partialValue, context = {}) {
    if (!this.isAvailable || !partialValue || partialValue.length < 2) {
      return [];
    }

    try {
      const response = await groq.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an auto-complete assistant. Provide 3-5 relevant suggestions for the field "${FIELD_LABELS[fieldName] || fieldName}" based on the partial input. Return a JSON array of strings.`,
          },
          {
            role: 'user',
            content: `Field: ${FIELD_LABELS[fieldName] || fieldName}\nPartial input: "${partialValue}"\nContext: ${JSON.stringify(context)}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.5,
      });

      const suggestions = JSON.parse(response.choices[0].message.content);
      return Array.isArray(suggestions) ? suggestions.slice(0, 5) : [];
    } catch (error) {
      console.error('AI suggestion error:', error.message);
      return [];
    }
  }

  /**
   * Validate and enhance extracted data
   */
  async validateAndEnhance(extractedFields, documentType) {
    if (!this.isAvailable) {
      return { valid: true, enhanced: extractedFields, issues: [] };
    }

    try {
      const response = await groq.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a document validation expert. Check the extracted data for:
1. Completeness - are all required fields present?
2. Format correctness - are dates, numbers, emails properly formatted?
3. Consistency - do the values make sense together?

Return a JSON object with:
- valid: boolean
- issues: array of {field, issue, suggestion}
- enhanced: object with corrected/formatted values`,
          },
          {
            role: 'user',
            content: `Document type: ${documentType}\nExtracted data: ${JSON.stringify(extractedFields)}`,
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('AI validation error:', error.message);
      return { valid: true, enhanced: extractedFields, issues: [] };
    }
  }

  /**
   * Get recommended fields for a document type
   */
  getRecommendedFields(documentType) {
    const schema = DOCUMENT_SCHEMAS[documentType] || DOCUMENT_SCHEMAS.general;
    
    return {
      documentType,
      schemaName: schema.name,
      required: schema.requiredFields.map(f => ({
        name: f,
        label: FIELD_LABELS[f] || f,
        required: true,
      })),
      optional: schema.optionalFields.map(f => ({
        name: f,
        label: FIELD_LABELS[f] || f,
        required: false,
      })),
    };
  }

  /**
   * Get all supported document types
   */
  getSupportedDocumentTypes() {
    return Object.entries(DOCUMENT_SCHEMAS).map(([type, schema]) => ({
      type,
      name: schema.name,
      requiredFieldCount: schema.requiredFields.length,
      totalFieldCount: schema.requiredFields.length + schema.optionalFields.length,
    }));
  }

  /**
   * Generate document summary
   */
  async generateSummary(text, documentType) {
    if (!this.isAvailable) {
      return this._fallbackSummary(text, documentType);
    }

    try {
      const response = await groq.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Generate a brief 2-3 sentence summary of this document highlighting key information.',
          },
          {
            role: 'user',
            content: text.substring(0, 2000),
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI summary error:', error.message);
      return this._fallbackSummary(text, documentType);
    }
  }

  /**
   * Fallback summary generation
   */
  _fallbackSummary(text, documentType) {
    const schema = DOCUMENT_SCHEMAS[documentType] || DOCUMENT_SCHEMAS.general;
    const wordCount = text.split(/\s+/).length;
    return `This ${schema.name.toLowerCase()} contains approximately ${wordCount} words. Manual review is recommended for detailed information.`;
  }
}

// Export singleton instance
const aiService = new AIService();
module.exports = aiService;
