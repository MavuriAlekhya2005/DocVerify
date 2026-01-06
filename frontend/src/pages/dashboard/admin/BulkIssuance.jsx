import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
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
  HiTemplate
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const BulkIssuance = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [processingState, setProcessingState] = useState(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setCsvFile(file);
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData(results.data.slice(0, 10)); // Preview first 10
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
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const downloadTemplate = () => {
    const template = `name,email,certificate_type,title,issue_date,grade,description
John Doe,john@example.com,degree,Bachelor of Computer Science,2024-05-15,A,Completed with honors
Jane Smith,jane@example.com,certification,AWS Solutions Architect,2024-03-20,Pass,Professional certification
Bob Wilson,bob@example.com,course,Machine Learning Specialization,2024-01-10,95%,Coursera completion`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificate_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  const startBulkIssuance = async () => {
    setProcessingState('processing');
    setProgress(0);

    // Simulate processing each certificate
    const totalRecords = parsedData.length;
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 50));
      setProgress(i);
    }

    // Simulate Merkle tree generation
    setProcessingState('merkle');
    await new Promise(r => setTimeout(r, 1500));

    // Simulate blockchain anchoring
    setProcessingState('blockchain');
    await new Promise(r => setTimeout(r, 2000));

    // Complete
    setProcessingState('complete');
    setResults({
      total: totalRecords,
      successful: totalRecords - 1,
      failed: 1,
      merkleRoot: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      transactionHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      gasSaved: '97.5%',
    });

    toast.success('Bulk issuance completed!');
  };

  const reset = () => {
    setCsvFile(null);
    setParsedData([]);
    setProcessingState(null);
    setProgress(0);
    setResults(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Bulk Document Issuance</h1>
        <p className="text-gray-400">Issue up to 500 documents at once via CSV upload with Merkle batch anchoring</p>
      </div>

      <AnimatePresence mode="wait">
        {!processingState ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-dark-100/50 rounded-xl border border-white/10 p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                  <HiUsers className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Up to 500</h3>
                  <p className="text-gray-400 text-sm">Certificates per batch</p>
                </div>
              </div>
              <div className="bg-dark-100/50 rounded-xl border border-white/10 p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-600/20 flex items-center justify-center flex-shrink-0">
                  <HiCube className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Merkle Batching</h3>
                  <p className="text-gray-400 text-sm">Single blockchain transaction</p>
                </div>
              </div>
              <div className="bg-dark-100/50 rounded-xl border border-white/10 p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center flex-shrink-0">
                  <HiLightningBolt className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">99% Gas Savings</h3>
                  <p className="text-gray-400 text-sm">Compared to individual issuance</p>
                </div>
              </div>
            </div>

            {/* Template Download */}
            <div className="bg-primary-600/10 border border-primary-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HiTemplate className="w-6 h-6 text-primary-400" />
                <div>
                  <p className="text-white font-medium">Download CSV Template</p>
                  <p className="text-gray-400 text-sm">Use our template to ensure correct formatting</p>
                </div>
              </div>
              <button onClick={downloadTemplate} className="btn-secondary py-2 text-sm">
                <HiDownload className="w-4 h-4 mr-2 inline" />
                Download
              </button>
            </div>

            {/* Upload Zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                ${isDragActive 
                  ? 'border-primary-500 bg-primary-500/10' 
                  : csvFile 
                    ? 'border-accent-500 bg-accent-500/10'
                    : 'border-white/20 hover:border-primary-500/50 bg-dark-100/30'
                }`}
            >
              <input {...getInputProps()} />
              
              {csvFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-4 rounded-2xl bg-accent-600/20 flex items-center justify-center">
                    <HiCheckCircle className="w-8 h-8 text-accent-400" />
                  </div>
                  <p className="text-white text-lg mb-2">{csvFile.name}</p>
                  <p className="text-gray-400 text-sm mb-4">
                    {parsedData.length} records found • {(csvFile.size / 1024).toFixed(2)} KB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                    className="text-gray-400 hover:text-white flex items-center gap-2"
                  >
                    <HiX className="w-4 h-4" />
                    Remove and upload different file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 
                    flex items-center justify-center">
                    <HiCloudUpload className="w-8 h-8 text-primary-400" />
                  </div>
                  {isDragActive ? (
                    <p className="text-white text-lg">Drop your CSV file here...</p>
                  ) : (
                    <>
                      <p className="text-white text-lg mb-2">Drag & drop your CSV file here</p>
                      <p className="text-gray-400 text-sm mb-4">or click to browse your files</p>
                      <p className="text-gray-500 text-xs">Maximum 500 records per file</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Data Preview */}
            {parsedData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dark-100/50 rounded-2xl border border-white/10 overflow-hidden"
              >
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HiTable className="w-5 h-5 text-primary-400" />
                    <h3 className="text-white font-semibold">Data Preview</h3>
                  </div>
                  <span className="text-gray-400 text-sm">Showing first 10 records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/5">
                        {Object.keys(parsedData[0] || {}).map((header) => (
                          <th key={header} className="text-left px-4 py-3 text-gray-400 text-sm font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.map((row, index) => (
                        <tr key={index} className="border-t border-white/5">
                          {Object.values(row).map((value, i) => (
                            <td key={i} className="px-4 py-3 text-gray-300 text-sm">
                              {String(value).substring(0, 30)}{String(value).length > 30 ? '...' : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-white/10">
                  <button onClick={startBulkIssuance} className="w-full btn-primary">
                    Start Bulk Issuance ({parsedData.length} certificates)
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : processingState !== 'complete' ? (
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
        ) : (
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
