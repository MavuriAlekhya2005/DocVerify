import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX, HiShieldCheck, HiUpload, HiCollection, HiCog } from 'react-icons/hi';
import Logo from './Logo';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Check if we're on landing page
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Landing page nav links
  const landingLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Security', href: '#security' },
  ];

  // Main app nav links
  const appLinks = [
    { name: 'Verify', href: '/verifier', icon: HiShieldCheck },
    { name: 'Upload', href: '/dashboard/upload', icon: HiUpload },
    { name: 'My Documents', href: '/dashboard/certificates', icon: HiCollection },
    { name: 'Admin', href: '/admin', icon: HiCog },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || !isLandingPage
          ? 'bg-dark-200/80 backdrop-blur-xl border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-bold text-white font-display">DocVerify</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {isLandingPage ? (
              // Landing page links
              landingLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5"
                >
                  {link.name}
                </a>
              ))
            ) : (
              // App navigation links
              appLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname.startsWith(link.href)
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </Link>
              ))
            )}
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {isLandingPage ? (
              <>
                <Link
                  to="/verifier"
                  className="flex items-center gap-2 text-accent-400 hover:text-accent-300 transition-colors duration-300 text-sm font-medium px-3 py-2 rounded-lg hover:bg-accent-500/10"
                >
                  <HiShieldCheck className="w-4 h-4" />
                  Verify Now
                </Link>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium px-3 py-2"
                >
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/verifier"
                  className="flex items-center gap-2 btn-accent text-sm py-2"
                >
                  <HiShieldCheck className="w-4 h-4" />
                  Verify
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  <Logo className="w-6 h-6" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            {isMobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-200/95 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-4 py-4 space-y-1">
              {/* Quick Actions */}
              <div className="pb-3 mb-3 border-b border-white/10">
                <Link
                  to="/verifier"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-accent-400 hover:text-accent-300 py-3 px-3 rounded-lg hover:bg-accent-500/10"
                >
                  <HiShieldCheck className="w-5 h-5" />
                  <span className="font-medium">Verify Certificate</span>
                </Link>
              </div>
              
              {/* App Links */}
              {appLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 py-3 px-3 rounded-lg transition-colors ${
                    location.pathname.startsWith(link.href)
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}
              
              {/* Landing Page Links (if on landing) */}
              {isLandingPage && (
                <>
                  <div className="py-2 border-t border-white/10 mt-2">
                    {landingLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-gray-300 hover:text-white transition-colors py-2 px-3"
                      >
                        {link.name}
                      </a>
                    ))}
                  </div>
                </>
              )}
              
              {/* Auth Section */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-center text-gray-300 hover:text-white py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block btn-primary text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
