/**
 * AI Document Analyzer Component
 * Extracts fields from uploaded documents using AI
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiCloudUpload,
  HiDocumentText,
  HiLightningBolt,
  HiCheckCircle,
  HiExclamationCircle,
  HiRefresh,
  HiX,
} from 'react-icons/hi';
import api from '../../services/api';

const AIDocumentAnalyzer = ({
  onFieldsExtracted,
  onDocumentTypeDetected,
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'],
  className = '',
}) => {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [aiStatus, setAIStatus] = useState(null);

  // Check AI status on mount
  useState(() => {
    api.getAIStatus().then(result => {
      if (result.success) {
        setAIStatus(result.data);
      }
    }).catch(() => {});
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setExtractedData(null);
    setIsAnalyzing(true);

    try {
      // First, upload the file to get text extraction
      const formData = new FormData();
      formData.append('document', uploadedFile);

      const uploadResult = await api.upload(uploadedFile);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      // Now use AI to extract fields
      const extractResult = await api.aiExtract(
        null, 
        null, 
        uploadResult.data.filePath
      );

      if (extractResult.success) {
        setExtractedData(extractResult.data);
        
        // Notify parent components
        if (onDocumentTypeDetected) {
          onDocumentTypeDetected(extractResult.data.documentType);
        }
        
        if (onFieldsExtracted) {
          onFieldsExtracted(extractResult.data.fields);
        }
      } else {
        throw new Error(extractResult.message || 'AI extraction failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [onFieldsExtracted, onDocumentTypeDetected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {}),
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isAnalyzing,
  });

  const reset = () => {
    setFile(null);
    setExtractedData(null);
    setError(null);
  };

  const retryAnalysis = () => {
    if (file) {
      onDrop([file]);
    }
  };

  return (
    <div className={`${className}`}>
      {/* AI Status Badge */}
      {aiStatus && (
        <div className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          aiStatus.available
            ? 'bg-accent-600/20 text-accent-400'
            : 'bg-yellow-600/20 text-yellow-400'
        }`}>
          <HiLightningBolt className="w-4 h-4" />
          {aiStatus.available 
            ? `AI Powered (${aiStatus.provider})`
            : 'Using Basic Extraction'
          }
        </div>
      )}

      {/* Drop Zone */}
      {!file && !extractedData && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-white/20 hover:border-primary-500/50 hover:bg-white/5'
          }`}
        >
          <input {...getInputProps()} />
          <HiCloudUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-white font-medium mb-2">
            {isDragActive ? 'Drop your document here' : 'Upload document for AI analysis'}
          </p>
          <p className="text-gray-400 text-sm">
            Supports PDF, JPG, PNG (max 10MB)
          </p>
          <p className="text-primary-400 text-xs mt-2">
            AI will automatically detect document type and extract fields
          </p>
        </div>
      )}

      {/* Analyzing State */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-dark-100/50 rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center">
                  <HiDocumentText className="w-6 h-6 text-primary-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-dark-200 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{file?.name}</p>
                <p className="text-gray-400 text-sm">Analyzing with AI...</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              {['Extracting text...', 'Detecting document type...', 'Identifying fields...'].map((step, idx) => (
                <div key={step} className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    idx === 0 ? 'border-accent-400 bg-accent-400' :
                    idx === 1 ? 'border-primary-400 animate-pulse' :
                    'border-gray-600'
                  }`} />
                  <span className={idx < 2 ? 'text-gray-300' : 'text-gray-500'}>{step}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-600/10 border border-red-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center">
              <HiExclamationCircle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Analysis Failed</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={retryAnalysis} className="btn-secondary text-sm">
              <HiRefresh className="w-4 h-4 mr-2" />
              Retry
            </button>
            <button onClick={reset} className="btn-secondary text-sm">
              <HiX className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Success State */}
      {extractedData && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent-600/10 border border-accent-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent-600/20 flex items-center justify-center">
              <HiCheckCircle className="w-6 h-6 text-accent-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Analysis Complete</p>
              <p className="text-accent-400 text-sm">
                Detected: {extractedData.schema} ({extractedData.confidence}% confidence)
              </p>
            </div>
            <button onClick={reset} className="text-gray-400 hover:text-white">
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Extracted Fields Preview */}
          <div className="space-y-2">
            <p className="text-gray-400 text-sm font-medium">Extracted Fields:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(extractedData.fields || {})
                .filter(([_, field]) => field.extracted)
                .slice(0, 6)
                .map(([key, field]) => (
                  <div key={key} className="bg-white/5 rounded-lg px-3 py-2">
                    <p className="text-gray-400 text-xs">{field.label}</p>
                    <p className="text-white text-sm truncate">{field.value}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Suggestions */}
          {extractedData.suggestions?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <HiExclamationCircle className="w-4 h-4" />
                {extractedData.suggestions.length} field(s) need manual input
              </p>
            </div>
          )}

          {extractedData.aiProcessed && (
            <div className="mt-4 flex items-center gap-2 text-xs text-primary-400">
              <HiLightningBolt className="w-3 h-3" />
              Processed with AI
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AIDocumentAnalyzer;
