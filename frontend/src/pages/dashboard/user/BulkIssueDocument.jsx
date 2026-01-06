import { useState, useRef } from 'react';
import { 
  HiDocumentText, 
  HiIdentification, 
  HiCurrencyDollar, 
  HiAcademicCap,
  HiArrowRight,
  HiArrowLeft,
  HiCheck,
  HiTemplate,
  HiDownload,
  HiUpload,
  HiTable,
  HiEye,
  HiTrash,
  HiDocumentDownload,
  HiExclamation
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  getTemplatesByType,
  CSV_HEADERS,
} from '../../../data/documentTemplates';

const BulkIssueDocument = () => {
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [codeType, setCodeType] = useState('qr');
  const [codePermission, setCodePermission] = useState(true);
  
  const fileInputRef = useRef(null);

  const documentTypeOptions = [
    { type: DOCUMENT_TYPES.STUDENT_ID, icon: HiIdentification, label: 'Student ID Cards', description: 'Bulk create student identification cards' },
    { type: DOCUMENT_TYPES.BILL, icon: HiCurrencyDollar, label: 'Bills / Invoices', description: 'Generate multiple bills and invoices' },
    { type: DOCUMENT_TYPES.CERTIFICATE, icon: HiAcademicCap, label: 'Certificates', description: 'Issue certificates in bulk' },
  ];

  const templates = documentType ? getTemplatesByType(documentType) : [];
  const csvHeaders = documentType ? CSV_HEADERS[documentType] : [];

  const handleTypeSelect = (type) => {
    setDocumentType(type);
    setSelectedTemplate(null);
    setCsvData([]);
    setCsvErrors([]);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const downloadCSVTemplate = () => {
    if (!documentType) {
      toast.error('Please select a document type first');
      return;
    }

    const headers = csvHeaders.join(',');
    const sampleRow = csvHeaders.map(h => `Sample ${h}`).join(',');
    const csvContent = `${headers}\n${sampleRow}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('CSV template downloaded!');
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      return { data: [], errors: ['CSV file must have at least a header row and one data row'] };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    const errors = [];

    // Validate headers
    const missingHeaders = csvHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Basic validation
      const rowErrors = [];
      if (documentType === DOCUMENT_TYPES.STUDENT_ID) {
        if (!row.studentName) rowErrors.push('studentName is required');
        if (!row.studentId) rowErrors.push('studentId is required');
      } else if (documentType === DOCUMENT_TYPES.CERTIFICATE) {
        if (!row.recipientName) rowErrors.push('recipientName is required');
        if (!row.certificateTitle) rowErrors.push('certificateTitle is required');
      } else if (documentType === DOCUMENT_TYPES.BILL) {
        if (!row.billNumber) rowErrors.push('billNumber is required');
        if (!row.customerName) rowErrors.push('customerName is required');
      }

      if (rowErrors.length > 0) {
        errors.push(`Row ${i}: ${rowErrors.join(', ')}`);
      }

      row._rowNumber = i;
      row._hasErrors = rowErrors.length > 0;
      data.push(row);
    }

    return { data, errors };
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { data, errors } = parseCSV(text);
      
      setCsvData(data);
      setCsvErrors(errors);
      
      if (errors.length === 0) {
        toast.success(`Loaded ${data.length} records successfully`);
      } else {
        toast.error(`Found ${errors.length} errors in CSV`);
      }
    };
    reader.readAsText(file);
  };

  const removeRow = (index) => {
    const newData = csvData.filter((_, i) => i !== index);
    setCsvData(newData);
    toast.success('Row removed');
  };

  const generateDocumentId = () => {
    const prefix = documentType === DOCUMENT_TYPES.STUDENT_ID ? 'SID' : 
                   documentType === DOCUMENT_TYPES.BILL ? 'INV' : 'CRT';
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const generateAccessKey = () => {
    return Math.random().toString(36).substr(2, 12).toUpperCase();
  };

  const generatePreview = () => {
    const preview = csvData.slice(0, 5).map(row => ({
      ...row,
      _documentId: generateDocumentId(),
      _accessKey: generateAccessKey(),
      _verifyUrl: `${window.location.origin}/verify/${generateDocumentId()}`,
    }));
    setPreviewData(preview);
    setStep(4);
  };

  const processBulkIssuance = async () => {
    setIsProcessing(true);
    setProcessedCount(0);

    try {
      const documents = csvData.map(row => ({
        documentId: generateDocumentId(),
        accessKey: generateAccessKey(),
        documentType,
        templateId: selectedTemplate.id,
        formData: row,
        codeType,
        includeCode: codePermission,
      }));

      // Process in batches
      const batchSize = 10;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        // Simulate API call (replace with actual API)
        await api.bulkIssueDocuments?.(batch) || new Promise(r => setTimeout(r, 500));
        
        setProcessedCount(Math.min(i + batchSize, documents.length));
      }

      toast.success(`Successfully issued ${documents.length} documents!`);
      
      // Generate summary report
      const summaryCSV = documents.map(d => 
        `${d.formData[csvHeaders[0]]},${d.documentId},${d.accessKey}`
      ).join('\n');
      
      const blob = new Blob([`Name,Document ID,Access Key\n${summaryCSV}`], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_issuance_report_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      // Reset
      setStep(1);
      setDocumentType('');
      setSelectedTemplate(null);
      setCsvData([]);
      setPreviewData([]);

    } catch (error) {
      toast.error('Failed to process bulk issuance');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !documentType) {
      toast.error('Please select a document type');
      return;
    }
    if (step === 2 && !selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    if (step === 3 && csvData.length === 0) {
      toast.error('Please upload a CSV file with data');
      return;
    }
    if (step === 3 && csvErrors.length > 0) {
      toast.error('Please fix CSV errors before continuing');
      return;
    }
    if (step === 3) {
      generatePreview();
      return;
    }
    if (step === 4) {
      processBulkIssuance();
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Render functions
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[
        { num: 1, label: 'Type' },
        { num: 2, label: 'Template' },
        { num: 3, label: 'Upload' },
        { num: 4, label: 'Preview' },
      ].map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
            ${step >= s.num ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-600 text-gray-400'}`}>
            {step > s.num ? <HiCheck className="w-5 h-5" /> : s.num}
          </div>
          <span className={`ml-2 text-sm ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>{s.label}</span>
          {i < 3 && <div className={`w-12 h-0.5 mx-2 ${step > s.num ? 'bg-primary-500' : 'bg-gray-600'}`} />}
        </div>
      ))}
    </div>
  );

  const renderDocumentTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Select Document Type</h2>
        <p className="text-gray-400">Choose the type of documents you want to issue in bulk</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {documentTypeOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => handleTypeSelect(option.type)}
            className={`p-6 rounded-2xl border-2 transition-all text-left
              ${documentType === option.type 
                ? 'border-primary-500 bg-primary-500/10' 
                : 'border-white/10 bg-dark-200 hover:border-white/30'}`}
          >
            <option.icon className={`w-12 h-12 mb-4 ${documentType === option.type ? 'text-primary-400' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-white mb-2">{option.label}</h3>
            <p className="text-sm text-gray-400">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderTemplateSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Choose a Template</h2>
        <p className="text-gray-400">Select a design template for all documents</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[50vh] overflow-y-auto p-2">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className={`relative p-3 rounded-xl border-2 transition-all
              ${selectedTemplate?.id === template.id 
                ? 'border-primary-500 bg-primary-500/10' 
                : 'border-white/10 bg-dark-200 hover:border-white/30'}`}
          >
            <div 
              className="aspect-[3/4] rounded-lg mb-2 flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary})` 
              }}
            >
              <HiTemplate className="w-8 h-8" style={{ color: template.colors.accent }} />
            </div>
            <p className="text-sm text-white font-medium truncate">{template.name}</p>
            <p className="text-xs text-gray-500 capitalize">{template.style}</p>
            
            {selectedTemplate?.id === template.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                <HiCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Code Settings */}
      <div className="bg-dark-300 rounded-xl p-4 border border-white/10 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium text-white">Include QR/Barcode</h4>
            <p className="text-xs text-gray-400">Embed verification code on all documents</p>
          </div>
          <button
            onClick={() => setCodePermission(!codePermission)}
            className={`relative w-12 h-6 rounded-full transition-all
              ${codePermission ? 'bg-primary-500' : 'bg-gray-600'}`}
          >
            <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all
              ${codePermission ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
        
        {codePermission && (
          <div className="flex gap-4">
            <button
              onClick={() => setCodeType('qr')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-all text-sm
                ${codeType === 'qr' ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-white/10 text-gray-400'}`}
            >
              QR Code
            </button>
            <button
              onClick={() => setCodeType('barcode')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-all text-sm
                ${codeType === 'barcode' ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-white/10 text-gray-400'}`}
            >
              Barcode
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCSVUpload = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Upload Data</h2>
        <p className="text-gray-400">Upload a CSV file with document data</p>
      </div>
      
      {/* Download Template Button */}
      <div className="bg-dark-300 rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">CSV Template</h3>
            <p className="text-sm text-gray-400 mt-1">
              Download the template to see required fields for {DOCUMENT_TYPE_LABELS[documentType]}
            </p>
          </div>
          <button
            onClick={downloadCSVTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-xl 
              hover:bg-primary-500/30 transition-all"
          >
            <HiDocumentDownload className="w-5 h-5" />
            Download Template
          </button>
        </div>
        
        {/* Show expected headers */}
        <div className="mt-4 p-3 bg-dark-200 rounded-lg">
          <p className="text-xs text-gray-400 mb-2">Expected CSV Headers:</p>
          <p className="text-sm text-gray-300 font-mono">{csvHeaders.join(', ')}</p>
        </div>
      </div>
      
      {/* Upload Area */}
      <div 
        className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center
          hover:border-primary-500 transition-all cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <HiUpload className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <p className="text-lg text-white mb-2">Drop your CSV file here</p>
        <p className="text-sm text-gray-400">or click to browse</p>
      </div>
      
      {/* CSV Data Preview */}
      {csvData.length > 0 && (
        <div className="bg-dark-300 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Loaded Data ({csvData.length} records)
            </h3>
            {csvErrors.length > 0 && (
              <span className="flex items-center gap-1 text-red-400 text-sm">
                <HiExclamation className="w-4 h-4" />
                {csvErrors.length} errors
              </span>
            )}
          </div>
          
          {/* Errors */}
          {csvErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm font-medium text-red-400 mb-2">Errors found:</p>
              <ul className="text-sm text-red-300 space-y-1 max-h-32 overflow-y-auto">
                {csvErrors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Data Table */}
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-2 text-gray-400">#</th>
                  {csvHeaders.slice(0, 4).map(header => (
                    <th key={header} className="text-left py-2 px-2 text-gray-400">{header}</th>
                  ))}
                  <th className="text-right py-2 px-2 text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 10).map((row, index) => (
                  <tr key={index} className={`border-b border-white/5 ${row._hasErrors ? 'bg-red-500/5' : ''}`}>
                    <td className="py-2 px-2 text-gray-500">{row._rowNumber}</td>
                    {csvHeaders.slice(0, 4).map(header => (
                      <td key={header} className="py-2 px-2 text-white truncate max-w-[150px]">
                        {row[header] || '-'}
                      </td>
                    ))}
                    <td className="py-2 px-2 text-right">
                      <button
                        onClick={() => removeRow(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 10 && (
              <p className="text-center text-gray-500 text-sm py-2">
                ... and {csvData.length - 10} more records
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Preview & Confirm</h2>
        <p className="text-gray-400">Review sample documents before bulk issuance</p>
      </div>
      
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-dark-300 rounded-xl p-4 text-center border border-white/10">
          <p className="text-3xl font-bold text-primary-400">{csvData.length}</p>
          <p className="text-sm text-gray-400">Total Documents</p>
        </div>
        <div className="bg-dark-300 rounded-xl p-4 text-center border border-white/10">
          <p className="text-3xl font-bold text-green-400">{selectedTemplate?.name}</p>
          <p className="text-sm text-gray-400">Template</p>
        </div>
        <div className="bg-dark-300 rounded-xl p-4 text-center border border-white/10">
          <p className="text-3xl font-bold text-blue-400">{codePermission ? codeType.toUpperCase() : 'None'}</p>
          <p className="text-sm text-gray-400">Verification Code</p>
        </div>
      </div>
      
      {/* Sample Document Previews */}
      <div className="bg-dark-300 rounded-xl p-4 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Sample Documents (First 5)</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {previewData.map((doc, index) => (
            <div 
              key={index}
              className="rounded-xl overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${selectedTemplate.colors.primary}, ${selectedTemplate.colors.secondary})` 
              }}
            >
              <div className="p-4" style={{ color: selectedTemplate.colors.text }}>
                <div className="text-xs opacity-60 mb-1">{DOCUMENT_TYPE_LABELS[documentType]}</div>
                <div className="font-semibold truncate">
                  {doc[csvHeaders[0]] || 'No Name'}
                </div>
                <div className="text-xs mt-2 opacity-60">ID: {doc._documentId}</div>
                <div className="text-xs opacity-60">Key: {doc._accessKey}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Processing Progress */}
      {isProcessing && (
        <div className="bg-dark-300 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Processing...</h3>
            <span className="text-primary-400">{processedCount} / {csvData.length}</span>
          </div>
          <div className="w-full h-3 bg-dark-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${(processedCount / csvData.length) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Confirmation */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <HiExclamation className="w-6 h-6 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-400">Ready to issue {csvData.length} documents</p>
            <p className="text-sm text-gray-400 mt-1">
              This action will create {csvData.length} unique documents with individual IDs and access keys.
              A summary report will be downloaded automatically after completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-display">Bulk Issue Documents</h1>
        <p className="text-gray-400 mt-2">Create multiple documents at once using CSV data</p>
      </div>
      
      {/* Step Indicator */}
      {renderStepIndicator()}
      
      {/* Step Content */}
      <div className="bg-dark-200 rounded-2xl p-6 border border-white/10">
        {step === 1 && renderDocumentTypeSelection()}
        {step === 2 && renderTemplateSelection()}
        {step === 3 && renderCSVUpload()}
        {step === 4 && renderPreview()}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <button
            onClick={prevStep}
            disabled={step === 1 || isProcessing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all
              ${step === 1 || isProcessing
                ? 'opacity-50 cursor-not-allowed text-gray-500' 
                : 'bg-dark-300 text-white hover:bg-dark-100'}`}
          >
            <HiArrowLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={nextStep}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl 
              hover:bg-primary-600 transition-all font-semibold disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : step === 3 ? (
              <>
                <HiEye className="w-5 h-5" />
                Preview
              </>
            ) : step === 4 ? (
              <>
                <HiCheck className="w-5 h-5" />
                Issue {csvData.length} Documents
              </>
            ) : (
              <>
                Next
                <HiArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkIssueDocument;
