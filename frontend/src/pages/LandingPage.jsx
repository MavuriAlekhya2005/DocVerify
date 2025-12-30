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
  HiCheckCircle
} from 'react-icons/hi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FeatureCard from '../components/FeatureCard';
import StepCard from '../components/StepCard';
import PricingCard from '../components/PricingCard';
import StatCard from '../components/StatCard';

const LandingPage = () => {
  const features = [
    {
      icon: HiChip,
      title: 'AI Forgery Detection',
      description: 'Advanced deep learning models detect image manipulation, tampered text, and suspicious modifications with high accuracy.',
    },
    {
      icon: HiCube,
      title: 'Blockchain Verification',
      description: 'Immutable SHA-256 hashes stored on blockchain ensure certificates cannot be forged or altered after issuance.',
    },
    {
      icon: HiQrcode,
      title: 'Instant QR Verification',
      description: 'Generate unique QR codes for each certificate enabling instant verification from any device, anywhere.',
    },
    {
      icon: HiLockClosed,
      title: 'Secure Access Keys',
      description: 'Private access keys ensure only authorized parties can view full certificate details and documents.',
    },
    {
      icon: HiDocumentDuplicate,
      title: 'Bulk Issuance',
      description: 'Issue up to 500 certificates at once via CSV upload with Merkle tree batch anchoring for cost efficiency.',
    },
    {
      icon: HiCloud,
      title: 'Cloud Storage',
      description: 'Secure cloud storage with encryption ensures your certificates are always accessible and protected.',
    },
  ];

  const steps = [
    {
      title: 'Upload Certificate',
      description: 'Upload your certificate in PDF or image format. Our system accepts various document types.',
    },
    {
      title: 'AI Analysis',
      description: 'Our AI model analyzes the document for any signs of tampering, manipulation, or forgery.',
    },
    {
      title: 'Hash Generation',
      description: 'A unique SHA-256 hash is generated and grouped into a Merkle tree for efficient blockchain storage.',
    },
    {
      title: 'Blockchain Anchoring',
      description: 'The Merkle root is permanently stored on the blockchain, creating an immutable proof of authenticity.',
    },
    {
      title: 'QR Code Generation',
      description: 'A unique QR code and secure access key are generated for instant verification and controlled access.',
    },
    {
      title: 'Instant Verification',
      description: 'Anyone can scan the QR code to verify authenticity, with full access requiring the private key.',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: 0,
      description: 'Perfect for individuals',
      features: [
        'Up to 10 certificates/month',
        'AI forgery detection',
        'Basic blockchain verification',
        'QR code generation',
        'Email support',
      ],
    },
    {
      name: 'Professional',
      price: 49,
      description: 'For small organizations',
      isPopular: true,
      features: [
        'Up to 500 certificates/month',
        'Advanced AI analysis',
        'Merkle batch anchoring',
        'Bulk CSV issuance',
        'API access',
        'Priority support',
        'Custom branding',
      ],
    },
    {
      name: 'Enterprise',
      price: 199,
      description: 'For large institutions',
      features: [
        'Unlimited certificates',
        'Dedicated blockchain node',
        'Advanced analytics',
        'Multi-admin support',
        'SLA guarantee',
        '24/7 phone support',
        'On-premise deployment',
        'Custom integrations',
      ],
    },
  ];

  const stats = [
    { value: '10M+', label: 'Certificates Verified', icon: HiDocumentText },
    { value: '5000+', label: 'Institutions', icon: HiUserGroup },
    { value: '99.9%', label: 'Uptime', icon: HiLightningBolt },
    { value: '150+', label: 'Countries', icon: HiGlobe },
  ];

  return (
    <div className="min-h-screen bg-dark-300">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-600/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] 
            bg-gradient-to-r from-primary-600/10 to-accent-600/10 rounded-full blur-3xl"></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:100px_100px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 bg-primary-600/10 border border-primary-500/20 
                rounded-full px-4 py-2 text-sm text-primary-400 mb-8">
                <HiShieldCheck className="w-4 h-4" />
                Trusted by 5000+ institutions worldwide
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-white font-display mb-6 leading-tight"
            >
              Secure Certificate
              <br />
              <span className="gradient-text">Verification System</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              Combine AI-powered forgery detection with blockchain immutability 
              to create tamper-proof certificates that can be instantly verified by anyone, anywhere.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/register" className="btn-primary text-lg px-8 py-4">
                Start Issuing Certificates
              </Link>
              <Link to="/verify/demo" className="btn-secondary text-lg px-8 py-4">
                Try Verification Demo
              </Link>
            </motion.div>

            {/* Hero Image/Animation */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-20 relative"
            >
              <div className="relative mx-auto max-w-4xl">
                <div className="absolute inset-0 bg-gradient-to-t from-dark-300 via-transparent to-transparent z-10"></div>
                <div className="bg-dark-100/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 h-8 bg-dark-200/50 rounded-lg"></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {/* Certificate Preview */}
                    <div className="col-span-2 bg-white/5 rounded-xl p-6 border border-white/10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600"></div>
                        <div>
                          <div className="h-4 w-32 bg-white/20 rounded mb-2"></div>
                          <div className="h-3 w-24 bg-white/10 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-3 bg-white/10 rounded w-full"></div>
                        <div className="h-3 bg-white/10 rounded w-4/5"></div>
                        <div className="h-3 bg-white/10 rounded w-3/5"></div>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HiCheckCircle className="w-6 h-6 text-accent-500" />
                          <span className="text-accent-400 font-medium">Verified</span>
                        </div>
                        <div className="w-16 h-16 bg-white rounded-lg p-2">
                          <div className="w-full h-full bg-dark-200 rounded"></div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Panel */}
                    <div className="space-y-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <HiShieldCheck className="w-8 h-8 text-accent-500 mb-2" />
                        <div className="text-2xl font-bold text-white">99.8%</div>
                        <div className="text-sm text-gray-400">Accuracy</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <HiCube className="w-8 h-8 text-primary-400 mb-2" />
                        <div className="text-2xl font-bold text-white">On-Chain</div>
                        <div className="text-sm text-gray-400">Verified</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <HiLightningBolt className="w-8 h-8 text-yellow-400 mb-2" />
                        <div className="text-2xl font-bold text-white">&lt;2s</div>
                        <div className="text-sm text-gray-400">Verify Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 font-semibold text-sm uppercase tracking-wider">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white font-display mt-4 mb-6">
              Everything You Need for
              <br />
              <span className="gradient-text">Secure Verification</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Our comprehensive platform combines cutting-edge AI, blockchain technology, 
              and cloud infrastructure to deliver unmatched security and convenience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={index * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-dark-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 font-semibold text-sm uppercase tracking-wider">Process</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white font-display mt-4 mb-6">
              How It Works
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From upload to verification in six simple steps. Our streamlined process 
              ensures maximum security with minimal effort.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-0">
              {steps.map((step, index) => (
                <StepCard
                  key={index}
                  number={index + 1}
                  {...step}
                  isLast={index === steps.length - 1}
                />
              ))}
            </div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="sticky top-32"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-600/20 to-accent-600/20 rounded-3xl blur-xl"></div>
                <div className="relative bg-dark-100/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">Merkle Tree Batching</h3>
                    <p className="text-gray-400">How we achieve scalability</p>
                  </div>
                  
                  {/* Merkle Tree Visualization */}
                  <div className="flex flex-col items-center space-y-4">
                    {/* Root */}
                    <div className="w-24 h-12 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg 
                      flex items-center justify-center text-white font-bold text-sm">
                      Merkle Root
                    </div>
                    
                    {/* Connectors */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-0.5 bg-primary-500/50 rotate-45 origin-right"></div>
                      <div className="w-12 h-0.5 bg-primary-500/50 -rotate-45 origin-left"></div>
                    </div>

                    {/* Level 2 */}
                    <div className="flex gap-8">
                      <div className="w-20 h-10 bg-primary-600/50 rounded-lg flex items-center justify-center text-white text-xs font-medium">
                        Hash 1-2
                      </div>
                      <div className="w-20 h-10 bg-primary-600/50 rounded-lg flex items-center justify-center text-white text-xs font-medium">
                        Hash 3-4
                      </div>
                    </div>

                    {/* Level 3 */}
                    <div className="flex gap-4">
                      {['Cert 1', 'Cert 2', 'Cert 3', 'Cert 4'].map((cert, i) => (
                        <div key={i} className="w-16 h-10 bg-white/10 rounded-lg flex items-center justify-center 
                          text-gray-300 text-xs border border-white/10">
                          {cert}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-accent-600/10 rounded-xl border border-accent-500/20">
                    <div className="flex items-center gap-3">
                      <HiCheckCircle className="w-6 h-6 text-accent-500 flex-shrink-0" />
                      <p className="text-sm text-gray-300">
                        <span className="text-accent-400 font-semibold">500 certificates</span> anchored in a 
                        single blockchain transaction, reducing gas fees by up to <span className="text-accent-400 font-semibold">99%</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary-400 font-semibold text-sm uppercase tracking-wider">Security</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white font-display mt-4 mb-6">
                Multi-Layer
                <br />
                <span className="gradient-text">Security Architecture</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Our platform employs multiple security layers to ensure your certificates 
                are protected from tampering, unauthorized access, and forgery.
              </p>

              <div className="space-y-6">
                {[
                  { title: 'AI Verification', desc: 'Deep learning models analyze every pixel for signs of manipulation' },
                  { title: 'Blockchain Immutability', desc: 'Once recorded, certificate hashes cannot be altered or deleted' },
                  { title: 'End-to-End Encryption', desc: 'All data is encrypted in transit and at rest using AES-256' },
                  { title: 'Access Control', desc: 'Private keys ensure only authorized parties can view documents' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 
                      flex items-center justify-center flex-shrink-0">
                      <HiCheckCircle className="w-5 h-5 text-accent-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-600/10 to-accent-600/10 rounded-3xl blur-2xl"></div>
              <div className="relative bg-dark-100/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400">Security Score</span>
                      <span className="text-accent-400 font-bold">A+</span>
                    </div>
                    <div className="h-3 bg-dark-200 rounded-full overflow-hidden">
                      <div className="h-full w-[98%] bg-gradient-to-r from-primary-600 to-accent-600 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                    <HiLockClosed className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                    <div className="text-white font-bold">AES-256</div>
                    <div className="text-gray-400 text-sm">Encryption</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                    <HiCube className="w-8 h-8 text-accent-400 mx-auto mb-2" />
                    <div className="text-white font-bold">SHA-256</div>
                    <div className="text-gray-400 text-sm">Hashing</div>
                  </div>
                  
                  <div className="col-span-2 bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-accent-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-300 text-sm">Real-time threat monitoring active</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-dark-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 font-semibold text-sm uppercase tracking-wider">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white font-display mt-4 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include our core 
              AI verification and blockchain anchoring features.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} {...plan} delay={index * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-accent-600/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-gradient-to-r from-primary-600/10 to-accent-600/10 rounded-3xl 
              border border-white/10 p-12 md:p-16 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white font-display mb-6">
                Ready to Secure Your Certificates?
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
                Join thousands of institutions already using DocVerify to issue 
                tamper-proof, instantly verifiable certificates.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="btn-primary text-lg px-8 py-4">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                  Contact Sales
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
