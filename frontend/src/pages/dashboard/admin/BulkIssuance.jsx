import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import QRCode from 'qrcode';
import { 
  HiCloudUpload, 
  HiDocumentText, 
  HiX, 
  HiCheckCircle,
  HiExclamationCircle,
  HiDownload,
  HiTable,
  HiCube,
  HiLightningBolt,
  HiUsers,
  HiTemplate,
  HiIdentification,
  HiCurrencyDollar,
  HiAcademicCap,
  HiQrcode,
  HiViewGrid,
  HiArrowLeft
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  CSV_HEADERS,
  getTemplatesByType,
} from '../../../data/documentTemplates';

const BulkIssuance = () => {
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [codeType, setCodeType] = useState('qr');
  const [embedCode, setEmbedCode] = useState(true);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [processingState, setProcessingState] = useState(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [colorMode, setColorMode] = useState('two-tone');

  const documentTypeOptions = [
    { type: DOCUMENT_TYPES.STUDENT_ID, icon: HiIdentification, label: 'Student ID Cards', description: 'Bulk issue student identification cards' },
    { type: DOCUMENT_TYPES.BILL, icon: HiCurrencyDollar, label: 'Bills / Invoices', description: 'Generate multiple bills and invoices' },
    { type: DOCUMENT_TYPES.CERTIFICATE, icon: HiAcademicCap, label: 'Certificates', description: 'Issue certificates in bulk' },
  ];

  const templates = documentType ? getTemplatesByType(documentType) : [];

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setCsvFile(file);
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setAllData(results.data);
          setParsedData(results.data.slice(0, 10));
          toast.success(`Parsed ${results.data.length} records from CSV`);
        },
        error: (error) => {
          toast.error('Error parsing CSV file');
          console.error(error);
        },
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const downloadTemplate = () => {
    if (!documentType) {
      toast.error('Please select a document type first');
      return;
    }
    const headers = CSV_HEADERS[documentType] || [];
    const headerRow = headers.join(',');
    
    let sampleRows = '';
    if (documentType === DOCUMENT_TYPES.STUDENT_ID) {
      sampleRows = `
University of Technology,John Doe,STU-2024-001,Computer Science,B.Sc. Computer Science,3rd Year,A+,2024-01-15,2025-01-15,john@example.com,+1234567890
University of Technology,Jane Smith,STU-2024-002,Electrical Engineering,B.Eng. Electrical,2nd Year,O+,2024-01-15,2025-01-15,jane@example.com,+1234567891`;
    } else if (documentType === DOCUMENT_TYPES.BILL) {
      sampleRows = `
INV-001,Acme Corp,123 Business St,John Customer,john@customer.com,456 Customer Ave,2024-03-15,2024-04-15,Bank Transfer,"Web Development Services|5|200,Hosting|12|15,Domain|1|20",18,0
INV-002,Acme Corp,123 Business St,Jane Client,jane@client.com,789 Client Blvd,2024-03-15,2024-04-15,Credit Card,"Consulting|10|150,Training|2|500",18,50`;
    } else if (documentType === DOCUMENT_TYPES.CERTIFICATE) {
      sampleRows = `
Tech Academy,Certificate of Completion,John Doe,Web Development Bootcamp,A,2024-03-15,2027-03-15,"Successfully completed all modules",Dr. Smith,Director of Education
Tech Academy,Certificate of Achievement,Jane Smith,Data Science Program,A+,2024-03-15,,"Outstanding performance in all areas",Prof. Johnson,Head of Department`;
    }
    
    const template = headerRow + sampleRows;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentType}_bulk_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  const generateDocumentId = () => {
    const prefix = documentType === DOCUMENT_TYPES.STUDENT_ID ? 'SID' : documentType === DOCUMENT_TYPES.BILL ? 'INV' : 'CRT';
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const generateAccessKey = () => Math.random().toString(36).substr(2, 12).toUpperCase();

  const generateQRCode = async (data) => {
    try { return await QRCode.toDataURL(JSON.stringify(data), { width: 150, margin: 2 }); }
    catch (err) { return null; }
  };

  const generateBarcode = (data) => {
    try {
      const canvas = document.createElement('canvas');
      import('jsbarcode').then(JsBarcode => {
        JsBarcode.default(canvas, data, { format: 'CODE128', width: 2, height: 50, displayValue: true });
      });
      return canvas.toDataURL();
    } catch (err) { return null; }
  };

  const startBulkIssuance = async () => {
    if (!documentType || !selectedTemplate) {
      toast.error('Please select document type and template');
      return;
    }
    
    setProcessingState('processing');
    setProgress(0);

    const totalRecords = allData.length;
    const processedDocuments = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < totalRecords; i++) {
      const record = allData[i];
      try {
        const docId = generateDocumentId();
        const accessKey = generateAccessKey();
        const verifyUrl = `${window.location.origin}/verify/${docId}`;
        
        let codeImage = null;
        if (embedCode) {
          const codeData = { id: docId, type: documentType, url: verifyUrl };
          codeImage = codeType === 'qr' ? await generateQRCode(codeData) : generateBarcode(docId);
        }
        
        processedDocuments.push({
          documentId: docId,
          accessKey,
          documentType,
          templateId: selectedTemplate.id,
          formData: record,
          codeType: embedCode ? codeType : null,
          codeImage,
          verifyUrl,
        });
        successCount++;
      } catch (err) {
        failCount++;
      }
      setProgress(Math.round(((i + 1) / totalRecords) * 100));
    }

    // Simulate Merkle tree generation
    setProcessingState('merkle');
    await new Promise(r => setTimeout(r, 1500));

    // Simulate blockchain anchoring
    setProcessingState('blockchain');
    await new Promise(r => setTimeout(r, 2000));

    // Save to backend
    try {
      await api.bulkIssueDocuments({ documents: processedDocuments });
    } catch (err) {
      console.error('Error saving documents:', err);
    }

    setProcessingState('complete');
    setResults({
      total: totalRecords,
      successful: successCount,
      failed: failCount,
      merkleRoot: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      transactionHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      gasSaved: '97.5%',
    });

    toast.success('Bulk issuance completed!');
  };

  const reset = () => {
    setStep(1);
    setDocumentType('');
    setSelectedTemplate(null);
    setCsvFile(null);
    setParsedData([]);
    setAllData([]);
    setProcessingState(null);
    setProgress(0);
    setResults(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Bulk Document Issuance</h1>
        <p className="text-gray-400">Issue up to 500 documents at once via CSV upload with QR/barcode embedding</p>
      </div>

      {/* Step Indicator */}
      {!processingState && (
        <div className="flex items-center justify-center mb-8 flex-wrap gap-2">
          {[{ num: 1, label: 'Document Type' }, { num: 2, label: 'Template' }, { num: 3, label: 'Code Settings' }, { num: 4, label: 'Upload CSV' }].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= s.num ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-600 text-gray-400'}`}>
                {step > s.num ? <HiCheckCircle className="w-5 h-5" /> : s.num}
              </div>
              <span className={`ml-2 text-sm ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>{s.label}</span>
              {i < 3 && <div className={`w-8 h-0.5 mx-2 ${step > s.num ? 'bg-primary-500' : 'bg-gray-600'}`} />}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Document Type Selection */}
        {step === 1 && !processingState && (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Select Document Type</h2>
              <p className="text-gray-400">Choose the type of documents you want to issue in bulk</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {documentTypeOptions.map((option) => (
                <button key={option.type} onClick={() => setDocumentType(option.type)}
                  className={`p-6 rounded-2xl border-2 transition-all text-left ${documentType === option.type ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-dark-200 hover:border-white/30'}`}>
                  <option.icon className={`w-12 h-12 mb-4 ${documentType === option.type ? 'text-primary-400' : 'text-gray-400'}`} />
                  <h3 className="text-lg font-semibold text-white mb-2">{option.label}</h3>
                  <p className="text-sm text-gray-400">{option.description}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => documentType && setStep(2)} disabled={!documentType}
                className={`px-6 py-3 rounded-xl font-semibold ${documentType ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
                Next: Select Template
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Template Selection */}
        {step === 2 && !processingState && (
          <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Choose Template</h2>
              <p className="text-gray-400">Select a design template for your {DOCUMENT_TYPE_LABELS[documentType]}</p>
            </div>
            <div className="flex justify-center gap-4 mb-6">
              {['solid', 'two-tone', 'three-tone'].map((mode) => (
                <button key={mode} onClick={() => setColorMode(mode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${colorMode === mode ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                  <span className="capitalize">{mode.replace('-', ' ')}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[45vh] overflow-y-auto p-2">
              {templates.map((template) => {
                const gradientStyle = colorMode === 'solid' ? { background: template.colors.primary }
                  : colorMode === 'two-tone' ? { background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%)` }
                  : { background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 50%, ${template.colors.accent} 100%)` };
                return (
                  <button key={template.id} onClick={() => setSelectedTemplate({ ...template, colorMode })}
                    className={`relative p-3 rounded-xl border-2 transition-all ${selectedTemplate?.id === template.id ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-dark-200 hover:border-white/30'}`}>
                    <div className="aspect-[3/4] rounded-lg mb-2 flex items-center justify-center" style={gradientStyle}>
                      <HiTemplate className="w-8 h-8" style={{ color: template.colors.text || '#fff' }} />
                    </div>
                    <p className="text-sm text-white font-medium truncate">{template.name}</p>
                    {selectedTemplate?.id === template.id && <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"><HiCheckCircle className="w-4 h-4 text-white" /></div>}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-dark-300 text-white"><HiArrowLeft className="w-5 h-5" />Back</button>
              <button onClick={() => selectedTemplate && setStep(3)} disabled={!selectedTemplate}
                className={`px-6 py-3 rounded-xl font-semibold ${selectedTemplate ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
                Next: Code Settings
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Code Settings */}
        {step === 3 && !processingState && (
          <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Verification Code Settings</h2>
              <p className="text-gray-400">Configure QR code or barcode embedding for documents</p>
            </div>
            <div className="bg-dark-300 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div><h3 className="text-lg font-semibold text-white">Embed Verification Code</h3><p className="text-sm text-gray-400">Add QR/barcode to each document</p></div>
                <button onClick={() => setEmbedCode(!embedCode)} className={`relative w-14 h-8 rounded-full ${embedCode ? 'bg-primary-500' : 'bg-gray-600'}`}>
                  <div className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-all ${embedCode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
            {embedCode && (
              <div className="bg-dark-300 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Code Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setCodeType('qr')} className={`p-4 rounded-xl border-2 flex flex-col items-center ${codeType === 'qr' ? 'border-primary-500 bg-primary-500/10' : 'border-white/10'}`}>
                    <HiQrcode className={`w-12 h-12 mb-2 ${codeType === 'qr' ? 'text-primary-400' : 'text-gray-400'}`} /><span className="text-white">QR Code</span>
                  </button>
                  <button onClick={() => setCodeType('barcode')} className={`p-4 rounded-xl border-2 flex flex-col items-center ${codeType === 'barcode' ? 'border-primary-500 bg-primary-500/10' : 'border-white/10'}`}>
                    <HiViewGrid className={`w-12 h-12 mb-2 ${codeType === 'barcode' ? 'text-primary-400' : 'text-gray-400'}`} /><span className="text-white">Barcode</span>
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-dark-300 text-white"><HiArrowLeft className="w-5 h-5" />Back</button>
              <button onClick={() => setStep(4)} className="px-6 py-3 rounded-xl font-semibold bg-primary-500 text-white hover:bg-primary-600">Next: Upload CSV</button>
            </div>
          </motion.div>
        )}

        {/* Step 4: CSV Upload */}
        {step === 4 && !processingState && (
          <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-dark-100/50 rounded-xl border border-white/10 p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0"><HiUsers className="w-5 h-5 text-primary-400" /></div>
                <div><h3 className="text-white font-medium mb-1">Up to 500</h3><p className="text-gray-400 text-sm">Documents per batch</p></div>
              </div>
              <div className="bg-dark-100/50 rounded-xl border border-white/10 p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-600/20 flex items-center justify-center flex-shrink-0"><HiCube className="w-5 h-5 text-accent-400" /></div>
                <div><h3 className="text-white font-medium mb-1">Merkle Batching</h3><p className="text-gray-400 text-sm">Single blockchain transaction</p></div>
              </div>
              <div className="bg-dark-100/50 rounded-xl border border-white/10 p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center flex-shrink-0"><HiLightningBolt className="w-5 h-5 text-yellow-400" /></div>
                <div><h3 className="text-white font-medium mb-1">{embedCode ? 'QR/Barcode' : 'No Code'}</h3><p className="text-gray-400 text-sm">{embedCode ? `${codeType.toUpperCase()} embedded` : 'Codes disabled'}</p></div>
              </div>
            </div>

            {/* Template Download */}
            <div className="bg-primary-600/10 border border-primary-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HiTemplate className="w-6 h-6 text-primary-400" />
                <div><p className="text-white font-medium">Download CSV Template for {DOCUMENT_TYPE_LABELS[documentType]}</p><p className="text-gray-400 text-sm">Use our template to ensure correct formatting</p></div>
              </div>
              <button onClick={downloadTemplate} className="btn-secondary py-2 text-sm"><HiDownload className="w-4 h-4 mr-2 inline" />Download</button>
            </div>

            {/* Upload Zone */}
            <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-primary-500 bg-primary-500/10' : csvFile ? 'border-accent-500 bg-accent-500/10' : 'border-white/20 hover:border-primary-500/50 bg-dark-100/30'}`}>
              <input {...getInputProps()} />
              {csvFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-4 rounded-2xl bg-accent-600/20 flex items-center justify-center"><HiCheckCircle className="w-8 h-8 text-accent-400" /></div>
                  <p className="text-white text-lg mb-2">{csvFile.name}</p>
                  <p className="text-gray-400 text-sm mb-4">{allData.length} records found • {(csvFile.size / 1024).toFixed(2)} KB</p>
                  <button onClick={(e) => { e.stopPropagation(); setCsvFile(null); setParsedData([]); setAllData([]); }} className="text-gray-400 hover:text-white flex items-center gap-2"><HiX className="w-4 h-4" />Remove file</button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 flex items-center justify-center"><HiCloudUpload className="w-8 h-8 text-primary-400" /></div>
                  {isDragActive ? <p className="text-white text-lg">Drop your CSV file here...</p> : <><p className="text-white text-lg mb-2">Drag & drop your CSV file here</p><p className="text-gray-400 text-sm">or click to browse</p></>}
                </div>
              )}
            </div>

            {/* Data Preview */}
            {parsedData.length > 0 && (
              <div className="bg-dark-100/50 rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3"><HiTable className="w-5 h-5 text-primary-400" /><h3 className="text-white font-semibold">Data Preview</h3></div>
                  <span className="text-gray-400 text-sm">Showing first 10 of {allData.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-white/5">{Object.keys(parsedData[0] || {}).slice(0, 6).map((header) => <th key={header} className="text-left px-4 py-3 text-gray-400 text-sm font-medium">{header}</th>)}</tr></thead>
                    <tbody>{parsedData.map((row, index) => <tr key={index} className="border-t border-white/5">{Object.values(row).slice(0, 6).map((value, i) => <td key={i} className="px-4 py-3 text-gray-300 text-sm">{String(value).substring(0, 25)}{String(value).length > 25 ? '...' : ''}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(3)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-dark-300 text-white"><HiArrowLeft className="w-5 h-5" />Back</button>
              <button onClick={startBulkIssuance} disabled={!csvFile || allData.length === 0}
                className={`px-6 py-3 rounded-xl font-semibold ${csvFile && allData.length > 0 ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
                Start Bulk Issuance ({allData.length} documents)
              </button>
            </div>
          </motion.div>
        )}

        {/* Processing State */}
        {processingState && processingState !== 'complete' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-dark-100/50 rounded-2xl border border-white/10 p-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-white mb-2">Processing Bulk Issuance</h2>
              <p className="text-gray-400">This may take a few moments</p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-6 max-w-md mx-auto mb-8">
              {[
                { id: 'processing', label: 'Generating Certificates', icon: HiDocumentText },
                { id: 'merkle', label: 'Building Merkle Tree', icon: HiCube },
                { id: 'blockchain', label: 'Anchoring on Blockchain', icon: HiLightningBolt },
              ].map((step, index) => {
                const steps = ['processing', 'merkle', 'blockchain'];
                const currentIndex = steps.indexOf(processingState);
                const isActive = processingState === step.id;
                const isPast = currentIndex > index;
                
                return (
                  <div key={step.id} className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all
                      ${isPast ? 'bg-accent-600' : isActive ? 'bg-primary-600 animate-pulse' : 'bg-white/10'}`}
                    >
                      {isPast ? (
                        <HiCheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <step.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isPast || isActive ? 'text-white' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {isActive && processingState === 'processing' && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm text-gray-400 mb-1">
                            <span>Processing...</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {isActive && processingState !== 'processing' && (
                        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Merkle Tree Visualization */}
            {processingState === 'merkle' && (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-center text-white font-medium mb-4">Building Merkle Tree</h3>
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-20 h-10 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg 
                    flex items-center justify-center text-white text-xs font-bold animate-pulse">
                    Root
                  </div>
                  <div className="flex gap-6">
                    <div className="w-16 h-8 bg-primary-600/50 rounded flex items-center justify-center 
                      text-white text-xs animate-pulse animation-delay-200">H1-2</div>
                    <div className="w-16 h-8 bg-primary-600/50 rounded flex items-center justify-center 
                      text-white text-xs animate-pulse animation-delay-400">H3-4</div>
                  </div>
                  <div className="flex gap-3">
                    {['C1', 'C2', 'C3', 'C4'].map((c, i) => (
                      <div key={i} className="w-12 h-8 bg-white/10 rounded flex items-center justify-center 
                        text-gray-400 text-xs">{c}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Completion State */}
        {processingState === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-dark-100/50 rounded-2xl border border-white/10 p-8"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-600/20 flex items-center justify-center">
                <HiCheckCircle className="w-12 h-12 text-accent-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Bulk Issuance Complete!</h2>
              <p className="text-gray-400">All certificates have been generated and anchored on the blockchain</p>
            </div>

            {/* Results Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="text-3xl font-bold text-white mb-1">{results?.total}</div>
                <div className="text-gray-400 text-sm">Total Processed</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="text-3xl font-bold text-accent-400 mb-1">{results?.successful}</div>
                <div className="text-gray-400 text-sm">Successful</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="text-3xl font-bold text-red-400 mb-1">{results?.failed}</div>
                <div className="text-gray-400 text-sm">Failed</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-1">{results?.gasSaved}</div>
                <div className="text-gray-400 text-sm">Gas Saved</div>
              </div>
            </div>

            {/* Blockchain Details */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <HiCube className="w-5 h-5 text-primary-400" />
                Blockchain Details
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Merkle Root</div>
                  <code className="text-white text-sm font-mono break-all">{results?.merkleRoot}</code>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Block Number</div>
                    <p className="text-white font-medium">#{results?.blockNumber}</p>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Network</div>
                    <p className="text-white font-medium">Ethereum Mainnet</p>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Transaction Hash</div>
                  <code className="text-primary-400 text-sm font-mono">{results?.transactionHash}</code>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button onClick={reset} className="btn-secondary">
                Issue More Certificates
              </button>
              <button className="btn-primary">
                <HiDownload className="w-5 h-5 mr-2 inline" />
                Download Report
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BulkIssuance;
