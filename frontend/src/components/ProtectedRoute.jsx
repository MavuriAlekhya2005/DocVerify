import { Navigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const isAuthenticated = api.isAuthenticated();
  const user = api.getCurrentUser();

  // Not logged in - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if specified
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin' || user.role === 'institution') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
