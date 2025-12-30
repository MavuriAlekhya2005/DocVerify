import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiUser, HiOfficeBuilding } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import Logo from '../../components/Logo';

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    organization: '',
    agreeTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate registration
    setTimeout(() => {
      setIsLoading(false);
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-dark-300 flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-accent-600/20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        <div className="relative z-10 flex items-center justify-center p-12">
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold text-white font-display mb-6">
              Start Securing Your
              <span className="gradient-text"> Certificates Today</span>
            </h2>
            <p className="text-gray-400 mb-8">
              Join thousands of institutions using DocVerify to issue tamper-proof, 
              blockchain-verified certificates with AI forgery detection.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '10M+', label: 'Certificates' },
                { value: '5000+', label: 'Institutions' },
                { value: '99.9%', label: 'Accuracy' },
                { value: '<2s', label: 'Verification' },
              ].map((stat, index) => (
                <div key={index} className="bg-dark-100/50 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-accent-600/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md py-8"
        >
          <Link to="/" className="flex items-center gap-2 mb-12">
            <Logo className="h-10 w-10" />
            <span className="text-xl font-bold text-white font-display">DocVerify</span>
          </Link>

          <h1 className="text-3xl font-bold text-white mb-2">Create an account</h1>
          <p className="text-gray-400 mb-8">Get started with your free account</p>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button className="flex items-center justify-center gap-3 py-3 px-4 bg-white/5 
              border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all">
              <FcGoogle size={20} />
              <span className="text-sm font-medium">Google</span>
            </button>
            <button className="flex items-center justify-center gap-3 py-3 px-4 bg-white/5 
              border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all">
              <FaGithub size={20} />
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-gray-500 text-sm">or continue with email</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="input-field-dark pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="input-field-dark pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'user', label: 'Individual' },
                  { value: 'institution', label: 'Institution' },
                  { value: 'verifier', label: 'Verifier' },
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                    className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                      formData.role === role.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:border-primary-500/50'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.role === 'institution' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization Name
                </label>
                <div className="relative">
                  <HiOfficeBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="Enter organization name"
                    className="input-field-dark pl-12"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="input-field-dark pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Must be at least 8 characters with a number and symbol
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="input-field-dark pl-12"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="w-4 h-4 mt-1 rounded border-white/20 bg-white/5 text-primary-600 
                  focus:ring-primary-500 focus:ring-offset-0"
                required
              />
              <span className="text-sm text-gray-400">
                I agree to the{' '}
                <a href="#" className="text-primary-400 hover:text-primary-300">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary-400 hover:text-primary-300">Privacy Policy</a>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
