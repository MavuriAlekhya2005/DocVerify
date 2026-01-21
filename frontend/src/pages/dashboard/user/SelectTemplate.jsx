/**
 * Select Template Page - Step 1: Choose document type, Step 2: Choose template
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiDocumentText, HiIdentification, HiCurrencyDollar, HiArrowRight, HiCheck, HiArrowLeft } from 'react-icons/hi';
import {
  DOCUMENT_TYPES,
  STUDENT_ID_TEMPLATES,
  BILL_TEMPLATES,
  CERTIFICATE_TEMPLATES,
} from '../../../data/documentTemplates';

const SelectTemplate = () => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const documentTypes = [
    {
      type: DOCUMENT_TYPES.CERTIFICATE,
      label: 'Certificate',
      description: 'Professional certificates, awards, diplomas',
      icon: HiDocumentText,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      type: DOCUMENT_TYPES.STUDENT_ID,
      label: 'Student ID Card',
      description: 'Student identification cards',
      icon: HiIdentification,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      type: DOCUMENT_TYPES.BILL,
      label: 'Bill / Invoice',
      description: 'Invoices and payment receipts',
      icon: HiCurrencyDollar,
      gradient: 'from-emerald-500 to-teal-600',
    },
  ];

  const getTemplates = () => {
    switch (selectedType) {
      case DOCUMENT_TYPES.STUDENT_ID: return STUDENT_ID_TEMPLATES;
      case DOCUMENT_TYPES.BILL: return BILL_TEMPLATES;
      case DOCUMENT_TYPES.CERTIFICATE: return CERTIFICATE_TEMPLATES;
      default: return [];
    }
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setSelectedTemplate(null);
    setStep(2);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleOpenEditor = () => {
    if (!selectedTemplate) return;
    
    // Store in localStorage (persists across windows)
    localStorage.setItem('docverify_editor_data', JSON.stringify({
      documentType: selectedType,
      template: selectedTemplate,
      timestamp: Date.now(),
    }));
    
    // Open editor in new window
    window.open('/editor', 'DocVerifyEditor', 'width=1400,height=900');
  };

  const handleStartBlank = () => {
    localStorage.setItem('docverify_editor_data', JSON.stringify({
      documentType: selectedType,
      template: null,
      timestamp: Date.now(),
    }));
    window.open('/editor', 'DocVerifyEditor', 'width=1400,height=900');
  };

  const templates = getTemplates();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <HiArrowLeft className="w-5 h-5 mr-2" />
            Back to Document Types
          </button>
        )}
        <h1 className="text-3xl font-bold text-white mb-2">
          {step === 1 ? 'Create New Document' : 'Select a Template'}
        </h1>
        <p className="text-gray-400">
          {step === 1 ? 'Choose the type of document you want to create' : 'Pick a design template to get started'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Document Type */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {documentTypes.map((doc) => (
              <button
                key={doc.type}
                onClick={() => handleTypeSelect(doc.type)}
                className="group p-8 bg-dark-200 rounded-2xl border border-white/10 hover:border-white/20 
                  text-left transition-all hover:transform hover:scale-[1.02]"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${doc.gradient} 
                  flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <doc.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{doc.label}</h3>
                <p className="text-gray-400 text-sm mb-4">{doc.description}</p>
                <div className="flex items-center text-accent-400 group-hover:translate-x-2 transition-transform">
                  <span className="text-sm font-medium">Select</span>
                  <HiArrowRight className="w-4 h-4 ml-2" />
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {/* Step 2: Select Template */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-400">
                {templates.length} templates available
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStartBlank}
                  className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  Start Blank
                </button>
                <button
                  onClick={handleOpenEditor}
                  disabled={!selectedTemplate}
                  className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    selectedTemplate
                      ? 'bg-accent-500 text-white hover:bg-accent-600'
                      : 'bg-dark-100 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Open Editor
                  <HiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-accent-500 ring-2 ring-accent-500/30'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Template Preview */}
                  <div 
                    className="aspect-[3/4] relative"
                    style={{
                      background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%)`,
                    }}
                  >
                    {/* Decorative elements based on style */}
                    <div className="absolute inset-4 border-2 border-white/20 rounded" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white/80 p-4">
                        <div className="w-12 h-1 bg-white/40 mx-auto mb-2 rounded" />
                        <div className="w-20 h-1 bg-white/30 mx-auto mb-4 rounded" />
                        <div className="w-16 h-1 bg-white/20 mx-auto rounded" />
                      </div>
                    </div>
                    
                    {/* Selected Check */}
                    {selectedTemplate?.id === template.id && (
                      <div className="absolute top-3 right-3 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">
                        <HiCheck className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-white text-sm">
                        {selectedTemplate?.id === template.id ? 'Selected' : 'Select'}
                      </span>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-3 bg-dark-200">
                    <h4 className="font-medium text-white truncate text-sm">{template.name}</h4>
                    <p className="text-xs text-gray-500 capitalize">{template.style}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectTemplate;
