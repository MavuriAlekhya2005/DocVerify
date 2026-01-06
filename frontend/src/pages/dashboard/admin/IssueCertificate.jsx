import { useState, useEffect } from 'react';
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
  HiColorSwatch
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';
import api from '../../../services/api';
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  getTemplatesByType,
  getFieldsByType,
} from '../../../data/documentTemplates';
import DocumentPreviewRenderer from '../../../components/DocumentPreviewRenderer';

const IssueCertificate = () => {
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [items, setItems] = useState([{ description: '', quantity: 1, price: 0 }]);
  const [codeType, setCodeType] = useState('qr');
  const [codePermission, setCodePermission] = useState(true);
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [colorMode, setColorMode] = useState('two-tone');

  const documentTypeOptions = [
    { type: DOCUMENT_TYPES.STUDENT_ID, icon: HiIdentification, label: 'Student ID Card', description: 'Create student identification cards with photo and details' },
    { type: DOCUMENT_TYPES.BILL, icon: HiCurrencyDollar, label: 'Bill / Invoice', description: 'Generate professional bills and invoices for transactions' },
    { type: DOCUMENT_TYPES.CERTIFICATE, icon: HiAcademicCap, label: 'Certificate', description: 'Issue certificates for achievements, courses, and awards' },
  ];

  const templates = documentType ? getTemplatesByType(documentType) : [];
  const fields = documentType ? getFieldsByType(documentType) : [];

  useEffect(() => {
    if (documentType === DOCUMENT_TYPES.BILL) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const taxAmount = subtotal * ((formData.taxRate || 0) / 100);
      const discount = parseFloat(formData.discount) || 0;
      const total = subtotal + taxAmount - discount;
      setFormData(prev => ({ ...prev, subtotal: subtotal.toFixed(2), taxAmount: taxAmount.toFixed(2), totalAmount: total.toFixed(2) }));
    }
  }, [items, formData.taxRate, formData.discount, documentType]);

  const handleTypeSelect = (type) => { setDocumentType(type); setSelectedTemplate(null); setFormData({}); setItems([{ description: '', quantity: 1, price: 0 }]); };
  const handleTemplateSelect = (template) => setSelectedTemplate(template);
  const handleFieldChange = (fieldName, value) => setFormData(prev => ({ ...prev, [fieldName]: value }));

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

  const addItem = () => setItems([...items, { description: '', quantity: 1, price: 0 }]);
  const removeItem = (index) => items.length > 1 && setItems(items.filter((_, i) => i !== index));

  const generateDocumentId = () => {
    const prefix = documentType === DOCUMENT_TYPES.STUDENT_ID ? 'SID' : documentType === DOCUMENT_TYPES.BILL ? 'INV' : 'CRT';
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const generateAccessKey = () => Math.random().toString(36).substr(2, 12).toUpperCase();

  const validateForm = () => {
    const requiredFields = fields.filter(f => f.required && f.type !== 'items');
    for (const field of requiredFields) {
      if (!formData[field.name]) { toast.error(`Please fill in ${field.label}`); return false; }
    }
    if (documentType === DOCUMENT_TYPES.BILL && items.some(item => !item.description)) { toast.error('Please fill in all item descriptions'); return false; }
    return true;
  };

  const generateQRCode = async (data) => {
    try { return await QRCode.toDataURL(JSON.stringify(data), { width: 150, margin: 2 }); }
    catch (err) { console.error('QR generation error:', err); return null; }
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

  const generateDocument = async () => {
    if (!validateForm()) return;
    setIsGenerating(true);
    try {
      const docId = generateDocumentId();
      const accessKey = generateAccessKey();
      const verifyUrl = `${window.location.origin}/verify/${docId}`;
      const codeData = { id: docId, type: documentType, url: verifyUrl };
      let codeImage = codePermission ? (codeType === 'qr' ? await generateQRCode(codeData) : generateBarcode(docId)) : null;
      
      setGeneratedDocument({
        documentId: docId, accessKey, documentType, template: selectedTemplate,
        formData: { ...formData, items: documentType === DOCUMENT_TYPES.BILL ? items : undefined },
        codeImage, codeType, verifyUrl, createdAt: new Date().toISOString(),
        photoPreview, logoPreview, signaturePreview, colorMode,
      });
      setStep(5);
    } catch (error) { toast.error('Failed to generate document'); }
    finally { setIsGenerating(false); }
  };

  const saveDocument = async () => {
    if (!generatedDocument) return;
    try {
      const response = await api.issueUserDocument({
        documentId: generatedDocument.documentId, accessKey: generatedDocument.accessKey,
        documentType: generatedDocument.documentType, templateId: generatedDocument.template.id,
        formData: generatedDocument.formData, codeType: generatedDocument.codeType,
      });
      if (response.success) {
        toast.success('Document issued successfully!');
        setStep(1); setDocumentType(''); setSelectedTemplate(null); setFormData({});
        setItems([{ description: '', quantity: 1, price: 0 }]); setGeneratedDocument(null);
      } else { toast.error(response.message || 'Failed to save document'); }
    } catch (error) { toast.error('Failed to save document'); }
  };

  const nextStep = () => {
    if (step === 1 && !documentType) return toast.error('Please select a document type');
    if (step === 2 && !selectedTemplate) return toast.error('Please select a template');
    if (step === 3 && !validateForm()) return;
    if (step === 4) return generateDocument();
    setStep(step + 1);
  };
  const prevStep = () => step > 1 && setStep(step - 1);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 flex-wrap gap-2">
      {[{ num: 1, label: 'Type' }, { num: 2, label: 'Template' }, { num: 3, label: 'Details' }, { num: 4, label: 'Code' }, { num: 5, label: 'Preview' }].map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= s.num ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-600 text-gray-400'}`}>
            {step > s.num ? <HiCheck className="w-5 h-5" /> : s.num}
          </div>
          <span className={`ml-2 text-sm ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>{s.label}</span>
          {i < 4 && <div className={`w-8 h-0.5 mx-2 ${step > s.num ? 'bg-primary-500' : 'bg-gray-600'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-display">Issue Document</h1>
        <p className="text-gray-400 mt-2">Create verifiable documents with embedded QR codes</p>
      </div>
      {renderStepIndicator()}
      <div className="bg-dark-200 rounded-2xl p-6 border border-white/10">
        {/* Step 1: Document Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Select Document Type</h2>
              <p className="text-gray-400">Choose the type of document you want to create</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {documentTypeOptions.map((option) => (
                <button key={option.type} onClick={() => handleTypeSelect(option.type)}
                  className={`p-6 rounded-2xl border-2 transition-all text-left ${documentType === option.type ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-dark-200 hover:border-white/30'}`}>
                  <option.icon className={`w-12 h-12 mb-4 ${documentType === option.type ? 'text-primary-400' : 'text-gray-400'}`} />
                  <h3 className="text-lg font-semibold text-white mb-2">{option.label}</h3>
                  <p className="text-sm text-gray-400">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Template Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Choose a Template</h2>
              <p className="text-gray-400">Select a design template for your {DOCUMENT_TYPE_LABELS[documentType]}</p>
            </div>
            <div className="flex justify-center gap-4 mb-6">
              {['solid', 'two-tone', 'three-tone'].map((mode) => (
                <button key={mode} onClick={() => setColorMode(mode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${colorMode === mode ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                  <HiColorSwatch className="w-5 h-5" /><span className="capitalize">{mode.replace('-', ' ')}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[50vh] overflow-y-auto p-2">
              {templates.map((template) => {
                const gradientStyle = colorMode === 'solid' ? { background: template.colors.primary }
                  : colorMode === 'two-tone' ? { background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%)` }
                  : { background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 50%, ${template.colors.accent} 100%)` };
                return (
                  <button key={template.id} onClick={() => handleTemplateSelect({ ...template, colorMode })}
                    className={`relative p-3 rounded-xl border-2 transition-all ${selectedTemplate?.id === template.id ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-dark-200 hover:border-white/30'}`}>
                    <div className="aspect-[3/4] rounded-lg mb-2 flex items-center justify-center" style={gradientStyle}>
                      <HiTemplate className="w-8 h-8" style={{ color: template.colors.text || '#fff' }} />
                    </div>
                    <p className="text-sm text-white font-medium truncate">{template.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{template.style}</p>
                    {selectedTemplate?.id === template.id && <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"><HiCheck className="w-4 h-4 text-white" /></div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Form Fields */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Enter Document Details</h2>
              <p className="text-gray-400">Fill in the information for your {DOCUMENT_TYPE_LABELS[documentType]}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto p-2">
              {fields.filter(f => f.type !== 'items').map((field) => (
                <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{field.label}{field.required && <span className="text-red-400 ml-1">*</span>}</label>
                  {field.type === 'text' && <input type="text" value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white focus:border-primary-500 transition-all" placeholder={`Enter ${field.label.toLowerCase()}`} />}
                  {field.type === 'email' && <input type="email" value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white focus:border-primary-500 transition-all" />}
                  {field.type === 'tel' && <input type="tel" value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white focus:border-primary-500 transition-all" />}
                  {field.type === 'number' && <input type="number" value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white focus:border-primary-500 transition-all" />}
                  {field.type === 'currency' && <input type="number" step="0.01" value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} disabled={field.auto} className={`w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white ${field.auto ? 'opacity-60' : ''}`} />}
                  {field.type === 'date' && <input type="date" value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white focus:border-primary-500 transition-all" />}
                  {field.type === 'textarea' && <textarea value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} rows={3} className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white resize-none" />}
                  {field.type === 'select' && <select value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white"><option value="">Select {field.label}</option>{field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}</select>}
                  {field.type === 'image' && (
                    <div className="flex items-center gap-4">
                      <label className="flex-1 flex items-center justify-center px-4 py-3 bg-dark-300 border border-dashed border-white/10 rounded-xl text-gray-400 cursor-pointer hover:border-primary-500">
                        <HiPhotograph className="w-5 h-5 mr-2" /><span>{formData[field.name] ? 'Change' : 'Upload'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(field.name, e.target.files[0])} />
                      </label>
                      {((field.name === 'photo' && photoPreview) || (field.name === 'organizationLogo' && logoPreview) || (field.name === 'signature' && signaturePreview)) &&
                        <img src={field.name === 'photo' ? photoPreview : field.name === 'organizationLogo' ? logoPreview : signaturePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />}
                    </div>
                  )}
                </div>
              ))}
              {documentType === DOCUMENT_TYPES.BILL && (
                <div className="md:col-span-2 space-y-4">
                  <label className="block text-sm font-medium text-gray-300">Line Items <span className="text-red-400">*</span></label>
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <input type="text" placeholder="Description" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="flex-1 px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white" />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-20 px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white" />
                      <input type="number" step="0.01" placeholder="Price" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} className="w-28 px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white" />
                      <button onClick={() => removeItem(index)} className="px-4 py-3 bg-red-500/20 text-red-400 rounded-xl" disabled={items.length === 1}>×</button>
                    </div>
                  ))}
                  <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-primary-500">+ Add Item</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Code Settings */}
        {step === 4 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Verification Code Settings</h2>
              <p className="text-gray-400">Configure QR code or barcode for your document</p>
            </div>
            <div className="bg-dark-300 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div><h3 className="text-lg font-semibold text-white">Embed Verification Code</h3><p className="text-sm text-gray-400">Add QR/barcode for verification</p></div>
                <button onClick={() => setCodePermission(!codePermission)} className={`relative w-14 h-8 rounded-full ${codePermission ? 'bg-primary-500' : 'bg-gray-600'}`}>
                  <div className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-all ${codePermission ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
            {codePermission && (
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
          </div>
        )}

        {/* Step 5: Preview */}
        {step === 5 && generatedDocument && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Document Preview</h2>
              <p className="text-gray-400">Review your document before saving</p>
            </div>
            <DocumentPreviewRenderer documentType={documentType} template={selectedTemplate} formData={generatedDocument.formData}
              documentId={generatedDocument.documentId} accessKey={generatedDocument.accessKey} codeImage={generatedDocument.codeImage}
              photoPreview={photoPreview} logoPreview={logoPreview} signaturePreview={signaturePreview} colorMode={colorMode} />
            <div className="bg-dark-300 rounded-xl p-4 border border-white/10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-xs text-gray-400">Document ID</p><p className="font-mono text-primary-400 text-sm">{generatedDocument.documentId}</p></div>
                <div><p className="text-xs text-gray-400">Access Key</p><p className="font-mono text-green-400 text-sm">{generatedDocument.accessKey}</p></div>
                <div><p className="text-xs text-gray-400">Verify URL</p><p className="text-xs text-blue-400 truncate">{generatedDocument.verifyUrl}</p></div>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <button onClick={saveDocument} className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 font-semibold"><HiCheck className="w-5 h-5" />Save Document</button>
              <button onClick={() => { const blob = new Blob([JSON.stringify(generatedDocument, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${generatedDocument.documentId}.json`; a.click(); }}
                className="flex items-center gap-2 px-6 py-3 bg-dark-300 text-white rounded-xl border border-white/10"><HiDownload className="w-5 h-5" />Download</button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <button onClick={prevStep} disabled={step === 1} className={`flex items-center gap-2 px-6 py-3 rounded-xl ${step === 1 ? 'opacity-50 text-gray-500' : 'bg-dark-300 text-white hover:bg-dark-100'}`}>
              <HiArrowLeft className="w-5 h-5" />Back
            </button>
            <button onClick={nextStep} disabled={isGenerating} className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50">
              {isGenerating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</> : step === 4 ? <><HiEye className="w-5 h-5" />Generate Preview</> : <>Next<HiArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueCertificate;
