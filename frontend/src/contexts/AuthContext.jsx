import { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext(null);

/**
 * AuthProvider - Handles session management and auto-logout
 * Checks for session timeout and redirects to login when expired
 */
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
  const [user, setUser] = useState(api.getCurrentUser());

  // Check session and handle expiry
  const checkSession = useCallback(() => {
    const wasAuthenticated = isAuthenticated;
    const sessionValid = api.checkSession();
    
    if (wasAuthenticated && !sessionValid) {
      setIsAuthenticated(false);
      setUser(null);
      toast.error('Session expired. Please log in again.');
      
      // Redirect to login with return URL
      const returnUrl = location.pathname !== '/login' ? location.pathname : '/dashboard';
      navigate('/login', { state: { from: returnUrl } });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  // Update activity on user interactions
  const updateActivity = useCallback(() => {
    if (api.isAuthenticated()) {
      api.checkSession();
    }
  }, []);

  // Set up session check interval and activity listeners
  useEffect(() => {
    // Check session every minute
    const intervalId = setInterval(checkSession, 60000);

    // Update activity on user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      clearInterval(intervalId);
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [checkSession, updateActivity]);

  // Update state when auth changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(api.isAuthenticated());
      setUser(api.getCurrentUser());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Login handler
  const login = async (email, password) => {
    const result = await api.login(email, password);
    if (result.success) {
      setIsAuthenticated(true);
      setUser(result.data.user);
    }
    return result;
  };

  // Logout handler
  const logout = useCallback(() => {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    checkSession,
    getSessionTimeRemaining: api.getSessionTimeRemaining,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
