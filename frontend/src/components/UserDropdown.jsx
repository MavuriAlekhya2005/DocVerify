import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiUser, 
  HiLogout, 
  HiCog, 
  HiSwitchHorizontal,
  HiChevronDown,
  HiOfficeBuilding,
  HiViewGrid
} from 'react-icons/hi';
import api from '../services/api';

/**
 * UserDropdown - User profile dropdown with sign out and panel switching
 * Replaces the old separate signout button and PortalSwitcher
 */
const UserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = api.getCurrentUser();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCurrentPanel = () => {
    if (location.pathname.startsWith('/admin')) return 'admin';
    return 'user';
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'institution';
  const currentPanel = getCurrentPanel();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all group"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 
          flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20">
          {getInitials(user?.name)}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-white font-medium text-sm">{user?.name || 'User'}</div>
          <div className="text-gray-400 text-xs capitalize">{user?.role || 'user'}</div>
        </div>
        <HiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 z-[100] rounded-xl overflow-hidden"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* User Info Header */}
            <div className="p-4 border-b border-primary-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 
                  flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(user?.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{user?.name || 'User'}</p>
                  <p className="text-gray-400 text-sm truncate">{user?.email || ''}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {/* Panel Switcher - Only for admins */}
              {isAdmin && (
                <>
                  <div className="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider font-medium">
                    Switch Panel
                  </div>
                  
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                      ${currentPanel === 'user' 
                        ? 'bg-primary-600/20 text-primary-400' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <HiViewGrid className="w-5 h-5" />
                    <span>User Panel</span>
                    {currentPanel === 'user' && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </Link>
                  
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                      ${currentPanel === 'admin' 
                        ? 'bg-primary-600/20 text-primary-400' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <HiOfficeBuilding className="w-5 h-5" />
                    <span>Admin Panel</span>
                    {currentPanel === 'admin' && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </Link>

                  <div className="my-2 border-t border-primary-500/20" />
                </>
              )}

              {/* Settings Link */}
              <Link
                to={currentPanel === 'admin' ? '/admin/settings' : '/dashboard/settings'}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 
                  hover:text-white hover:bg-white/5 transition-all"
              >
                <HiCog className="w-5 h-5" />
                <span>Settings</span>
              </Link>

              {/* Sign Out */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg 
                  text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
              >
                <HiLogout className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDropdown;
