import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiUser, HiOfficeBuilding, HiShieldCheck, HiArrowLeft } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Logo from '../../components/Logo';
import api from '../../services/api';
import GlobalBackground from '../../components/animations/GlobalBackground/GlobalBackground';

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
  const [error, setError] = useState('');

  // OTP states
  const [step, setStep] = useState(1); // 1: form, 2: OTP verification
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Send OTP
  const sendOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }

    setOtpSending(true);
    setError('');

    try {
      const result = await api.sendOTP(formData.email, 'registration');
      if (result.success) {
        toast.success('OTP sent to your email!');
        setStep(2);
        setCountdown(60); // 60 second countdown for resend
      } else {
        setError(result.message || 'Failed to send OTP');
        toast.error(result.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      toast.error('Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await api.verifyOTP(formData.email, otpString, 'registration');
      if (result.success) {
        toast.success('Email verified!');
        setOtpVerified(true);
        // Now complete registration
        await completeRegistration(otpString);
      } else {
        setError(result.message || 'Invalid OTP');
        toast.error(result.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP');
      toast.error('Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete registration after OTP verification
  const completeRegistration = async (verifiedOtp) => {
    try {
      const result = await api.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        organization: formData.organization,
        otp: verifiedOtp,
      });

      if (result.success) {
        toast.success('Registration successful!');
        navigate('/login');
      } else {
        setError(result.message || 'Registration failed');
        toast.error(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      toast.error('Registration failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Validate terms agreement
    if (!formData.agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    // Send OTP for verification
    await sendOTP();
  };

  const handleSocialRegister = (provider) => {
    // Redirect to backend OAuth
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-transparent flex">
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
              Join DocVerify for
              <span className="gradient-text block">Secure Documents</span>
            </h2>
            <p className="text-gray-400">
              Create your account and start securing your important documents with blockchain technology.
            </p>
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
          {/* Back to Home */}
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
            <HiArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>

          {step === 1 ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                <p className="text-gray-400">Get started with your free account</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Social Register */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => handleSocialRegister('google')}
                  className="flex items-center justify-center gap-3 py-3 px-4 bg-white/5
                    border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
                >
                  <FcGoogle size={20} />
                  <span className="text-sm font-medium">Google</span>
                </button>
                <button
                  onClick={() => handleSocialRegister('github')}
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
                    Must be at least 8 characters long
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
                  disabled={isLoading || otpSending}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {otpSending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Sending Verification...
                    </>
                  ) : (
                    'Continue with Email Verification'
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            /* Step 2: OTP Verification */
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600/20 flex items-center justify-center">
                  <HiShieldCheck className="w-8 h-8 text-primary-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
                <p className="text-gray-400">
                  We've sent a 6-digit code to<br />
                  <span className="text-white font-medium">{formData.email}</span>
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              {/* OTP Input */}
              <div className="flex justify-center gap-3 mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-12 h-14 text-center text-2xl font-bold bg-dark-100/50 border border-white/20
                      rounded-xl text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                      transition-all outline-none"
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                onClick={verifyOTP}
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full btn-primary flex items-center justify-center gap-2 mb-4"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-gray-500 text-sm">
                    Resend code in <span className="text-primary-400">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={sendOTP}
                    disabled={otpSending}
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                  >
                    {otpSending ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>

              {/* Back Button */}
              <button
                onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(''); }}
                className="w-full mt-6 text-gray-400 hover:text-white text-sm"
              >
                ← Back to registration form
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
