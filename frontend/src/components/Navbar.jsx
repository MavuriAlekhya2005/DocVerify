import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX, HiShieldCheck, HiUpload, HiCollection, HiCog, HiLogout, HiViewGrid, HiUser, HiSwitchHorizontal } from 'react-icons/hi';
import Logo from './Logo';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, accounts, logout, logoutAll, switchAccount, removeAccount } = useAuth();

  // Get authentication state
  const isAuthenticated = !!user;

  // Check if we're on landing page
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogoutAll = () => {
    logoutAll();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleSwitchAccount = (accountId) => {
    switchAccount(accountId);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleRemoveAccount = (accountId) => {
    removeAccount(accountId);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Landing page nav links
  const landingLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Security', href: '#security' },
  ];

  // Main app nav links
  const appLinks = [
    { name: 'Verify', href: '/verify', icon: HiShieldCheck },
    { name: 'Upload', href: '/dashboard/upload', icon: HiUpload },
    { name: 'My Documents', href: '/dashboard/certificates', icon: HiCollection },
  ];

  // Add admin link if user is admin
  if (user?.role === 'admin' || user?.role === 'institution') {
    appLinks.push({ name: 'Admin', href: '/admin', icon: HiCog });
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || !isLandingPage
          ? 'glass-header' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-bold text-white font-display text-glow-sm">DocVerify</span>
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
            {/* Verify Now Button - Always visible */}
            <Link
              to="/verify"
              className="flex items-center gap-2 text-accent-400 hover:text-accent-300 transition-colors duration-300 text-sm font-medium px-3 py-2 rounded-lg hover:bg-accent-500/10"
            >
              <HiShieldCheck className="w-4 h-4" />
              Verify Now
            </Link>
            
            {isAuthenticated ? (
              // Logged-in user menu
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 
                    flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(user?.name)}
                  </div>
                  <span className="text-white text-sm font-medium hidden lg:block">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                </button>
                
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 z-[100] rounded-xl overflow-hidden"
                        style={{
                          background: 'rgba(15, 23, 42, 0.95)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          boxShadow: '0 0 20px rgba(99, 102, 241, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)'
                        }}
                      >
                        <div className="p-3 border-b border-primary-500/30">
                          <p className="text-white font-medium text-sm">{user?.name}</p>
                          <p className="text-gray-400 text-xs">{user?.email}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 
                              hover:text-white hover:bg-white/5 transition-all"
                          >
                            <HiViewGrid className="w-4 h-4" />
                            Dashboard
                          </Link>
                          
                          {/* Account Switcher */}
                          {accounts.length > 1 && (
                            <>
                              <div className="border-t border-white/10 my-2"></div>
                              <div className="px-3 py-1">
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Switch Account</p>
                                {accounts.filter(acc => acc.id !== user?.id && acc.user.email !== user?.email).map((account) => (
                                  <button
                                    key={account.id}
                                    onClick={() => handleSwitchAccount(account.id)}
                                    className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-gray-300 
                                      hover:text-white hover:bg-white/5 transition-all text-left"
                                  >
                                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 
                                      flex items-center justify-center text-white font-bold text-xs">
                                      {account.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm truncate">{account.user.name}</p>
                                      <p className="text-xs text-gray-400 truncate">{account.user.email}</p>
                                    </div>
                                    <HiSwitchHorizontal className="w-4 h-4" />
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                          
                          <div className="border-t border-white/10 my-2"></div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg 
                              text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                          >
                            <HiLogout className="w-4 h-4" />
                            Sign Out
                          </button>
                          {accounts.length > 1 && (
                            <button
                              onClick={handleLogoutAll}
                              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg 
                                text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                            >
                              <HiLogout className="w-4 h-4" />
                              Sign Out All
                            </button>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // Not logged in - show auth buttons
              <>
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
              {/* User Info (if logged in) */}
              {isAuthenticated && (
                <div className="pb-3 mb-3 border-b border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 
                    flex items-center justify-center text-white font-bold">
                    {getInitials(user?.name)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{user?.name}</p>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="pb-3 mb-3 border-b border-white/10">
                <Link
                  to="/verify"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-accent-400 hover:text-accent-300 py-3 px-3 rounded-lg hover:bg-accent-500/10"
                >
                  <HiShieldCheck className="w-5 h-5" />
                  <span className="font-medium">Verify Certificate</span>
                </Link>
              </div>
              
              {/* App Links (if authenticated) */}
              {isAuthenticated && appLinks.map((link) => (
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
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full text-red-400 hover:text-red-300 py-3 rounded-lg hover:bg-red-500/10"
                  >
                    <HiLogout className="w-5 h-5" />
                    Sign Out
                  </button>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
