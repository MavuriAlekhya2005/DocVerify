import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiArrowLeft, HiCheckCircle } from 'react-icons/hi';
import Logo from '../../components/Logo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
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

          {!isSubmitted ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Forgot your password?</h1>
              <p className="text-gray-400 mb-8">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-600/20 flex items-center justify-center">
                <HiCheckCircle className="w-10 h-10 text-accent-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-gray-400 mb-6">
                We've sent a password reset link to<br />
                <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Didn't receive the email? Check your spam folder or{' '}
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="text-primary-400 hover:text-primary-300"
                >
                  try again
                </button>
              </p>
            </div>
          )}

          <Link 
            to="/login" 
            className="flex items-center justify-center gap-2 mt-6 text-gray-400 hover:text-white transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
