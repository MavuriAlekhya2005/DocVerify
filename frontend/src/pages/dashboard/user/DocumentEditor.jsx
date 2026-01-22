/**
 * Document Editor Page - Standalone WYSIWYG Editor Window
 * Reads template data from localStorage
 * Generates Document ID upfront for QR/Barcode embedding
 */
import { useState, useEffect, useMemo } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { HiX, HiSave, HiDownload, HiCheckCircle, HiClipboardCopy } from 'react-icons/hi';
import { v4 as uuidv4 } from 'uuid';
import WYSIWYGEditor from '../../../components/wysiwyg/WYSIWYGEditor';
import api from '../../../services/api';

// Generate document ID in the same format as backend
const generateDocumentId = () => `DOC-${uuidv4().split('-')[0].toUpperCase()}`;

const DocumentEditor = () => {
  const [templateData, setTemplateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDocument, setSavedDocument] = useState(null);
  
  // Generate document ID once when component mounts
  const documentId = useMemo(() => generateDocumentId(), []);

  useEffect(() => {
    // Read from localStorage
    const stored = localStorage.getItem('docverify_editor_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Check if data is recent (within last 5 minutes)
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          setTemplateData(data);
        }
      } catch (e) {
        console.error('Failed to parse editor data:', e);
      }
    }
    setLoading(false);
  }, []);

  const handleSave = async (payload) => {
    setIsSaving(true);
    try {
      const { documentType, template } = templateData;
      
      // Call backend API to save the document with pre-generated ID
      const result = await api.saveWYSIWYGDocument({
        documentId,
        canvasData: payload.canvasData,
        preview: payload.preview,
        documentType: documentType,
        templateId: template?.id || 'custom',
        templateName: template?.name || 'Custom Document',
        codeType: payload.codeType || 'qr',
      });
      
      if (result.success) {
        setSavedDocument(result.data);
        toast.success('Document saved successfully!');
        
        // Clear localStorage after save
        localStorage.removeItem('docverify_editor_data');
      } else {
        throw new Error(result.message || 'Failed to save document');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (format, dataUrl) => {
    if (format === 'png' && dataUrl) {
      const link = document.createElement('a');
      link.download = `${documentId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Document exported as PNG');
    }
  };

  const handleClose = () => {
    if (savedDocument || window.confirm('Close editor? Unsaved changes will be lost.')) {
      localStorage.removeItem('docverify_editor_data');
      window.close();
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!templateData) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">No Template Selected</h2>
          <p className="text-gray-400 mb-6">Please select a template from the dashboard first.</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  // Show success screen after saving
  if (savedDocument) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <Toaster position="top-center" />
        <div className="max-w-md w-full mx-4 bg-gray-800 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiCheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Document Saved!</h2>
          <p className="text-gray-400 mb-6">Your document has been created and saved successfully.</p>
          
          <div className="bg-gray-700/50 rounded-xl p-4 mb-6 text-left space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Document ID</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-sm">{savedDocument.documentId}</span>
                <button 
                  onClick={() => copyToClipboard(savedDocument.documentId, 'Document ID')}
                  className="text-gray-400 hover:text-white"
                >
                  <HiClipboardCopy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Access Key</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-sm">{savedDocument.accessKey}</span>
                <button 
                  onClick={() => copyToClipboard(savedDocument.accessKey, 'Access Key')}
                  className="text-gray-400 hover:text-white"
                >
                  <HiClipboardCopy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Verify URL</span>
              <a 
                href={savedDocument.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-sm hover:underline truncate max-w-[180px]"
              >
                Open Link
              </a>
            </div>
          </div>
          
          {/* QR Code */}
          {savedDocument.qrCode && (
            <div className="mb-6">
              <img 
                src={savedDocument.qrCode} 
                alt="QR Code" 
                className="w-32 h-32 mx-auto rounded-lg bg-white p-2"
              />
              <p className="text-xs text-gray-500 mt-2">Scan to verify document</p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.open(savedDocument.verifyUrl, '_blank')}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Document
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { documentType, template } = templateData;

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Toaster position="top-center" />
      
      {/* Top Bar */}
      <div className="h-14 bg-gray-800 border-b border-gray-700 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-medium">
              {template?.name || 'New Document'}
            </h1>
            <p className="text-xs text-gray-500 capitalize">
              {documentType?.replace('_', ' ')} • <span className="font-mono">{documentId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {template && (
            <div 
              className="w-8 h-8 rounded border border-gray-600"
              style={{
                background: `linear-gradient(135deg, ${template.colors?.primary || '#333'} 0%, ${template.colors?.secondary || '#666'} 100%)`,
              }}
              title={template.name}
            />
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <WYSIWYGEditor
          template={template}
          documentType={documentType}
          documentId={documentId}
          onSave={handleSave}
          onExport={handleExport}
        />
      </div>

      {/* Saving Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-white">Saving document...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;
