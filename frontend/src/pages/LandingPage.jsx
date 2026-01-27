import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiShieldCheck,
  HiDocumentText,
  HiQrcode,
  HiLockClosed,
  HiLightningBolt,
  HiGlobe,
  HiChip,
  HiCube,
  HiCloud,
  HiUserGroup,
  HiDocumentDuplicate,
  HiCheckCircle,
  HiArrowRight
} from 'react-icons/hi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlobalBackground from '../components/animations/GlobalBackground/GlobalBackground';

const LandingPage = () => {
  const features = [
    {
      icon: HiChip,
      title: 'Document Analysis',
      description: 'Extract and categorize document information using intelligent text recognition and pattern matching.',
    },
    {
      icon: HiCube,
      title: 'Blockchain Security',
      description: 'Store document hashes on blockchain for immutable proof of authenticity and tamper detection.',
    },
    {
      icon: HiQrcode,
      title: 'QR Verification',
      description: 'Generate QR codes for instant document verification from any device without additional software.',
    },
    {
      icon: HiLockClosed,
      title: 'Access Control',
      description: 'Control document access with private keys, ensuring only authorized parties can view full details.',
    },
    {
      icon: HiDocumentDuplicate,
      title: 'Batch Processing',
      description: 'Process multiple documents efficiently with CSV upload and automated batch operations.',
      comingSoon: true,
    },
    {
      icon: HiCloud,
      title: 'Secure Storage',
      description: 'Store documents securely in the cloud with encryption and controlled access management.',
    },
  ];

  const steps = [
    {
      title: 'Upload Document',
      description: 'Upload your PDF or image document through our secure interface.',
    },
    {
      title: 'Process & Analyze',
      description: 'Our system extracts key information and generates a unique document hash.',
    },
    {
      title: 'Blockchain Storage',
      description: 'Document hash is stored on blockchain for permanent verification capability.',
    },
    {
      title: 'Generate Access',
      description: 'Create QR codes and access keys for secure document sharing and verification.',
    },
  ];

  const stats = [
    { value: '1000+', label: 'Documents Secured', icon: HiDocumentText },
    { value: '50+', label: 'Organizations', icon: HiUserGroup },
    { value: '99.9%', label: 'Uptime', icon: HiLightningBolt },
    { value: '24/7', label: 'Verification', icon: HiGlobe },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      {/* Galaxy Background */}
      <GlobalBackground />
      
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:100px_100px]"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Secure Your
              <span className="gradient-text block">Documents</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Protect and verify your important documents with blockchain technology and intelligent document processing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2">
                Get Started Free
                <HiArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/verify" className="btn-secondary text-lg px-8 py-4">
                Verify Document
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary-600/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-accent-600/10 rounded-full blur-xl animate-float animation-delay-2000"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How DocVerify Works</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              A simple, secure process to protect your documents from forgery and ensure authenticity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-dark-100/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 hover:border-primary-500/50 transition-all"
              >
                <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  {feature.comingSoon && (
                    <span className="px-2 py-1 text-xs bg-accent-600/20 text-accent-400 rounded-full border border-accent-500/30">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-300 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
