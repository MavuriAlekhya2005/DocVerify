import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiArrowLeft } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Logo from '../../components/Logo';
import api from '../../services/api';
import GlobalBackground from '../../components/animations/GlobalBackground/GlobalBackground';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await api.login(formData.email, formData.password);

      if (result.success) {
        toast.success('Welcome back!');
        const user = result.data.user;

        // Navigate based on role
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'verifier') {
          navigate('/verifier');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.message || 'Login failed');
        toast.error(result.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Redirect to backend OAuth
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-transparent flex">
      {/* Galaxy Background */}
      <GlobalBackground />
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-accent-600/10"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        <div className="relative z-10 flex items-center justify-center p-12">
          <div className="max-w-lg">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <Logo className="h-12 w-12" />
              <span className="text-2xl font-bold text-white font-display">DocVerify</span>
            </Link>

            <h2 className="text-4xl font-bold text-white font-display mb-6">
              Welcome Back to
              <span className="gradient-text block">Secure Verification</span>
            </h2>
            <p className="text-gray-400">
              Access your documents and continue securing your important files with blockchain technology.
            </p>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-accent-600/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Back to Home */}
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
            <HiArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>
            <p className="text-gray-400">Access your DocVerify account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-3 py-3 px-4 bg-white/5
                border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
            >
              <FcGoogle size={20} />
              <span className="text-sm font-medium">Google</span>
            </button>
            <button
              onClick={() => handleSocialLogin('github')}
              className="flex items-center justify-center gap-3 py-3 px-4 bg-white/5
                border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
            >
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
                Password
              </label>
              <div className="relative">
                <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-600
                    focus:ring-primary-500 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-primary-400 hover:text-primary-300 text-sm font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
