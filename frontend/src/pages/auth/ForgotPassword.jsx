import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiArrowLeft, HiCheckCircle, HiLockClosed, HiKey } from 'react-icons/hi';
import Logo from '../../components/Logo';
import api from '../../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password, 4: success

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await api.sendOTP(email, 'password-reset');
      if (result.success) {
        setStep(2);
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await api.verifyOTP(email, otp, 'password-reset');
      if (result.success) {
        setStep(3);
      } else {
        setError(result.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.resetPassword(email, otp, newPassword);
      if (result.success) {
        setStep(4);
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await api.sendOTP(email, 'password-reset');
      if (result.success) {
        setError('');
        setOtp('');
      } else {
        setError(result.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-300 flex items-center justify-center p-8">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-dark-100/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <Logo className="h-10 w-10" />
            <span className="text-xl font-bold text-white font-display">DocVerify</span>
          </Link>

          {/* Step 1: Enter Email */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Forgot your password?</h1>
              <p className="text-gray-400 mb-8">
                No worries! Enter your email address and we'll send you a verification code.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="input-field-dark pl-12"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Enter verification code</h1>
              <p className="text-gray-400 mb-8">
                We've sent a 6-digit code to <span className="text-white">{email}</span>
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <HiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="input-field-dark pl-12 tracking-widest text-center text-lg"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <p className="text-sm text-gray-500 text-center">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-primary-400 hover:text-primary-300"
                  >
                    Resend
                  </button>
                </p>
              </form>
            </>
          )}

          {/* Step 3: Set New Password */}
          {step === 3 && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Set new password</h1>
              <p className="text-gray-400 mb-8">
                Create a strong password for your account.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="input-field-dark pl-12"
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="input-field-dark pl-12"
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-600/20 flex items-center justify-center">
                <HiCheckCircle className="w-10 h-10 text-accent-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
              <p className="text-gray-400 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary px-8"
              >
                Sign In
              </button>
            </div>
          )}

          {step !== 4 && (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 mt-6 text-gray-400 hover:text-white transition-colors"
            >
              <HiArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
