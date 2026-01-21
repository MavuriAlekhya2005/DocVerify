/**
 * Create Document Page - WYSIWYG Editor Integration
 * Full-featured document creation with visual editor
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { WYSIWYGEditor } from '../../../components/wysiwyg';
import api from '../../../services/api';

const CreateDocument = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentType = searchParams.get('type') || 'certificate';
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (documentPayload) => {
    setIsSaving(true);
    
    try {
      // Prepare data for API
      const apiPayload = {
        documentId: documentPayload.id,
        documentType: documentPayload.type,
        canvasData: documentPayload.canvasData,
        fields: documentPayload.fields,
        // Generate access key on client for immediate use
        accessKey: Math.random().toString(36).substr(2, 12).toUpperCase(),
      };

      // Save to backend (which will also register on blockchain)
      const response = await api.createWYSIWYGDocument(apiPayload);

      if (response.success) {
        toast.success('Document created and registered on blockchain!');
        
        // Show blockchain info if available
        if (response.data.blockchain) {
          toast.success(`Blockchain TX: ${response.data.blockchain.transactionHash.slice(0, 10)}...`, {
            duration: 5000,
          });
        }

        // Navigate to document details or dashboard
        navigate(`/dashboard/documents/${response.data.documentId}`);
      } else {
        throw new Error(response.message || 'Failed to save document');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Confirm if there are unsaved changes
    if (window.confirm('Are you sure you want to close? Unsaved changes will be lost.')) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="h-screen">
      <WYSIWYGEditor
        documentType={documentType}
        onSave={handleSave}
        onClose={handleClose}
      />
      
      {/* Saving overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-accent-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-white">Saving document & registering on blockchain...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateDocument;
