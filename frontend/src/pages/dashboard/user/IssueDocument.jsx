import { useState, useEffect, useRef } from 'react';
import { 
  HiDocumentText, 
  HiIdentification, 
  HiCurrencyDollar, 
  HiAcademicCap,
  HiArrowRight,
  HiArrowLeft,
  HiCheck,
  HiTemplate,
  HiEye,
  HiDownload,
  HiQrcode,
  HiViewGrid,
  HiPhotograph,
  HiLightningBolt
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import api from '../../../services/api';
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  getTemplatesByType,
  getFieldsByType,
} from '../../../data/documentTemplates';
import { AIDocumentUploader, AIFormHelper } from '../../../components/ai';
import { GasEstimator } from '../../../components/blockchain';

const IssueDocument = () => {
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [items, setItems] = useState([{ description: '', quantity: 1, price: 0 }]);
  const [codeType, setCodeType] = useState('qr'); // 'qr' or 'barcode'
  const [codePermission, setCodePermission] = useState(true);
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  
  const canvasRef = useRef(null);
  const qrCanvasRef = useRef(null);
  const barcodeRef = useRef(null);

  const documentTypeOptions = [
    { type: DOCUMENT_TYPES.STUDENT_ID, icon: HiIdentification, label: 'Student ID Card', description: 'Create student identification cards with photo and details' },
    { type: DOCUMENT_TYPES.BILL, icon: HiCurrencyDollar, label: 'Bill / Invoice', description: 'Generate professional bills and invoices for transactions' },
    { type: DOCUMENT_TYPES.CERTIFICATE, icon: HiAcademicCap, label: 'Certificate', description: 'Issue certificates for achievements, courses, and awards' },
  ];

  const templates = documentType ? getTemplatesByType(documentType) : [];
  const fields = documentType ? getFieldsByType(documentType) : [];

  // Calculate bill totals
  useEffect(() => {
    if (documentType === DOCUMENT_TYPES.BILL) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const taxAmount = subtotal * ((formData.taxRate || 0) / 100);
      const discount = parseFloat(formData.discount) || 0;
      const total = subtotal + taxAmount - discount;
      
      setFormData(prev => ({
        ...prev,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: total.toFixed(2),
      }));
    }
  }, [items, formData.taxRate, formData.discount, documentType]);

  const handleTypeSelect = (type) => {
    setDocumentType(type);
    setSelectedTemplate(null);
    setFormData({});
    setItems([{ description: '', quantity: 1, price: 0 }]);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleImageUpload = (fieldName, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (fieldName === 'photo') setPhotoPreview(reader.result);
        if (fieldName === 'organizationLogo') setLogoPreview(reader.result);
        if (fieldName === 'signature') setSignaturePreview(reader.result);
        handleFieldChange(fieldName, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const generateDocumentId = () => {
    const prefix = documentType === DOCUMENT_TYPES.STUDENT_ID ? 'SID' : 
                   documentType === DOCUMENT_TYPES.BILL ? 'INV' : 'CRT';
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const generateAccessKey = () => {
    return Math.random().toString(36).substr(2, 12).toUpperCase();
  };

  const validateForm = () => {
    const requiredFields = fields.filter(f => f.required && f.type !== 'items');
    for (const field of requiredFields) {
      if (!formData[field.name]) {
        toast.error(`Please fill in ${field.label}`);
        return false;
      }
    }
    
    if (documentType === DOCUMENT_TYPES.BILL && items.some(item => !item.description)) {
      toast.error('Please fill in all item descriptions');
      return false;
    }
    
    return true;
  };

  const generateQRCode = async (data) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(data), {
        width: 150,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      return qrDataUrl;
    } catch (err) {
      console.error('QR generation error:', err);
      return null;
    }
  };

  const generateBarcode = (data) => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, data, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 12,
      });
      return canvas.toDataURL();
    } catch (err) {
      console.error('Barcode generation error:', err);
      return null;
    }
  };

  const generateDocument = async () => {
    if (!validateForm()) return;
    
    setIsGenerating(true);
    
    try {
      const docId = generateDocumentId();
      const accessKey = generateAccessKey();
      const verifyUrl = `${window.location.origin}/verify/${docId}`;
      
      // Generate QR or Barcode based on data size and user preference
      const codeData = {
        id: docId,
        type: documentType,
        url: verifyUrl,
      };
      
      const dataSize = JSON.stringify({ ...formData, items }).length;
      const recommendedType = dataSize > 500 ? 'qr' : codeType;
      
      let codeImage = null;
      if (codePermission) {
        if (recommendedType === 'qr' || codeType === 'qr') {
          codeImage = await generateQRCode(codeData);
        } else {
          codeImage = generateBarcode(docId);
        }
      }
      
      // Create document data
      const documentData = {
        documentId: docId,
        accessKey,
        documentType,
        template: selectedTemplate,
        formData: { ...formData, items: documentType === DOCUMENT_TYPES.BILL ? items : undefined },
        codeImage,
        codeType: recommendedType,
        verifyUrl,
        createdAt: new Date().toISOString(),
        photoPreview,
        logoPreview,
        signaturePreview,
      };
      
      setGeneratedDocument(documentData);
      setStep(5); // Go to preview step
      
    } catch (error) {
      console.error('Document generation error:', error);
      toast.error('Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDocument = async () => {
    if (!generatedDocument) return;
    
    try {
      const response = await api.issueUserDocument({
        documentId: generatedDocument.documentId,
        accessKey: generatedDocument.accessKey,
        documentType: generatedDocument.documentType,
        templateId: generatedDocument.template.id,
        formData: generatedDocument.formData,
        codeType: generatedDocument.codeType,
      });
      
      if (response.success) {
        toast.success('Document issued successfully!');
        // Reset form
        setStep(1);
        setDocumentType('');
        setSelectedTemplate(null);
        setFormData({});
        setItems([{ description: '', quantity: 1, price: 0 }]);
        setGeneratedDocument(null);
      } else {
        toast.error(response.message || 'Failed to save document');
      }
    } catch (error) {
      toast.error('Failed to save document');
    }
  };

  const downloadDocument = () => {
    // Create downloadable document (simplified - in production would use PDF generation)
    const docContent = JSON.stringify(generatedDocument, null, 2);
    const blob = new Blob([docContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedDocument.documentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
    if (step === 3 && !validateForm()) {
      return;
    }
    if (step === 4) {
      generateDocument();
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Render functions for each step
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[
        { num: 1, label: 'Type' },
        { num: 2, label: 'Template' },
        { num: 3, label: 'Details' },
        { num: 4, label: 'Code' },
        { num: 5, label: 'Preview' },
      ].map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
            ${step >= s.num ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-600 text-gray-400'}`}>
            {step > s.num ? <HiCheck className="w-5 h-5" /> : s.num}
          </div>
          <span className={`ml-2 text-sm ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>{s.label}</span>
          {i < 4 && <div className={`w-12 h-0.5 mx-2 ${step > s.num ? 'bg-primary-500' : 'bg-gray-600'}`} />}
        </div>
      ))}
    </div>
  );

  const renderDocumentTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Select Document Type</h2>
        <p className="text-gray-400">Choose the type of document you want to create</p>
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
        <p className="text-gray-400">Select a design template for your {DOCUMENT_TYPE_LABELS[documentType]}</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto p-2">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className={`relative p-3 rounded-xl border-2 transition-all
              ${selectedTemplate?.id === template.id 
                ? 'border-primary-500 bg-primary-500/10' 
                : 'border-white/10 bg-dark-200 hover:border-white/30'}`}
          >
            {/* Template Preview */}
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
    </div>
  );

  const renderFormFields = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Enter Document Details</h2>
        <p className="text-gray-400">Fill in the information for your {DOCUMENT_TYPE_LABELS[documentType]}</p>
      </div>
      
      {/* AI Document Uploader */}
      <div className="mb-6">
        <AIDocumentUploader 
          documentType={documentType}
          onFieldsExtracted={(extractedFields) => {
            setFormData(prev => ({ ...prev, ...extractedFields }));
            toast.success('Fields extracted with AI!');
          }}
          className="mb-4"
        />
        <AIFormHelper />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto p-2">
        {fields.filter(f => f.type !== 'items').map((field) => (
          <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            
            {field.type === 'text' && (
              <input
                type="text"
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white 
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
            
            {field.type === 'email' && (
              <input
                type="email"
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white 
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
            
            {field.type === 'tel' && (
              <input
                type="tel"
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white 
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
            
            {field.type === 'number' && (
              <input
                type="number"
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white 
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
            
            {field.type === 'currency' && (
              <input
                type="number"
                step="0.01"
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                disabled={field.auto}
                className={`w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white 
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all
                  ${field.auto ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
            
            {field.type === 'date' && (
              <input
                type="date"
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white 
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              />
            )}
            
            {field.type === 'textarea' && (
              <textarea
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white 
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
            
            {field.type === 'select' && (
              <select
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white 
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            
            {field.type === 'image' && (
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center px-4 py-3 bg-dark-300 border border-white/10 
                  border-dashed rounded-xl text-gray-400 cursor-pointer hover:border-primary-500 transition-all">
                  <HiPhotograph className="w-5 h-5 mr-2" />
                  <span>{formData[field.name] ? 'Change Image' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(field.name, e.target.files[0])}
                  />
                </label>
                {(field.name === 'photo' && photoPreview) ||
                 (field.name === 'organizationLogo' && logoPreview) ||
                 (field.name === 'signature' && signaturePreview) ? (
                  <img 
                    src={field.name === 'photo' ? photoPreview : 
                         field.name === 'organizationLogo' ? logoPreview : signaturePreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-white/10"
                  />
                ) : null}
              </div>
            )}
          </div>
        ))}
        
        {/* Line Items for Bills */}
        {documentType === DOCUMENT_TYPES.BILL && (
          <div className="md:col-span-2 space-y-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Line Items <span className="text-red-400">*</span>
            </label>
            
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <input
                  type="text"
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  className="flex-1 px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white 
                    focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="w-24 px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white 
                    focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                  className="w-32 px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white 
                    focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
                <button
                  onClick={() => removeItem(index)}
                  className="px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"
                  disabled={items.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
            
            <button
              onClick={addItem}
              className="w-full px-4 py-3 border-2 border-dashed border-white/20 rounded-xl text-gray-400 
                hover:border-primary-500 hover:text-primary-400 transition-all"
            >
              + Add Item
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCodeSettings = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Verification Code Settings</h2>
        <p className="text-gray-400">Configure QR code or barcode for your document</p>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Permission Toggle */}
        <div className="bg-dark-200 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Embed Verification Code</h3>
              <p className="text-sm text-gray-400 mt-1">
                Add a QR code or barcode for easy document verification
              </p>
            </div>
            <button
              onClick={() => setCodePermission(!codePermission)}
              className={`relative w-14 h-8 rounded-full transition-all
                ${codePermission ? 'bg-primary-500' : 'bg-gray-600'}`}
            >
              <div className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-all
                ${codePermission ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
        
        {codePermission && (
          <>
            {/* Code Type Selection */}
            <div className="bg-dark-200 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Code Type</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCodeType('qr')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center
                    ${codeType === 'qr' 
                      ? 'border-primary-500 bg-primary-500/10' 
                      : 'border-white/10 hover:border-white/30'}`}
                >
                  <HiQrcode className={`w-12 h-12 mb-2 ${codeType === 'qr' ? 'text-primary-400' : 'text-gray-400'}`} />
                  <span className="font-medium text-white">QR Code</span>
                  <span className="text-xs text-gray-400 mt-1">Best for large data</span>
                </button>
                <button
                  onClick={() => setCodeType('barcode')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center
                    ${codeType === 'barcode' 
                      ? 'border-primary-500 bg-primary-500/10' 
                      : 'border-white/10 hover:border-white/30'}`}
                >
                  <HiViewGrid className={`w-12 h-12 mb-2 ${codeType === 'barcode' ? 'text-primary-400' : 'text-gray-400'}`} />
                  <span className="font-medium text-white">Barcode</span>
                  <span className="text-xs text-gray-400 mt-1">Compact ID only</span>
                </button>
              </div>
              
              {/* Data size recommendation */}
              <div className="mt-4 p-3 bg-dark-300 rounded-xl">
                <p className="text-sm text-gray-400">
                  <span className="text-primary-400 font-medium">Tip:</span> QR codes can store more data and are 
                  recommended for documents with many fields. Barcodes are suitable for simple document IDs.
                </p>
              </div>
            </div>
            
            {/* What will be embedded */}
            <div className="bg-dark-200 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Embedded Information</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-300">
                  <HiCheck className="w-5 h-5 text-green-400 mr-3" />
                  Unique Document ID
                </li>
                <li className="flex items-center text-gray-300">
                  <HiCheck className="w-5 h-5 text-green-400 mr-3" />
                  Verification URL
                </li>
                <li className="flex items-center text-gray-300">
                  <HiCheck className="w-5 h-5 text-green-400 mr-3" />
                  Document Type
                </li>
              </ul>
            </div>
            
            {/* Gas Estimation */}
            <GasEstimator 
              operationType="register" 
              documentCount={1}
              showDetails={false}
              className="mt-4"
            />
          </>
        )}
      </div>
    </div>
  );

  const renderDocumentPreview = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Document Preview</h2>
        <p className="text-gray-400">Review your document before saving</p>
      </div>
      
      {generatedDocument && (
        <div className="max-w-4xl mx-auto">
          {/* Document Preview Card */}
          <div 
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ 
              background: `linear-gradient(135deg, ${selectedTemplate.colors.primary}, ${selectedTemplate.colors.secondary})` 
            }}
          >
            {/* Document Content */}
            <div className="p-8" style={{ color: selectedTemplate.colors.text }}>
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold">{DOCUMENT_TYPE_LABELS[documentType]}</h3>
                  <p className="text-sm opacity-80">ID: {generatedDocument.documentId}</p>
                </div>
                {logoPreview && (
                  <img src={logoPreview} alt="Logo" className="w-20 h-20 object-contain rounded-lg" />
                )}
              </div>
              
              {/* Main Content */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Photo if student ID */}
                {documentType === DOCUMENT_TYPES.STUDENT_ID && photoPreview && (
                  <div className="flex justify-center">
                    <img 
                      src={photoPreview} 
                      alt="Student" 
                      className="w-40 h-48 object-cover rounded-xl border-4 border-white/20"
                    />
                  </div>
                )}
                
                {/* Details */}
                <div className="space-y-3">
                  {fields.filter(f => f.type !== 'items' && f.type !== 'image' && formData[f.name]).map((field) => (
                    <div key={field.name}>
                      <p className="text-xs uppercase tracking-wider opacity-60">{field.label}</p>
                      <p className="font-medium">{formData[field.name]}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Items table for bills */}
              {documentType === DOCUMENT_TYPES.BILL && items.length > 0 && (
                <div className="mt-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Price</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i} className="border-b border-white/10">
                          <td className="py-2">{item.description}</td>
                          <td className="text-right py-2">{item.quantity}</td>
                          <td className="text-right py-2">${item.price.toFixed(2)}</td>
                          <td className="text-right py-2">${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-right py-2 font-semibold">Total:</td>
                        <td className="text-right py-2 font-bold text-lg">${formData.totalAmount}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
              
              {/* QR/Barcode and Access Key */}
              <div className="mt-6 flex justify-between items-end">
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-60">Access Key</p>
                  <p className="font-mono font-bold text-lg">{generatedDocument.accessKey}</p>
                </div>
                
                {generatedDocument.codeImage && (
                  <div className="bg-white p-2 rounded-lg">
                    <img src={generatedDocument.codeImage} alt="Verification Code" className="w-24 h-24" />
                  </div>
                )}
              </div>
              
              {/* Signature for certificates */}
              {documentType === DOCUMENT_TYPES.CERTIFICATE && signaturePreview && (
                <div className="mt-6 text-center">
                  <img src={signaturePreview} alt="Signature" className="h-16 mx-auto" />
                  <p className="font-medium">{formData.signatoryName}</p>
                  <p className="text-sm opacity-80">{formData.signatoryTitle}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Document Info */}
          <div className="mt-6 bg-dark-200 rounded-xl p-4 border border-white/10">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-400">Document ID</p>
                <p className="font-mono text-primary-400">{generatedDocument.documentId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Access Key</p>
                <p className="font-mono text-green-400">{generatedDocument.accessKey}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Verification URL</p>
                <p className="text-sm text-blue-400 truncate">{generatedDocument.verifyUrl}</p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex gap-4 justify-center">
            <button
              onClick={saveDocument}
              className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl 
                hover:bg-primary-600 transition-all font-semibold"
            >
              <HiCheck className="w-5 h-5" />
              Save Document
            </button>
            <button
              onClick={downloadDocument}
              className="flex items-center gap-2 px-6 py-3 bg-dark-200 text-white rounded-xl 
                border border-white/10 hover:border-white/30 transition-all"
            >
              <HiDownload className="w-5 h-5" />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-display">Issue Document</h1>
        <p className="text-gray-400 mt-2">Create verifiable documents with embedded QR codes</p>
      </div>
      
      {/* Step Indicator */}
      {renderStepIndicator()}
      
      {/* Step Content */}
      <div className="bg-dark-200 rounded-2xl p-6 border border-white/10">
        {step === 1 && renderDocumentTypeSelection()}
        {step === 2 && renderTemplateSelection()}
        {step === 3 && renderFormFields()}
        {step === 4 && renderCodeSettings()}
        {step === 5 && renderDocumentPreview()}
        
        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all
                ${step === 1 
                  ? 'opacity-50 cursor-not-allowed text-gray-500' 
                  : 'bg-dark-300 text-white hover:bg-dark-100'}`}
            >
              <HiArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl 
                hover:bg-primary-600 transition-all font-semibold disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : step === 4 ? (
                <>
                  <HiEye className="w-5 h-5" />
                  Generate Preview
                </>
              ) : (
                <>
                  Next
                  <HiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueDocument;
